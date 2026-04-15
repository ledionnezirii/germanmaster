const Academy = require("../models/Academy");
const Group = require("../models/Group");
const User = require("../models/User");

// ─────────────────────────────────────────────────────────────
// ACADEMY ENDPOINTS  (admin only)
// ─────────────────────────────────────────────────────────────

// POST /api/academy
// Create a new academy (main admin)
exports.createAcademy = async (req, res) => {
  try {
    const { name, description } = req.body;

    const academy = await Academy.create({
      name,
      description,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, data: academy });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/academy
// Get all academies (admin sees all; academyAdmin sees only theirs)
exports.getAllAcademies = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === "academyAdmin") {
      filter.academyAdmin = req.user._id;
    }

    const academies = await Academy.find(filter)
      .populate("academyAdmin", "emri mbiemri email")
      .populate("createdBy", "emri mbiemri email")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: academies });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/academy/:id
exports.getAcademyById = async (req, res) => {
  try {
    const academy = await Academy.findById(req.params.id)
      .populate("academyAdmin", "emri mbiemri email")
      .populate("createdBy", "emri mbiemri email");

    if (!academy) {
      return res.status(404).json({ success: false, message: "Academy not found" });
    }

    // academyAdmin can only see their own academy
    if (
      req.user.role === "academyAdmin" &&
      String(academy.academyAdmin) !== String(req.user._id)
    ) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    res.status(200).json({ success: true, data: academy });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/academy/:id
exports.updateAcademy = async (req, res) => {
  try {
    const { name, description, isActive } = req.body;

    const academy = await Academy.findByIdAndUpdate(
      req.params.id,
      { name, description, isActive },
      { new: true, runValidators: true }
    );

    if (!academy) {
      return res.status(404).json({ success: false, message: "Academy not found" });
    }

    res.status(200).json({ success: true, data: academy });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/academy/:id
exports.deleteAcademy = async (req, res) => {
  try {
    const academy = await Academy.findByIdAndDelete(req.params.id);
    if (!academy) {
      return res.status(404).json({ success: false, message: "Academy not found" });
    }

    // Remove all groups under this academy
    await Group.deleteMany({ academyId: req.params.id });

    // Clear academyId & groupId from students who were in these groups
    await User.updateMany(
      { academyId: req.params.id },
      { $unset: { academyId: "", groupId: "" } }
    );

    res.status(200).json({ success: true, message: "Academy deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/academy/:id/assign-admin
// Assign an academyAdmin user to an academy (main admin only)
exports.assignAcademyAdmin = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    if (user.role !== "academyAdmin") {
      return res
        .status(400)
        .json({ success: false, message: "User must have the academyAdmin role" });
    }

    const academy = await Academy.findByIdAndUpdate(
      req.params.id,
      { academyAdmin: userId },
      { new: true }
    ).populate("academyAdmin", "emri mbiemri email");

    if (!academy) {
      return res.status(404).json({ success: false, message: "Academy not found" });
    }

    // Also stamp the user's academyId so they know which academy they manage
    await User.findByIdAndUpdate(userId, { academyId: academy._id });

    res.status(200).json({ success: true, data: academy });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GROUP ENDPOINTS  (academyAdmin / teacher)
// ─────────────────────────────────────────────────────────────

// Helper: verify the requesting teacher owns the group's academy
async function verifyTeacherOwnsGroup(groupId, teacherId) {
  const group = await Group.findById(groupId);
  if (!group) return null;
  if (String(group.teacherId) !== String(teacherId)) return null;
  return group;
}

// POST /api/academy/groups
// Create a group inside the teacher's academy
exports.createGroup = async (req, res) => {
  try {
    const { name, level } = req.body;

    // Find the academy that belongs to this teacher
    const academy = await Academy.findOne({ academyAdmin: req.user._id });
    if (!academy) {
      return res
        .status(403)
        .json({ success: false, message: "You have no academy assigned to you" });
    }

    const group = await Group.create({
      name,
      level,
      academyId: academy._id,
      teacherId: req.user._id,
    });

    res.status(201).json({ success: true, data: group });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/academy/groups
// Get all groups for the logged-in teacher (with student count)
exports.getMyGroups = async (req, res) => {
  try {
    const groups = await Group.find({ teacherId: req.user._id })
      .populate("academyId", "name")
      .sort({ createdAt: -1 });

    // Attach student count to each group
    const result = groups.map((g) => ({
      ...g.toObject(),
      studentCount: g.students.length,
    }));

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/academy/groups/:groupId
// Get one group with full student list
exports.getGroupById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId)
      .populate("academyId", "name")
      .populate("students", "emri mbiemri email xp level streakCount");

    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    if (
      req.user.role !== "admin" &&
      String(group.teacherId) !== String(req.user._id)
    ) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    res.status(200).json({ success: true, data: group });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/academy/groups/:groupId
exports.updateGroup = async (req, res) => {
  try {
    const group = await verifyTeacherOwnsGroup(req.params.groupId, req.user._id);
    if (!group) {
      return res
        .status(403)
        .json({ success: false, message: "Group not found or access denied" });
    }

    const { name, level, isActive } = req.body;
    Object.assign(group, { name, level, isActive });
    await group.save();

    res.status(200).json({ success: true, data: group });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/academy/groups/:groupId
exports.deleteGroup = async (req, res) => {
  try {
    const group = await verifyTeacherOwnsGroup(req.params.groupId, req.user._id);
    if (!group) {
      return res
        .status(403)
        .json({ success: false, message: "Group not found or access denied" });
    }

    // Remove groupId from all students in this group
    await User.updateMany(
      { _id: { $in: group.students } },
      { $unset: { groupId: "" } }
    );

    await Group.findByIdAndDelete(req.params.groupId);

    res.status(200).json({ success: true, message: "Group deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/academy/groups/:groupId/students
// Add a student to the group by email or userId
exports.addStudentToGroup = async (req, res) => {
  try {
    const group = await verifyTeacherOwnsGroup(req.params.groupId, req.user._id);
    if (!group) {
      return res
        .status(403)
        .json({ success: false, message: "Group not found or access denied" });
    }

    const { email, userId } = req.body;

    const student = email
      ? await User.findOne({ email: email.toLowerCase() })
      : await User.findById(userId);

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    if (group.students.includes(student._id)) {
      return res
        .status(400)
        .json({ success: false, message: "Student is already in this group" });
    }

    group.students.push(student._id);
    await group.save();

    // Stamp the student with academyId and groupId
    await User.findByIdAndUpdate(student._id, {
      academyId: group.academyId,
      groupId: group._id,
    });

    res.status(200).json({
      success: true,
      message: "Student added",
      data: { studentId: student._id, name: `${student.emri} ${student.mbiemri}` },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/academy/groups/:groupId/students/:studentId
exports.removeStudentFromGroup = async (req, res) => {
  try {
    const group = await verifyTeacherOwnsGroup(req.params.groupId, req.user._id);
    if (!group) {
      return res
        .status(403)
        .json({ success: false, message: "Group not found or access denied" });
    }

    group.students = group.students.filter(
      (id) => String(id) !== req.params.studentId
    );
    await group.save();

    // Clear groupId from student (keep academyId in case they're in another group)
    await User.findByIdAndUpdate(req.params.studentId, {
      $unset: { groupId: "" },
    });

    res.status(200).json({ success: true, message: "Student removed from group" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// LEADERBOARD
// GET /api/academy/groups/:groupId/leaderboard
// Returns all students with their full activity stats, sorted by XP
// ─────────────────────────────────────────────────────────────
exports.getGroupLeaderboard = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    if (
      req.user.role !== "admin" &&
      String(group.teacherId) !== String(req.user._id)
    ) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // Pull all stats fields we care about from the User model
    const students = await User.find(
      { _id: { $in: group.students } },
      {
        emri: 1,
        mbiemri: 1,
        email: 1,
        xp: 1,
        weeklyXp: 1,
        monthlyXp: 1,
        level: 1,
        streakCount: 1,
        completedTests: 1,
        studyHours: 1,
        avatarStyle: 1,
        // Arrays — we only need the length; we'll compute below
        finishedSentences: 1,
        passedTranslatedTexts: 1,
        listenTestsPassed: 1,
        completedPronunciationPackages: 1,
        grammarFinished: 1,
        completedQuizzes: 1,
        learnedWords: 1,
        phrasesFinished: 1,
        puzzleCompleted: 1,
        finishedDialogues: 1,
        finishedVideos: 1,
        finishedStories: 1,
        finishedWordAudio: 1,
        categoryFinished: 1,
        completedStructures: 1,
        finishedCreateWord: 1,
        quizStats: 1,
        wordRaceStats: 1,
        lastLogin: 1,
      }
    ).lean();

    // Shape the leaderboard data — count arrays, attach rank
    const leaderboard = students
      .map((s) => ({
        _id: s._id,
        name: `${s.emri} ${s.mbiemri}`,
        email: s.email,
        avatarStyle: s.avatarStyle,
        level: s.level,
        lastLogin: s.lastLogin,

        // ── XP & engagement ──
        xp: s.xp || 0,
        weeklyXp: s.weeklyXp || 0,
        monthlyXp: s.monthlyXp || 0,
        streakCount: s.streakCount || 0,
        studyHours: s.studyHours || 0,
        completedTests: s.completedTests || 0,

        // ── Activity counts ──
        sentencesFinished: (s.finishedSentences || []).length,
        textsTranslated: (s.passedTranslatedTexts || []).length,
        listenTestsPassed: (s.listenTestsPassed || []).length,
        pronunciationPackages: (s.completedPronunciationPackages || []).length,
        grammarTopics: (s.grammarFinished || []).length,
        quizzesCompleted: (s.completedQuizzes || []).length,
        wordsLearned: (s.learnedWords || []).length,
        phrasesFinished: (s.phrasesFinished || []).length,
        puzzlesCompleted: (s.puzzleCompleted || []).length,
        dialoguesFinished: (s.finishedDialogues || []).length,
        videosFinished: (s.finishedVideos || []).length,
        storiesFinished: (s.finishedStories || []).length,
        wordAudioFinished: (s.finishedWordAudio || []).length,
        categoriesFinished: (s.categoryFinished || []).length,
        structuresCompleted: (s.completedStructures || []).length,
        createWordFinished: (s.finishedCreateWord || []).length,

        // ── Game stats ──
        quizStats: s.quizStats || { totalQuizzes: 0, wins: 0, correctAnswers: 0 },
        wordRaceStats: s.wordRaceStats || { totalRaces: 0, wins: 0, correctWords: 0 },
      }))
      .sort((a, b) => b.xp - a.xp)
      .map((s, index) => ({ ...s, rank: index + 1 }));

    res.status(200).json({
      success: true,
      data: {
        groupName: group.name,
        level: group.level,
        totalStudents: leaderboard.length,
        leaderboard,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// POST /api/academy/groups/join
exports.joinGroupByCode = async (req, res) => {
  try {
    const { joinCode } = req.body;
    const group = await Group.findOne({ joinCode: joinCode.toUpperCase() });
    if (!group) return res.status(404).json({ success: false, message: "Invalid join code" });
    if (group.students.includes(req.user._id))
      return res.status(400).json({ success: false, message: "Already in this group" });

    group.students.push(req.user._id);
    await group.save();

    await User.findByIdAndUpdate(req.user._id, {
      academyId: group.academyId,
      groupId: group._id,
    });

    res.status(200).json({ success: true, message: "Joined group!", data: group });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};// GET /api/academy/groups/mine
exports.getMyGroup = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.groupId) return res.status(200).json({ success: true, data: null });

    const group = await Group.findById(user.groupId)
      .populate("academyId", "name");

    res.status(200).json({ success: true, data: group });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// ─────────────────────────────────────────────────────────────
// ADMIN: get any group's leaderboard by group id
// GET /api/academy/admin/groups/:groupId/leaderboard
// ─────────────────────────────────────────────────────────────
exports.adminGetGroupLeaderboard = exports.getGroupLeaderboard;