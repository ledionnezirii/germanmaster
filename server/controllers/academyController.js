const Academy = require("../models/Academy")
const User = require("../models/User")
const crypto = require("crypto")
const sendStudentEmail = require("../utils/sendStudentEmail")

// ── Create Academy ──
exports.createAcademy = async (req, res) => {
  try {
    const { name, description } = req.body
    const userId = req.user.id

    const user = await User.findById(userId)
    if (user.role !== "academyAdmin" && user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only academy admins can create academies",
      })
    }

    const academy = await Academy.create({
      name,
      description,
      owner: userId,
    })

    res.status(201).json({
      success: true,
      data: academy,
      message: "Academy created successfully",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

// ── Get all academies for the logged-in user ──
exports.getMyAcademies = async (req, res) => {
  try {
    const userId = req.user.id
    const user = await User.findById(userId)

    let academies

    if (user.role === "academyAdmin" || user.role === "admin") {
      // Academy admins see academies they own
      academies = await Academy.find({ owner: userId })
        .populate("owner", "emri mbiemri email")
        .populate("groups.teacher", "emri mbiemri email")
    } else if (user.role === "teacher") {
      // Teachers see groups they teach
      academies = await Academy.find({ "groups.teacher": userId })
        .populate("owner", "emri mbiemri email")
        .populate("groups.teacher", "emri mbiemri email")
    } else {
      // Students see groups they're members of
      academies = await Academy.find({ "groups.members": userId })
        .populate("owner", "emri mbiemri email")
        .populate("groups.teacher", "emri mbiemri email")
    }

    res.status(200).json({
      success: true,
      data: academies,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

// ── Get single academy ──
exports.getAcademy = async (req, res) => {
  try {
    const { academyId } = req.params

    const academy = await Academy.findById(academyId)
      .populate("owner", "emri mbiemri email")
      .populate("groups.teacher", "emri mbiemri email xp level avatarStyle")
      .populate("groups.members", "emri mbiemri email xp level avatarStyle")

    if (!academy) {
      return res.status(404).json({
        success: false,
        message: "Academy not found",
      })
    }

    res.status(200).json({
      success: true,
      data: academy,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

// ── Create Group (Academy Admin assigns teacher and generates PIN) ──
exports.createGroup = async (req, res) => {
  try {
    const { academyId } = req.params
    const { name, description, teacherId } = req.body
    const userId = req.user.id

    const academy = await Academy.findById(academyId)

    if (!academy) {
      return res.status(404).json({
        success: false,
        message: "Academy not found",
      })
    }

    // Only academy owner can create groups
    if (academy.owner.toString() !== userId) {
      const user = await User.findById(userId)
      if (user.role !== "admin" && user.role !== "academyAdmin") {
        return res.status(403).json({
          success: false,
          message: "Only academy admins can create groups",
        })
      }
    }

    // Validate teacher exists and has teacher role
    const teacher = await User.findById(teacherId)
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      })
    }

    if (teacher.role !== "teacher") {
      return res.status(400).json({
        success: false,
        message: "Selected user is not a teacher",
      })
    }

    // Generate unique 6-char teacher PIN for teacher to access group
    let teacherPin
    let isPinUnique = false
    while (!isPinUnique) {
      teacherPin = Math.floor(100000 + Math.random() * 900000).toString()
      const existing = await Academy.findOne({ "groups.teacherPin": teacherPin })
      if (!existing) isPinUnique = true
    }

    // Generate unique 6-char code for students to join
    let teacherCode
    let isCodeUnique = false
    while (!isCodeUnique) {
      teacherCode = crypto.randomBytes(3).toString("hex").toUpperCase()
      const existing = await Academy.findOne({ "groups.teacherCode": teacherCode })
      if (!existing) isCodeUnique = true
    }

    const newGroup = {
      name,
      description,
      teacher: teacherId,
      teacherPin,
      teacherCode,
      teacherUnlocked: false, // Teacher must unlock with PIN first
      members: [],
      tasks: [],
      invitations: [],
    }

    academy.groups.push(newGroup)
    await academy.save()

    const updatedAcademy = await Academy.findById(academyId)
      .populate("owner", "emri mbiemri email")
      .populate("groups.teacher", "emri mbiemri email")

    res.status(201).json({
      success: true,
      data: updatedAcademy,
      teacherPin, // Return PIN so admin can share with teacher
      message: `Group created. Teacher PIN: ${teacherPin} (share with teacher)`,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

// ── Teacher unlocks their group with PIN ──
exports.unlockGroupWithPin = async (req, res) => {
  try {
    const { academyId, groupId } = req.params
    const { teacherPin } = req.body
    const userId = req.user.id

    const user = await User.findById(userId)
    if (user.role !== "teacher") {
      return res.status(403).json({
        success: false,
        message: "Only teachers can unlock groups",
      })
    }

    const academy = await Academy.findById(academyId)
    if (!academy) {
      return res.status(404).json({
        success: false,
        message: "Academy not found",
      })
    }

    const group = academy.groups.id(groupId)
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      })
    }

    // Check if user is the assigned teacher
    if (group.teacher.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You are not the teacher of this group",
      })
    }

    // Verify PIN
    if (group.teacherPin !== teacherPin) {
      return res.status(401).json({
        success: false,
        message: "Invalid PIN code",
      })
    }

    group.teacherUnlocked = true
    await academy.save()

    res.status(200).json({
      success: true,
      message: "Group unlocked successfully",
      data: academy,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

// ── Invite students to group (Teacher only, after unlocking) ──
exports.inviteToGroup = async (req, res) => {
  try {
    const { academyId, groupId } = req.params
    const { email } = req.body
    const userId = req.user.id

    const academy = await Academy.findById(academyId)

    if (!academy) {
      return res.status(404).json({
        success: false,
        message: "Academy not found",
      })
    }

    const group = academy.groups.id(groupId)

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      })
    }

    // Check if user is the teacher
    if (group.teacher.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Only the group teacher can invite students",
      })
    }

    // Check if teacher has unlocked the group
    if (!group.teacherUnlocked) {
      return res.status(403).json({
        success: false,
        message: "You must unlock the group with your PIN before inviting students",
      })
    }

    // Check if already invited
    const alreadyInvited = group.invitations.find((inv) => inv.email === email && inv.status === "pending")
    if (alreadyInvited) {
      return res.status(400).json({
        success: false,
        message: "User already has a pending invitation",
      })
    }

    // Check if already a member
    const existingUser = await User.findOne({ email })
    if (existingUser && group.members.includes(existingUser._id.toString())) {
      return res.status(400).json({
        success: false,
        message: "User is already a member of this group",
      })
    }

    group.invitations.push({
      email,
      status: "pending",
    })

    await academy.save()

    const inviteLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/academy/join/${academyId}/${groupId}?email=${encodeURIComponent(email)}`

    const teacher = await User.findById(userId)
    const teacherName = teacher ? `${teacher.emri} ${teacher.mbiemri}` : "Your Teacher"

    const emailSent = await sendStudentEmail({
      to: email,
      teacherName,
      groupName: group.name,
      academyName: academy.name,
      teacherCode: group.teacherCode,
      inviteLink,
    })

    res.status(200).json({
      success: true,
      data: academy,
      inviteLink,
      emailSent,
      message: emailSent
        ? "Invitation email sent successfully!"
        : "Invitation created but email could not be sent. Share the invite link manually.",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

// ── Student joins group by teacher code ──
exports.joinByTeacherCode = async (req, res) => {
  try {
    const { teacherCode } = req.body
    const userId = req.user.id

    if (!teacherCode) {
      return res.status(400).json({
        success: false,
        message: "Teacher code is required",
      })
    }

    const user = await User.findById(userId)

    // Find the academy containing a group with this teacher code
    const academy = await Academy.findOne({ "groups.teacherCode": teacherCode.toUpperCase() })

    if (!academy) {
      return res.status(404).json({
        success: false,
        message: "Invalid teacher code. No group found.",
      })
    }

    const group = academy.groups.find((g) => g.teacherCode === teacherCode.toUpperCase())

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      })
    }

    // Check if teacher has unlocked the group
    if (!group.teacherUnlocked) {
      return res.status(403).json({
        success: false,
        message: "This group is not yet active. The teacher must unlock it first.",
      })
    }

    // Check if already a member
    if (group.members.map((m) => m.toString()).includes(userId)) {
      return res.status(400).json({
        success: false,
        message: "You are already a member of this group",
      })
    }

    // Check if the user is the teacher
    if (group.teacher.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: "You are the teacher of this group",
      })
    }

    // Add user to group members
    group.members.push(userId)

    // If there was a pending invitation, mark it accepted
    const invitation = group.invitations.find((inv) => inv.email === user.email && inv.status === "pending")
    if (invitation) {
      invitation.status = "accepted"
    }

    await academy.save()

    const updatedAcademy = await Academy.findById(academy._id)
      .populate("owner", "emri mbiemri email")
      .populate("groups.teacher", "emri mbiemri email")
      .populate("groups.members", "emri mbiemri email xp level avatarStyle")

    res.status(200).json({
      success: true,
      data: updatedAcademy,
      message: `Joined group "${group.name}" successfully!`,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

// ── Accept group invitation (via link) ──
exports.acceptInvitation = async (req, res) => {
  try {
    const { academyId, groupId } = req.params
    const userId = req.user.id

    const user = await User.findById(userId)
    const academy = await Academy.findById(academyId)

    if (!academy) {
      return res.status(404).json({
        success: false,
        message: "Academy not found",
      })
    }

    const group = academy.groups.id(groupId)

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      })
    }

    // Check if teacher has unlocked the group
    if (!group.teacherUnlocked) {
      return res.status(403).json({
        success: false,
        message: "This group is not yet active. The teacher must unlock it first.",
      })
    }

    // Find invitation
    const invitation = group.invitations.find((inv) => inv.email === user.email && inv.status === "pending")

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: "No pending invitation found for your email",
      })
    }

    // Add user to group members
    if (!group.members.includes(userId)) {
      group.members.push(userId)
    }

    invitation.status = "accepted"

    await academy.save()

    res.status(200).json({
      success: true,
      data: academy,
      message: "Joined group successfully",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

// ── Create Task (Teacher only, after unlocking) ──
exports.createTask = async (req, res) => {
  try {
    const { academyId, groupId } = req.params
    const { title, description, xpReward, dueDate } = req.body
    const userId = req.user.id

    const academy = await Academy.findById(academyId)

    if (!academy) {
      return res.status(404).json({
        success: false,
        message: "Academy not found",
      })
    }

    const group = academy.groups.id(groupId)

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      })
    }

    // Check if user is the teacher
    if (group.teacher.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Only the teacher can create tasks",
      })
    }

    // Check if teacher has unlocked the group
    if (!group.teacherUnlocked) {
      return res.status(403).json({
        success: false,
        message: "You must unlock the group with your PIN before creating tasks",
      })
    }

    const newTask = {
      title,
      description,
      xpReward: xpReward || 50,
      dueDate,
      createdBy: userId,
      completedBy: [],
    }

    group.tasks.push(newTask)
    await academy.save()

    res.status(201).json({
      success: true,
      data: academy,
      message: "Task created successfully",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

// ── Complete Task (Students only) ──
exports.completeTask = async (req, res) => {
  try {
    const { academyId, groupId, taskId } = req.params
    const userId = req.user.id

    const academy = await Academy.findById(academyId)

    if (!academy) {
      return res.status(404).json({
        success: false,
        message: "Academy not found",
      })
    }

    const group = academy.groups.id(groupId)

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      })
    }

    // Check if user is member of the group
    if (!group.members.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this group",
      })
    }

    const task = group.tasks.id(taskId)

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      })
    }

    // Check if already completed
    const alreadyCompleted = task.completedBy.find((comp) => comp.userId.toString() === userId)

    if (alreadyCompleted) {
      return res.status(400).json({
        success: false,
        message: "Task already completed",
      })
    }

    // Add to completed
    task.completedBy.push({
      userId,
      completedAt: new Date(),
    })

    await academy.save()

    // Award XP to user
    const user = await User.findById(userId)
    user.xp += task.xpReward
    user.weeklyXp += task.xpReward
    user.monthlyXp += task.xpReward
    await user.save()

    res.status(200).json({
      success: true,
      data: academy,
      message: `Task completed! You earned ${task.xpReward} XP`,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

// ── Get group leaderboard ──
exports.getGroupLeaderboard = async (req, res) => {
  try {
    const { academyId, groupId } = req.params

    const academy = await Academy.findById(academyId)

    if (!academy) {
      return res.status(404).json({
        success: false,
        message: "Academy not found",
      })
    }

    const group = academy.groups.id(groupId)

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      })
    }

    // Get all members with their stats
    const members = await User.find({
      _id: { $in: group.members },
    }).select("emri mbiemri email xp level avatarStyle")

    // Sort by XP
    const leaderboard = members.sort((a, b) => b.xp - a.xp)

    res.status(200).json({
      success: true,
      data: leaderboard,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

// ── Delete Group (Academy Admin only) ──
exports.deleteGroup = async (req, res) => {
  try {
    const { academyId, groupId } = req.params
    const userId = req.user.id

    const academy = await Academy.findById(academyId)

    if (!academy) {
      return res.status(404).json({
        success: false,
        message: "Academy not found",
      })
    }

    const group = academy.groups.id(groupId)

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      })
    }

    // Only academy owner can delete groups
    if (academy.owner.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Only the academy admin can delete groups",
      })
    }

    group.remove()
    await academy.save()

    res.status(200).json({
      success: true,
      data: academy,
      message: "Group deleted successfully",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

// ── Get group info for invitation page ──
exports.getGroupInviteInfo = async (req, res) => {
  try {
    const { academyId, groupId } = req.params

    const academy = await Academy.findById(academyId)
      .populate("owner", "emri mbiemri email")
      .populate("groups.teacher", "emri mbiemri email")

    if (!academy) {
      return res.status(404).json({
        success: false,
        message: "Academy not found",
      })
    }

    const group = academy.groups.id(groupId)

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      })
    }

    const teacher = group.teacher

    res.status(200).json({
      success: true,
      data: {
        academyName: academy.name,
        academyDescription: academy.description,
        groupName: group.name,
        groupDescription: group.description,
        memberCount: group.members.length,
        teacherName: teacher ? `${teacher.emri} ${teacher.mbiemri}` : "Unknown",
        teacherCode: group.teacherCode,
        isUnlocked: group.teacherUnlocked,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

