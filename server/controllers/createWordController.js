const CreateWord = require("../models/CreateWord");
const UserWord = require("../models/UserWord");
const User = require("../models/User");
const { addUserXp } = require("./xpController");

const FREE_CREATEWORD_LIMIT = 5;
// Get all CreateWord lessons
// Replace the existing getAllLessons
exports.getAllLessons = async (req, res) => {
  try {
    const { level, language } = req.query;
    const filter = level ? { level } : {};

    if (language) {
      if (language === "de") {
        filter.$or = [
          { language: "de" },
          { language: { $exists: false } },
          { language: null },
        ];
      } else {
        filter.language = language;
      }
    }

    const lessons = await CreateWord.find(filter).sort({ level: 1, createdAt: 1 });
    res.status(200).json({ success: true, data: lessons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get lesson by ID
exports.getLessonById = async (req, res) => {
  try {
    const lesson = await CreateWord.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ success: false, message: "Lesson not found" });
    }
    res.status(200).json({ success: true, data: lesson });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create new lesson (Admin)
exports.createLesson = async (req, res) => {
  try {
    const lesson = await CreateWord.create(req.body);
    res.status(201).json({ success: true, data: lesson });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Bulk create lessons (Admin)
exports.bulkCreateLessons = async (req, res) => {
  try {
    const items = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "Send an array of lessons" });
    }
    const inserted = [];
    const skipped = [];
    for (const item of items) {
      const exists = await CreateWord.findOne({ title: item.title, language: item.language || "de" });
      if (exists) { skipped.push(item.title); continue; }
      const lesson = await CreateWord.create(item);
      inserted.push(lesson);
    }
    res.status(201).json({ success: true, inserted: inserted.length, skipped: skipped.length, skippedTitles: skipped, data: inserted });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update lesson (Admin)
exports.updateLesson = async (req, res) => {
  try {
    const lesson = await CreateWord.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!lesson) {
      return res.status(404).json({ success: false, message: "Lesson not found" });
    }
    res.status(200).json({ success: true, data: lesson });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete lesson (Admin)
exports.deleteLesson = async (req, res) => {
  try {
    const lesson = await CreateWord.findByIdAndDelete(req.params.id);
    if (!lesson) {
      return res.status(404).json({ success: false, message: "Lesson not found" });
    }
    res.status(200).json({ success: true, message: "Lesson deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Submit lesson answers
exports.submitLesson = async (req, res) => {
  try {
    const { lessonId, answers } = req.body;
    const userId = req.user.id;

    const lesson = await CreateWord.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ success: false, message: "Lesson not found" });
    }

    let correctCount = 0;
    const results = answers.map((answer, index) => {
      const word = lesson.words[index];
      const isCorrect = answer.toLowerCase() === word.german.toLowerCase();
      if (isCorrect) correctCount++;
      return { wordIndex: index, userAnswer: answer, isCorrect };
    });

    const totalWords = lesson.words.length;
    const scorePercentage = (correctCount / totalWords) * 100;
    const passed = scorePercentage >= 75;

    let xpAwarded = 0;
    if (passed) {
      xpAwarded = lesson.xp || 50;

      const user = await User.findById(userId);
      const alreadyPassed = user.finishedCreateWord.includes(lessonId);

      if (!alreadyPassed) {
        const completedCount = user.finishedCreateWord.length;
        const now = new Date();
        const hasActiveSubscription =
          user.isPaid ||
          (user.subscriptionExpiresAt && user.subscriptionExpiresAt > now) ||
          user.role === "admin";

        // Free limit check
        if (!hasActiveSubscription && completedCount >= FREE_CREATEWORD_LIMIT) {
          return res.status(200).json({
            success: true,
            data: {
              results,
              correctCount,
              totalWords,
              scorePercentage: Math.round(scorePercentage),
              passed,
              xpAwarded: 0,
              limitReached: true,
            },
          });
        }

        user.finishedCreateWord.push(lessonId);
        user.xp += xpAwarded;
        await addUserXp(userId, xpAwarded);
        await user.save();
      }
    }

    res.status(200).json({
      success: true,
      data: {
        results,
        correctCount,
        totalWords,
        scorePercentage: Math.round(scorePercentage),
        passed,
        xpAwarded,
        limitReached: false,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get user's finished lessons
exports.getFinishedLessons = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).populate("finishedCreateWord");
    // Consider paid if isPaid flag is set OR if subscription is still active
    const now = new Date();
    const hasActiveSubscription =
      user.isPaid ||
      (user.subscriptionExpiresAt && user.subscriptionExpiresAt > now) ||
      user.role === "admin";
    res.status(200).json({
      success: true,
      data: {
        lessons: user.finishedCreateWord,
        isPaid: hasActiveSubscription,
        freeLimit: FREE_CREATEWORD_LIMIT,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get user's personal word list (free)
exports.getMyWords = async (req, res) => {
  try {
    const words = await UserWord.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: words });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add a word to user's personal list (free, unlimited)
exports.addMyWord = async (req, res) => {
  try {
    const { german, translation } = req.body;
    if (!german || !translation) {
      return res.status(400).json({ success: false, message: "German word and translation are required" });
    }
    const word = await UserWord.create({ userId: req.user.id, german, translation });
    res.status(201).json({ success: true, data: word });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a word from user's personal list
exports.deleteMyWord = async (req, res) => {
  try {
    const word = await UserWord.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!word) return res.status(404).json({ success: false, message: "Word not found" });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Submit quiz on user's personal words (subscription required)
exports.submitMyWordsQuiz = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const now = new Date();
    const hasActiveSubscription =
      user.isPaid ||
      (user.subscriptionExpiresAt && user.subscriptionExpiresAt > now) ||
      user.role === "admin";
    if (!hasActiveSubscription) {
      return res.status(403).json({ success: false, paywallRequired: true, message: "Subscription required" });
    }

    const { answers } = req.body; // [{ wordId, userAnswer }]
    const wordIds = answers.map((a) => a.wordId);
    const words = await UserWord.find({ _id: { $in: wordIds }, userId: req.user.id });

    const wordMap = {};
    words.forEach((w) => { wordMap[w._id.toString()] = w; });

    let correctCount = 0;
    const results = answers.map((a) => {
      const word = wordMap[a.wordId];
      const isCorrect = word && a.userAnswer.toLowerCase().trim() === word.german.toLowerCase().trim();
      if (isCorrect) correctCount++;
      return { wordId: a.wordId, german: word?.german, translation: word?.translation, userAnswer: a.userAnswer, isCorrect };
    });

    const scorePercentage = answers.length > 0 ? Math.round((correctCount / answers.length) * 100) : 0;
    res.status(200).json({ success: true, data: { results, correctCount, total: answers.length, scorePercentage } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};