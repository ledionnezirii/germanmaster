const Quiz = require("../models/Quiz");
const User = require("../models/User");

// @desc    Create a single quiz
// @route   POST /api/quizzes
// @access  Admin
const createQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.create(req.body);
    res.status(201).json({ success: true, data: quiz });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Create multiple quizzes (bulk)
// @route   POST /api/quizzes/bulk
// @access  Admin
const createBulkQuizes = async (req, res) => {
  try {
    const quizzes = await Quiz.insertMany(req.body);
    res.status(201).json({ success: true, data: quizzes });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Get all quizzes
// @route   GET /api/quizzes
// @access  Public
const getAllQuizes = async (req, res) => {
  try {
const quizzes = await Quiz.find().sort({ createdAt: 1 });
    res.status(200).json({ success: true, data: quizzes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

// @desc    Get single quiz by ID
// @route   GET /api/quizzes/:id
// @access  Public
const getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ success: false, error: "Quiz not found" });
    }
    res.status(200).json({ success: true, data: quiz });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

// @desc    Update quiz
// @route   PUT /api/quizzes/:id
// @access  Admin
const updateQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!quiz) {
      return res.status(404).json({ success: false, error: "Quiz not found" });
    }
    res.status(200).json({ success: true, data: quiz });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Delete quiz
// @route   DELETE /api/quizzes/:id
// @access  Admin
const deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndDelete(req.params.id);
    if (!quiz) {
      return res.status(404).json({ success: false, error: "Quiz not found" });
    }
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

const submitQuiz = async (req, res) => {
  try {
    const { answers } = req.body
    const quiz = await Quiz.findById(req.params.id)
    if (!quiz) return res.status(404).json({ success: false, message: "Quiz not found" })

    // Count correct answers
    let correctCount = 0
    quiz.questions.forEach((q, index) => {
      if (answers[index] && answers[index] === q.correctAnswer) correctCount++
    })

    const totalQuestions = quiz.questions.length
    const percentage = Math.round((correctCount / totalQuestions) * 100)
    const passed = percentage >= 70

    let xpEarned = 0
    let alreadyCompleted = false

    const user = await User.findById(req.user._id)
    alreadyCompleted = user.finishedQuizzes.includes(quiz._id)

    if (passed && !alreadyCompleted) {
      // User passed and hasn't completed this quiz before - award XP
      xpEarned = quiz.xp
      user.finishedQuizzes.push(quiz._id)
      user.xp += xpEarned
      await user.save()
    } else if (passed && alreadyCompleted) {
      // User passed but already completed - no XP
      xpEarned = 0
    } else {
      // User failed (< 70%) - no XP, don't add to finishedQuizzes
      xpEarned = 0
    }

    res.status(200).json({
      success: true,
      message: passed ? "Quiz submitted successfully" : "Quiz submitted but not passed",
      passed,
      percentage,
      xpEarned,
      alreadyCompleted,
      totalQuestions: quiz.questions.length,
      correctAnswers: correctCount,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "Server error" })
  }
}

const getCompletedQuizes = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "finishedQuizzes",
      model: "Quiz",
    });

    res.status(200).json({
      success: true,
      data: user.finishedQuizzes || [],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to get completed quizzes" });
  }
};


module.exports = {
  createQuiz,
  createBulkQuizes,
  getAllQuizes,
  getQuizById,
  updateQuiz,
  deleteQuiz,
  submitQuiz,
  getCompletedQuizes
};
