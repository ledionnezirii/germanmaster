const Question = require("../models/Question")
const User = require("../models/User")
const { ApiError } = require("../utils/ApiError")
const { ApiResponse } = require("../utils/ApiResponse")
const { asyncHandler } = require("../utils/asyncHandler")

// @desc    Get all questions
// @route   GET /api/questions
// @access  Public
const getAllQuestions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, level, category, difficulty } = req.query

  const query = { isActive: true }

  if (level) {
    query.level = level
  }

  if (category) {
    query.category = category
  }

  if (difficulty) {
    query.difficulty = Number.parseInt(difficulty)
  }

  const questions = await Question.find(query)
    .select("-answer") // Hide answers for security
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate("createdBy", "emri mbiemri")

  const total = await Question.countDocuments(query)

  res.json(
    new ApiResponse(200, {
      questions,
      pagination: {
        currentPage: Number.parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalQuestions: total,
      },
    }),
  )
})

// @desc    Get questions by level
// @route   GET /api/questions/level/:level
// @access  Public
const getQuestionsByLevel = asyncHandler(async (req, res) => {
  const { level } = req.params
  const { limit = 20, category } = req.query

  if (!["A1", "A2", "B1", "B2", "C1", "C2"].includes(level)) {
    throw new ApiError(400, "Invalid level")
  }

  const query = { level, isActive: true }
  if (category) {
    query.category = category
  }

  const questions = await Question.find(query)
    .select("-answer")
    .sort({ difficulty: 1, createdAt: -1 })
    .limit(Number.parseInt(limit))

  res.json(
    new ApiResponse(200, {
      questions,
      level,
      count: questions.length,
    }),
  )
})

// @desc    Get single question by ID
// @route   GET /api/questions/:id
// @access  Public
const getQuestionById = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id).select("-answer").populate("createdBy", "emri mbiemri")

  if (!question || !question.isActive) {
    throw new ApiError(404, "Question not found")
  }

  res.json(new ApiResponse(200, question))
})

// @desc    Answer a question
// @route   POST /api/questions/:id/answer
// @access  Private
const answerQuestion = asyncHandler(async (req, res) => {
  const { answer } = req.body

  if (!answer || !answer.trim()) {
    throw new ApiError(400, "Answer is required")
  }

  const question = await Question.findById(req.params.id)

  if (!question || !question.isActive) {
    throw new ApiError(404, "Question not found")
  }

  // Normalize answers for comparison
  const normalizedUserAnswer = answer.toLowerCase().trim()
  const normalizedCorrectAnswer = question.answer.toLowerCase().trim()

  const isCorrect = normalizedUserAnswer === normalizedCorrectAnswer

  // Calculate similarity score
  let score = 0
  if (isCorrect) {
    score = 100
  } else {
    // Simple word matching for partial credit
    const userWords = normalizedUserAnswer.split(" ")
    const correctWords = normalizedCorrectAnswer.split(" ")
    const matchingWords = userWords.filter((word) => correctWords.includes(word))
    score = Math.round((matchingWords.length / correctWords.length) * 100)
  }

  // Award XP if answer is correct or close enough
  let xpAwarded = 0
  if (score >= 80) {
    xpAwarded = question.xpReward
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { xp: xpAwarded },
    })
  }

  res.json(
    new ApiResponse(200, {
      correct: isCorrect,
      score,
      correctAnswer: question.answer,
      userAnswer: answer,
      explanation: question.explanation,
      hints: question.hints,
      xpAwarded,
      message: isCorrect
        ? "Excellent! Correct answer!"
        : score >= 80
          ? "Very close! Good job!"
          : "Not quite right. Try again!",
    }),
  )
})

// @desc    Get random question for practice
// @route   GET /api/questions/random
// @access  Public
const getRandomQuestion = asyncHandler(async (req, res) => {
  const { level, category } = req.query

  const query = { isActive: true }

  if (level) {
    query.level = level
  }

  if (category) {
    query.category = category
  }

  const count = await Question.countDocuments(query)

  if (count === 0) {
    throw new ApiError(404, "No questions found matching criteria")
  }

  const random = Math.floor(Math.random() * count)
  const question = await Question.findOne(query).select("-answer").skip(random)

  res.json(new ApiResponse(200, question))
})

// @desc    Create new question
// @route   POST /api/questions
// @access  Private (Admin)
const createQuestion = asyncHandler(async (req, res) => {
  const { question, answer, level, category, difficulty, hints, explanation, tags, xpReward } = req.body

  const newQuestion = await Question.create({
    question,
    answer,
    level,
    category,
    difficulty,
    hints,
    explanation,
    tags,
    xpReward,
    createdBy: req.user.id,
  })

  res.status(201).json(new ApiResponse(201, newQuestion, "Question created successfully"))
})

// @desc    Update question
// @route   PUT /api/questions/:id
// @access  Private (Admin)
const updateQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id)

  if (!question) {
    throw new ApiError(404, "Question not found")
  }

  const updatedQuestion = await Question.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })

  res.json(new ApiResponse(200, updatedQuestion, "Question updated successfully"))
})

// @desc    Delete question
// @route   DELETE /api/questions/:id
// @access  Private (Admin)
const deleteQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id)

  if (!question) {
    throw new ApiError(404, "Question not found")
  }

  question.isActive = false
  await question.save()

  res.json(new ApiResponse(200, null, "Question deleted successfully"))
})

// @desc    Get questions by category
// @route   GET /api/questions/category/:category
// @access  Public
const getQuestionsByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params
  const { level, limit = 20 } = req.query

  const validCategories = ["grammar", "vocabulary", "pronunciation", "culture"]
  if (!validCategories.includes(category)) {
    throw new ApiError(400, "Invalid category")
  }

  const query = { category, isActive: true }
  if (level) {
    query.level = level
  }

  const questions = await Question.find(query)
    .select("-answer")
    .sort({ difficulty: 1, createdAt: -1 })
    .limit(Number.parseInt(limit))

  res.json(
    new ApiResponse(200, {
      questions,
      category,
      count: questions.length,
    }),
  )
})

module.exports = {
  getAllQuestions,
  getQuestionsByLevel,
  getQuestionById,
  answerQuestion,
  getRandomQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getQuestionsByCategory,
}
