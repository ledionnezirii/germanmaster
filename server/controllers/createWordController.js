const CreateWord = require("../models/CreateWord");
const User = require("../models/User");

// Get all CreateWord lessons
exports.getAllLessons = async (req, res) => {
  try {
    const { level } = req.query;
    const filter = level ? { level } : {};
    
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
      if (!user.finishedCreateWord.includes(lessonId)) {
        user.finishedCreateWord.push(lessonId);
        user.xp += xpAwarded;
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
    res.status(200).json({ success: true, data: user.finishedCreateWord });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};