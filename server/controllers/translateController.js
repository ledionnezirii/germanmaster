const { Translate, TranslateProgress } = require("../models/Translate")
const User = require("../models/User")
const { ApiError } = require("../utils/ApiError")
const { ApiResponse } = require("../utils/ApiResponse")
const { asyncHandler } = require("../utils/asyncHandler")

const FREE_TRANSLATE_LIMIT = 5

// @desc    Get all translation texts
// @route   GET /api/translate
// @access  Public
const getAllTexts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, level, difficulty } = req.query

 // Replace the existing getAllTexts query builder section
const query = { isActive: true }

if (level && level !== "all") query.level = level
if (difficulty) query.difficulty = Number.parseInt(difficulty)

// ── language filter ──
if (req.query.language) {
  if (req.query.language === "de") {
    query.$or = [
      { language: "de" },
      { language: { $exists: false } },
      { language: null },
    ]
  } else {
    query.language = req.query.language
  }
}

  const texts = await Translate.find(query)
    .select("-questions.explanation")
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate("createdBy", "emri mbiemri")

  const total = await Translate.countDocuments(query)

  const textsWithProgress = texts.map((text) => {
    const textObj = text.toObject()
    textObj.questionCount = text.questions.length
    return textObj
  })

  res.json(
    new ApiResponse(200, {
      texts: textsWithProgress,
      pagination: {
        currentPage: Number.parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalTexts: total,
      },
    }),
  )
})

// @desc    Get text by ID with questions
// @route   GET /api/translate/:id
// @access  Public
const getTextById = asyncHandler(async (req, res) => {
  const text = await Translate.findById(req.params.id).populate("createdBy", "emri mbiemri")

  if (!text || !text.isActive) {
    throw new ApiError(404, "Text not found")
  }

  const textObj = text.toObject()
  textObj.questions = textObj.questions.map((q) => ({
    _id: q._id,
    question: q.question,
    options: q.options,
  }))

  res.json(new ApiResponse(200, textObj))
})

// @desc    Submit answers and get results
// @route   POST /api/translate/:id/submit
// @access  Private
const submitAnswers = asyncHandler(async (req, res) => {
  const { answers } = req.body

  if (!Array.isArray(answers) || answers.length === 0) {
    throw new ApiError(400, "Answers array is required")
  }

  const text = await Translate.findById(req.params.id)

  if (!text || !text.isActive) {
    throw new ApiError(404, "Text not found")
  }

  // Calculate score
  let correctAnswers = 0
  const results = answers.map((userAnswer) => {
    const question = text.questions.id(userAnswer.questionId)
    if (!question) {
      throw new ApiError(400, `Question ${userAnswer.questionId} not found`)
    }

    const isCorrect = question.correctAnswer === userAnswer.answer
    if (isCorrect) correctAnswers++

    return {
      questionId: userAnswer.questionId,
      userAnswer: userAnswer.answer,
      correctAnswer: question.correctAnswer,
      isCorrect,
      explanation: question.explanation,
    }
  })

  const score = Math.round((correctAnswers / answers.length) * 100)
  const passed = score >= 70

  let xpAwarded = 0
  if (passed) {
    xpAwarded = Math.round(text.xpReward * (score / 100))
  }

  // Update or create progress
  let progress = await TranslateProgress.findOne({
    userId: req.user.id,
    textId: text._id,
  })

  if (progress) {
    progress.questionsAnswered = answers.length
    progress.correctAnswers = correctAnswers
    progress.score = score
    progress.attempts += 1
    progress.lastAttemptAt = new Date()

    if (passed && !progress.completed) {
      progress.completed = true
      progress.completedAt = new Date()
      progress.xp = xpAwarded
    }
  } else {
    progress = await TranslateProgress.create({
      userId: req.user.id,
      textId: text._id,
      questionsAnswered: answers.length,
      correctAnswers,
      score,
      completed: passed,
      completedAt: passed ? new Date() : null,
      xp: passed ? xpAwarded : 0,
      lastAttemptAt: new Date(),
    })
  }

  await progress.save()

  // Award XP only if passed for the first time
  if (passed && xpAwarded > 0) {
    const user = await User.findById(req.user.id)

    const alreadyPassed =
      user.passedTranslatedTexts &&
      user.passedTranslatedTexts.map((id) => id.toString()).includes(text._id.toString())

    if (!alreadyPassed) {
      const completedCount = user.passedTranslatedTexts ? user.passedTranslatedTexts.length : 0

      // Free limit check
      if (!user.isPaid && completedCount >= FREE_TRANSLATE_LIMIT) {
        return res.json(
          new ApiResponse(200, {
            score,
            correctAnswers,
            totalQuestions: answers.length,
            passed,
            xpAwarded: 0,
            results,
            attempts: progress.attempts,
            limitReached: true,
            message: "Free limit reached. Upgrade to Premium for unlimited access.",
          }),
        )
      }

      await User.findByIdAndUpdate(req.user.id, {
        $inc: {
          xp: xpAwarded,
          weeklyXp: xpAwarded,
          monthlyXp: xpAwarded,
          completedTests: 1,
        },
        $addToSet: { passedTranslatedTexts: text._id },
      })
    }
  }

  res.json(
    new ApiResponse(200, {
      score,
      correctAnswers,
      totalQuestions: answers.length,
      passed,
      xpAwarded,
      results,
      attempts: progress.attempts,
      limitReached: false,
      message: passed
        ? "Congratulations! You passed the test!"
        : "Keep practicing! You can try again to improve your score.",
    }),
  )
})

// @desc    Get user progress for a text
// @route   GET /api/translate/:id/progress
// @access  Private
const getTextProgress = asyncHandler(async (req, res) => {
  const progress = await TranslateProgress.findOne({
    userId: req.user.id,
    textId: req.params.id,
  }).populate("textId", "title level")

  if (!progress) {
    return res.json(
      new ApiResponse(200, {
        completed: false,
        attempts: 0,
        score: 0,
      }),
    )
  }

  res.json(new ApiResponse(200, progress))
})

// @desc    Get all user progress
// @route   GET /api/translate/user/progress
// @access  Private
const getUserProgress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("isPaid")

  const progress = await TranslateProgress.find({ userId: req.user.id })
    .populate("textId", "title level difficulty")
    .sort({ updatedAt: -1 })

  const totalTexts = await Translate.countDocuments({ isActive: true })
  const completedTexts = progress.filter((p) => p.completed).length

  const progressByLevel = await TranslateProgress.aggregate([
    { $match: { userId: req.user._id, completed: true } },
    {
      $lookup: {
        from: "translates",
        localField: "textId",
        foreignField: "_id",
        as: "text",
      },
    },
    { $unwind: "$text" },
    { $group: { _id: "$text.level", completed: { $sum: 1 } } },
  ])

  res.json(
    new ApiResponse(200, {
      progress,
      totalTexts,
      completedTexts,
      completionRate: totalTexts > 0 ? Math.round((completedTexts / totalTexts) * 100) : 0,
      progressByLevel,
      isPaid: user.isPaid || false,
      freeLimit: FREE_TRANSLATE_LIMIT,
    }),
  )
})

// @desc    Create new translation text
// @route   POST /api/translate
// @access  Private (Admin)
const createText = asyncHandler(async (req, res) => {
  const { title, level, language, text, questions, difficulty, estimatedTime, xpReward, tags } = req.body

  const newText = await Translate.create({
    title,
    level,
    language,
    text,
    questions,
    difficulty,
    estimatedTime,
    xpReward,
    tags,
    createdBy: req.user.id,
  })

  res.status(201).json(new ApiResponse(201, newText, "Translation text created successfully"))
})

// @desc    Update translation text
// @route   PUT /api/translate/:id
// @access  Private (Admin)
const updateText = asyncHandler(async (req, res) => {
  const text = await Translate.findById(req.params.id)

  if (!text) {
    throw new ApiError(404, "Text not found")
  }

  const updatedText = await Translate.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })

  res.json(new ApiResponse(200, updatedText, "Text updated successfully"))
})

// @desc    Delete translation text
// @route   DELETE /api/translate/:id
// @access  Private (Admin)
const deleteText = asyncHandler(async (req, res) => {
  const text = await Translate.findById(req.params.id)

  if (!text) {
    throw new ApiError(404, "Text not found")
  }

  text.isActive = false
  await text.save()

  res.json(new ApiResponse(200, null, "Text deleted successfully"))
})

const bulkCreateTexts = asyncHandler(async (req, res) => {
  const items = req.body
  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, "Send an array of translation texts")
  }

  const inserted = []
  const skipped = []

  for (const item of items) {
    const exists = await Translate.findOne({ title: item.title, language: item.language || "de" })
    if (exists) { skipped.push(item.title); continue }
    const newText = await Translate.create({ ...item, createdBy: req.user.id })
    inserted.push(newText)
  }

  res.status(201).json(new ApiResponse(201, { inserted: inserted.length, skipped: skipped.length, skippedTitles: skipped, data: inserted }, `Created: ${inserted.length}, Skipped: ${skipped.length}`))
})

module.exports = {
  getAllTexts,
  getTextById,
  submitAnswers,
  getTextProgress,
  getUserProgress,
  createText,
  bulkCreateTexts,
  updateText,
  deleteText,
}