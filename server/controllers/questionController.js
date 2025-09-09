const Question = require("../models/Question")
const User = require("../models/User")
const { ApiError } = require("../utils/ApiError")
const { ApiResponse } = require("../utils/ApiResponse")
const { asyncHandler } = require("../utils/asyncHandler")

// Helper function to normalize text for comparison
const normalizeText = (text) => {
  return (
    text
      .toLowerCase()
      .trim()
      // Remove common diacritics and special characters
      .replace(/[àáâãäåæ]/g, "a")
      .replace(/[èéêë]/g, "e")
      .replace(/[ìíîï]/g, "i")
      .replace(/[òóôõöø]/g, "o")
      .replace(/[ùúûü]/g, "u")
      .replace(/[ýÿ]/g, "y")
      .replace(/[ñ]/g, "n")
      .replace(/[ç]/g, "c")
      .replace(/[ß]/g, "ss")
      // Albanian specific diacritics
      .replace(/[ë]/g, "e")
      .replace(/[ç]/g, "c")
      // Remove extra spaces
      .replace(/\s+/g, " ")
  )
}

// Calculate Levenshtein distance for similarity
const levenshteinDistance = (str1, str2) => {
  const matrix = []

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1, // deletion
        )
      }
    }
  }

  return matrix[str2.length][str1.length]
}

// Calculate similarity percentage
const calculateSimilarity = (userAnswer, correctAnswer) => {
  // Exact match
  if (userAnswer === correctAnswer) return 100

  // Normalize both answers
  const normalizedUser = normalizeText(userAnswer)
  const normalizedCorrect = normalizeText(correctAnswer)

  // Check normalized exact match
  if (normalizedUser === normalizedCorrect) return 95

  // Calculate Levenshtein distance
  const maxLength = Math.max(normalizedUser.length, normalizedCorrect.length)
  if (maxLength === 0) return 100

  const distance = levenshteinDistance(normalizedUser, normalizedCorrect)
  const similarity = ((maxLength - distance) / maxLength) * 100

  // Word-based matching for additional partial credit
  const userWords = normalizedUser.split(" ").filter((w) => w.length > 0)
  const correctWords = normalizedCorrect.split(" ").filter((w) => w.length > 0)

  if (correctWords.length > 0) {
    const matchingWords = userWords.filter((word) =>
      correctWords.some((correctWord) => {
        const wordDistance = levenshteinDistance(word, correctWord)
        const wordSimilarity =
          ((Math.max(word.length, correctWord.length) - wordDistance) / Math.max(word.length, correctWord.length)) * 100
        return wordSimilarity >= 80 // Allow 80% similarity for individual words
      }),
    )

    const wordMatchScore = (matchingWords.length / correctWords.length) * 100

    // Take the higher of character similarity or word matching
    return Math.max(similarity, wordMatchScore)
  }

  return similarity
}

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

  const userAnswer = answer.trim()
  const correctAnswer = question.answer.trim()

  // Calculate similarity score using enhanced algorithm
  const score = Math.round(calculateSimilarity(userAnswer, correctAnswer))
  const isCorrect = score >= 95 // Consider 95%+ as correct (handles minor diacritics)

  let xpAwarded = 0
  if (score >= 90) {
    xpAwarded = question.xpReward // Full XP for excellent answers
  } else if (score >= 75) {
    xpAwarded = Math.round(question.xpReward * 0.7) // 70% XP for good attempts
  } else if (score >= 60) {
    xpAwarded = Math.round(question.xpReward * 0.4) // 40% XP for decent attempts
  }

  if (xpAwarded > 0) {
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { xp: xpAwarded },
    })
  }

  let detailedFeedback = ""
  let reasonWhy = ""

  if (score >= 95) {
    // Excellent answer
    reasonWhy = question.explanation || "Përgjigja juaj është shkëlqyeshme!"
    detailedFeedback = `Shkëlqyer! Përgjigja juaj "${userAnswer}" është praktikisht e përkryer!`

    if (score < 100) {
      detailedFeedback += " (Vetëm disa detaje të vogla të ndryshme)"
    }
  } else if (score >= 75) {
    // Good answer with minor issues
    reasonWhy = `Përgjigja juaj "${userAnswer}" është shumë afër! Përgjigja e plotë është "${correctAnswer}".`
    detailedFeedback = `Shumë mirë! Përgjigja juaj: "${userAnswer}"\nPërgjigja e saktë: "${correctAnswer}"\n\nJu morët ${score}% - vetëm disa detaje të vogla për të përmirësuar!`
  } else if (score >= 50) {
    // Decent attempt
    reasonWhy = `Përgjigja juaj "${userAnswer}" ka disa pjesë të sakta. Përgjigja e drejtë është "${correctAnswer}".`
    detailedFeedback = `Punë e mirë për përpjekjen! Përgjigja juaj: "${userAnswer}"\nPërgjigja e saktë: "${correctAnswer}"\n\nJu morët ${score}% - jeni në rrugën e duhur!`
  } else {
    // Needs improvement
    reasonWhy = `Përgjigja juaj "${userAnswer}" nuk është e saktë. Përgjigja e drejtë është "${correctAnswer}".`
    detailedFeedback = `Përgjigja juaj: "${userAnswer}"\nPërgjigja e saktë: "${correctAnswer}"\n\nMos u dekurajoni! Çdo përpjekje ju ndihmon të mësoni.`
  }

  if (question.explanation) {
    detailedFeedback += `\n\nShpjegimi: ${question.explanation}`
  }

  // Add grammar rule if available
  if (question.grammarRule) {
    detailedFeedback += `\n\nRregulli gramatikor: ${question.grammarRule}`
  }

  let message = ""
  if (score >= 95) {
    message = "Shkëlqyer! Përgjigje e përkryer!"
  } else if (score >= 85) {
    message = "Shumë mirë! Pothuajse e përkryer!"
  } else if (score >= 70) {
    message = "Mirë! Jeni shumë afër!"
  } else if (score >= 50) {
    message = "Punë e mirë! Vazhdoni kështu!"
  } else {
    message = "Provo përsëri! Çdo përpjekje ju bën më të mirë!"
  }

  res.json(
    new ApiResponse(200, {
      correct: isCorrect,
      score,
      correctAnswer: question.answer,
      userAnswer: answer,
      explanation: question.explanation,
      detailedFeedback,
      reasonWhy,
      hints: question.hints,
      xpAwarded,
      grammarRule: question.grammarRule,
      message,
    }),
  )
})

// @desc    Get random question for practice
// @route   GET /api/questions/random
// @access  Public
const getRandomQuestion = asyncHandler(async (req, res) => {
  const { level, category, excludeIds } = req.query
  const query = { isActive: true }

  if (level) {
    query.level = level
  }
  if (category) {
    query.category = category
  }

  // Exclude previously shown questions to ensure variety
  if (excludeIds) {
    const excludeArray = excludeIds.split(",").filter((id) => id.trim())
    if (excludeArray.length > 0) {
      query._id = { $nin: excludeArray }
    }
  }

  const count = await Question.countDocuments(query)
  if (count === 0) {
    throw new ApiError(404, "No questions found matching criteria")
  }

  // Use MongoDB's $sample aggregation for true randomization
  const questions = await Question.aggregate([
    { $match: query },
    { $sample: { size: 1 } },
    { $project: { answer: 0 } }, // Exclude answer field
  ])

  if (questions.length === 0) {
    throw new ApiError(404, "No questions found")
  }

  const question = questions[0]

  // Populate createdBy field if needed
  await Question.populate(question, { path: "createdBy", select: "emri mbiemri" })

  res.json(new ApiResponse(200, question))
})

// @desc    Get multiple random questions for practice session
// @route   GET /api/questions/random-batch
// @access  Public
const getRandomQuestionBatch = asyncHandler(async (req, res) => {
  const { level, category, limit = 5 } = req.query
  const query = { isActive: true }

  if (level) {
    query.level = level
  }
  if (category) {
    query.category = category
  }

  const batchSize = Math.min(Number.parseInt(limit), 20) // Max 20 questions per batch

  // Use MongoDB's $sample for true randomization
  const questions = await Question.aggregate([
    { $match: query },
    { $sample: { size: batchSize } },
    { $project: { answer: 0 } }, // Exclude answer field
  ])

  if (questions.length === 0) {
    throw new ApiError(404, "No questions found matching criteria")
  }

  res.json(
    new ApiResponse(200, {
      questions,
      count: questions.length,
      level,
      category,
    }),
  )
})

// @desc    Create new question
// @route   POST /api/questions
// @access  Private (Admin)
const createQuestion = asyncHandler(async (req, res) => {
  const {
    question,
    answer,
    level,
    category,
    difficulty,
    hints,
    explanation,
    tags,
    xpReward,
    grammarRule,
    commonMistakes,
  } = req.body

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
    grammarRule,
    commonMistakes,
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

const createQuestionsBulk = asyncHandler(async (req, res) => {
  const { questions } = req.body

  // Validate that questions is an array
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new ApiError(400, "Questions array is required and cannot be empty")
  }

  // Validate each question has required fields
  const requiredFields = ["question", "answer", "level", "category", "difficulty"]
  const invalidQuestions = []

  questions.forEach((q, index) => {
    const missingFields = requiredFields.filter((field) => !q[field])
    if (missingFields.length > 0) {
      invalidQuestions.push({
        index,
        missingFields,
        question: q.question || `Question ${index + 1}`,
      })
    }
  })

  if (invalidQuestions.length > 0) {
    throw new ApiError(400, `Invalid questions found`, invalidQuestions)
  }

  // Add createdBy to each question
  const questionsWithCreator = questions.map((q) => ({
    ...q,
    createdBy: req.user.id,
    // Set defaults if not provided
    hints: q.hints || [],
    tags: q.tags || [],
    xpReward: q.xpReward || 10,
    isActive: true,
  }))

  try {
    // Use insertMany for bulk creation
    const createdQuestions = await Question.insertMany(questionsWithCreator, {
      ordered: false, // Continue inserting even if some fail
    })

    res.status(201).json(
      new ApiResponse(
        201,
        {
          questions: createdQuestions,
          count: createdQuestions.length,
          totalSubmitted: questions.length,
        },
        `Successfully created ${createdQuestions.length} questions`,
      ),
    )
  } catch (error) {
    // Handle partial success scenarios
    if (error.writeErrors) {
      const successCount = questions.length - error.writeErrors.length
      const failedQuestions = error.writeErrors.map((err) => ({
        index: err.index,
        error: err.errmsg,
        question: questions[err.index]?.question || `Question ${err.index + 1}`,
      }))

      res.status(207).json(
        new ApiResponse(
          207,
          {
            successCount,
            failedCount: error.writeErrors.length,
            failedQuestions,
          },
          `Partial success: ${successCount} questions created, ${error.writeErrors.length} failed`,
        ),
      )
    } else {
      throw new ApiError(500, "Failed to create questions", error.message)
    }
  }
})

module.exports = {
  getAllQuestions,
  getQuestionsByLevel,
  getQuestionById,
  answerQuestion,
  getRandomQuestion,
  getRandomQuestionBatch,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getQuestionsByCategory,
  createQuestionsBulk,
}
