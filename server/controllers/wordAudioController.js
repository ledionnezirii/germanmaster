const WordAudioSet = require("../models/WordAudio");
const User = require("../models/User");

const FREE_WORD_AUDIO_LIMIT = 5;

const buildLanguageQuery = (language) => {
  if (!language) return {}
  if (language === "de") {
    return { $or: [{ language: "de" }, { language: { $exists: false } }, { language: null }] }
  }
  return { language }
}

// Get all sets (optionally filter by level)
exports.getAllSets = async (req, res) => {
  try {
    const { level, language } = req.query;
    const langQuery = buildLanguageQuery(language)
    const filter = { ...langQuery };
    if (level) filter.level = level;
    const sets = await WordAudioSet.find(filter).sort({ createdAt: 1 });
    res.json({ success: true, data: sets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single set by ID
exports.getSetById = async (req, res) => {
  try {
    const set = await WordAudioSet.findById(req.params.id);
    if (!set) return res.status(404).json({ success: false, message: "Set not found" });
    res.json({ success: true, data: set });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Submit quiz result for a set
exports.submitQuiz = async (req, res) => {
  try {
    const { setId, score, totalQuestions } = req.body;
    const userId = req.user._id;

    const set = await WordAudioSet.findById(setId);
    if (!set) return res.status(404).json({ success: false, message: "Set not found" });

    const percentage = (score / totalQuestions) * 100;
    const passed = percentage >= 70;

    let xpAwarded = 0;
    let alreadyFinished = false;

    if (passed) {
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ success: false, message: "User not found" });

      if (user.finishedWordAudio && user.finishedWordAudio.map(id => id.toString()).includes(setId.toString())) {
        alreadyFinished = true;
      } else {
        const finishedCount = user.finishedWordAudio ? user.finishedWordAudio.length : 0;
        if (!user.isPaid && finishedCount >= FREE_WORD_AUDIO_LIMIT) {
          return res.json({
            success: true,
            data: {
              passed,
              percentage: Math.round(percentage),
              score,
              totalQuestions,
              xpAwarded: 0,
              alreadyFinished: false,
              limitReached: true,
            },
          });
        }

        xpAwarded = set.xp || 10;
        user.xp = (user.xp || 0) + xpAwarded;
        user.weeklyXp = (user.weeklyXp || 0) + xpAwarded;
        user.monthlyXp = (user.monthlyXp || 0) + xpAwarded;

        if (!user.finishedWordAudio) user.finishedWordAudio = [];
        user.finishedWordAudio.push(setId);
        await user.save();
      }
    }

    res.json({
      success: true,
      data: {
        passed,
        percentage: Math.round(percentage),
        score,
        totalQuestions,
        xpAwarded: alreadyFinished ? 0 : xpAwarded,
        alreadyFinished,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get finished sets for current user
exports.getFinishedSets = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("finishedWordAudio isPaid");
    const finishedIds = user.finishedWordAudio || [];
    res.json({
      success: true,
      data: {
        finishedIds,
        isPaid: user.isPaid || false,
        finishedCount: finishedIds.length,
        freeLimit: FREE_WORD_AUDIO_LIMIT,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ADMIN: Create set
exports.createSet = async (req, res) => {
  try {
    const set = await WordAudioSet.create(req.body);
    res.status(201).json({ success: true, data: set });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ADMIN: Bulk create sets
exports.createBulkSets = async (req, res) => {
  try {
    const { sets } = req.body;
    const created = await WordAudioSet.insertMany(sets);
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ADMIN: Update set
exports.updateSet = async (req, res) => {
  try {
    const set = await WordAudioSet.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!set) return res.status(404).json({ success: false, message: "Set not found" });
    res.json({ success: true, data: set });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ADMIN: Delete set
exports.deleteSet = async (req, res) => {
  try {
    const set = await WordAudioSet.findByIdAndDelete(req.params.id);
    if (!set) return res.status(404).json({ success: false, message: "Set not found" });
    res.json({ success: true, message: "Set deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};