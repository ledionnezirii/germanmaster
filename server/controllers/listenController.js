const Listen = require("../models/Listen")
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
      // Remove extra whitespace between words
      .replace(/\s+/g, " ")
      // Remove common punctuation
      .replace(/[.,!?;:]/g, "")
      // Remove quotes and other special characters
      .replace(/["""'']/g, "")
      // Trim again after all replacements
      .trim()
  )
}

// Function to calculate Jaccard Similarity between two strings
const calculateJaccardSimilarity = (text1, text2) => {
  const words1 = new Set(normalizeText(text1).split(" ").filter(word => word.length > 0));
  const words2 = new Set(normalizeText(text2).split(" ").filter(word => word.length > 0));

  if (words1.size === 0 && words2.size === 0) {
    return 1; // Both empty, considered 100% similar
  }
  if (words1.size === 0 || words2.size === 0) {
    return 0; // One empty, one not, considered 0% similar
  }

  const intersection = new Set([...words1].filter(word => words2.has(word)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
};

// @desc    Get all listening tests
// @route   GET /api/listen
// @access  Public
const getAllTests = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, level, difficulty } = req.query
  const query = { isActive: true }

  if (level) {
    query.level = level
  }
  if (difficulty) {
    query.difficulty = Number.parseInt(difficulty)
  }

  const tests = await Listen.find(query)
    .select("-correctText") // Hide correct answers
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate("createdBy", "emri mbiemri")

  const total = await Listen.countDocuments(query)

  res.json(
    new ApiResponse(200, {
      tests,
      pagination: {
        currentPage: Number.parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalTests: total,
      },
    }),
  )
})

// @desc    Get tests by level
// @route   GET /api/listen/level/:level
// @access  Public
const getTestsByLevel = asyncHandler(async (req, res) => {
  const { level } = req.params
  const { page = 1, limit = 20 } = req.query

  if (!["A1", "A2", "B1", "B2", "C1", "C2"].includes(level)) {
    throw new ApiError(400, "Invalid level")
  }

  const tests = await Listen.find({ level, isActive: true })
    .select("-correctText")
    .sort({ difficulty: 1, createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)

  const total = await Listen.countDocuments({ level, isActive: true })

  res.json(
    new ApiResponse(200, {
      tests,
      level,
      pagination: {
        currentPage: Number.parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalTests: total,
      },
    }),
  )
})

// @desc    Get single test by ID
// @route   GET /api/listen/:id
// @access  Public
const getTestById = asyncHandler(async (req, res) => {
  const test = await Listen.findById(req.params.id).select("-correctText")

  if (!test || !test.isActive) {
    throw new ApiError(404, "Test not found")
  }

  res.json(new ApiResponse(200, test))
})

// @desc    Check answer for listening test
// @route   POST /api/listen/check
// @access  Private
const checkAnswer = asyncHandler(async (req, res) => {
  const { testId, userAnswer } = req.body
  if (!testId || !userAnswer) {
    throw new ApiError(400, "Test ID and user answer are required")
  }

  const test = await Listen.findById(testId)
  if (!test || !test.isActive) {
    throw new ApiError(404, "Test not found")
  }

  // Calculate Jaccard Similarity
  const jaccardSimilarity = calculateJaccardSimilarity(userAnswer, test.correctText);
  const score = Math.round(jaccardSimilarity * 100);

  // Define the passing threshold
  const PASSING_THRESHOLD = 75;
  const isCorrect = score >= PASSING_THRESHOLD;

  console.log("User answer (normalized):", normalizeText(userAnswer))
  console.log("Correct answer (normalized):", normalizeText(test.correctText))
  console.log("Final score (Jaccard):", score, "Is correct:", isCorrect)

  let xpAwarded = 0
  if (isCorrect) {
    xpAwarded = test.xpReward || 10
    // Update user's XP, completed tests count, and add to listenTestsPassed
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { xp: xpAwarded, completedTests: 1 },
      $addToSet: { listenTestsPassed: testId },
    })
  }

  // Record completion in the test document ONLY if correct
  if (isCorrect) {
    const existingCompletion = test.listenTestsPassed.find((completion) => completion.user.toString() === req.user.id)
    if (!existingCompletion) {
      test.listenTestsPassed.push({
        user: req.user.id,
        score,
        completedAt: new Date(),
      })
      await test.save()
    } else {
      // Update existing completion with better score if applicable
      if (score > existingCompletion.score) {
        existingCompletion.score = score
        existingCompletion.completedAt = new Date()
        await test.save()
      }
    }
  }

  // Determine message based on score
  let message
  if (isCorrect) {
    message = "Excellent! You passed with a great score!"
  } else if (score >= 60) { // Adjusted for new threshold
    message = "Good effort! You were close, keep practicing."
  } else {
    message = "Keep practicing! You'll get there."
  }

  res.json(
    new ApiResponse(200, {
      correct: isCorrect,
      score,
      correctAnswer: test.correctText,
      userAnswer,
      xpAwarded,
      message,
      similarityMetric: "Jaccard", // Indicate which metric was used
    }),
  )
})

// @desc    Mark test as listened
// @route   POST /api/listen/:id/mark-listened
// @access  Private
const markAsListened = asyncHandler(async (req, res) => {
  const test = await Listen.findById(req.params.id)
  if (!test || !test.isActive) {
    throw new ApiError(404, "Test not found")
  }

  // Check if already marked
  const alreadyListened = test.listenTestsPassed.some((completion) => completion.user.toString() === req.user.id)
  if (alreadyListened) {
    throw new ApiError(400, "Test already completed")
  }

  // Add to user's completed tests
  await User.findByIdAndUpdate(req.user.id, {
    $addToSet: { listenTestsPassed: test._id },
  })

  // Also add to test's completion list
  test.listenTestsPassed.push({
    user: req.user.id,
    score: 0, // No score for just listening
    completedAt: new Date(),
  })
  await test.save()

  res.json(new ApiResponse(200, null, "Test marked as listened"))
})

// @desc    Create new listening test
// @route   POST /api/listen
// @access  Private (Admin)
const createTest = asyncHandler(async (req, res) => {
  const { title, level, text, correctText, audioUrl, duration, difficulty, xpReward, tags } = req.body

  const test = await Listen.create({
    title,
    level,
    text,
    correctText,
    audioUrl,
    duration,
    difficulty: difficulty || 1,
    xpReward: xpReward || 10,
    tags,
    createdBy: req.user.id,
  })

  res.status(201).json(new ApiResponse(201, test, "Listening test created successfully"))
})

// @desc    Update listening test
// @route   PUT /api/listen/:id
// @access  Private (Admin)
const updateTest = asyncHandler(async (req, res) => {
  const test = await Listen.findById(req.params.id)
  if (!test) {
    throw new ApiError(404, "Test not found")
  }

  const updatedTest = await Listen.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })

  res.json(new ApiResponse(200, updatedTest, "Test updated successfully"))
})

// @desc    Delete listening test
// @route   DELETE /api/listen/:id
// @access  Private (Admin)
const deleteTest = asyncHandler(async (req, res) => {
  const test = await Listen.findById(req.params.id)
  if (!test) {
    throw new ApiError(404, "Test not found")
  }

  test.isActive = false
  await test.save()

  res.json(new ApiResponse(200, null, "Test deleted successfully"))
})

// @desc    Get user's listening progress
// @route   GET /api/listen/progress
// @access  Private
const getUserProgress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).populate("listenTestsPassed", "title level difficulty")
  const totalTests = await Listen.countDocuments({ isActive: true })
  const completedTests = user.listenTestsPassed.length

  const progressByLevel = await Listen.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: "$level", total: { $sum: 1 } } },
  ])

  const completedByLevel = await Listen.aggregate([
    { $match: { "listenTestsPassed.user": req.user.id, isActive: true } },
    { $group: { _id: "$level", completed: { $sum: 1 } } },
  ])

  // Get all tests with completion status for this user
  const allTestsWithCompletion = await Listen.find({ isActive: true })
    .select("_id title level listenTestsPassed")
    .lean()

  // Filter to get completed test IDs
  const completedTestIds = allTestsWithCompletion
    .filter((test) =>
      test.listenTestsPassed.some((completion) => completion.user.toString() === req.user.id.toString()),
    )
    .map((test) => test._id)

  res.json(
    new ApiResponse(200, {
      totalTests,
      completedTests,
      completionRate: totalTests > 0 ? Math.round((completedTests / totalTests) * 100) : 0,
      progressByLevel,
      completedByLevel,
      recentTests: user.listenTestsPassed.slice(-5), // Last 5 for recent
      completedTestIds, // All completed test IDs from both sources
      allCompletedTests: user.listenTestsPassed, // All completed tests from user profile
      completedFromTests: completedTestIds, // Completed tests found in test documents
    }),
  )
})

// @desc    Get all tests with completion status for current user
// @route   GET /api/listen/all
// @access  Private
const getAllTestsWithCompletion = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, level, difficulty } = req.query
  const query = { isActive: true }

  if (level) {
    query.level = level
  }
  if (difficulty) {
    query.difficulty = Number.parseInt(difficulty)
  }

  // Get tests with completion information
  const tests = await Listen.find(query)
    .select("title level text difficulty xpReward createdAt listenTestsPassed")
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate("createdBy", "emri mbiemri")
    .lean()

  // Add completion status for current user
  const testsWithCompletion = tests.map((test) => ({
    ...test,
    isCompleted: test.listenTestsPassed.some((completion) => completion.user.toString() === req.user.id.toString()),
    userScore:
      test.listenTestsPassed.find((completion) => completion.user.toString() === req.user.id.toString())?.score || 0,
  }))

  const total = await Listen.countDocuments(query)

  res.json(
    new ApiResponse(200, {
      tests: testsWithCompletion,
      pagination: {
        currentPage: Number.parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalTests: total,
      },
    }),
  )
})

// @desc    Reset user progress (for testing purposes)
// @route   DELETE /api/listen/progress/reset
// @access  Private
const resetUserProgress = asyncHandler(async (req, res) => {
  // Remove user from all test completions
  await Listen.updateMany(
    { "listenTestsPassed.user": req.user.id },
    { $pull: { listenTestsPassed: { user: req.user.id } } },
  )

  // Clear user's completed tests
  await User.findByIdAndUpdate(req.user.id, {
    $set: { listenTestsPassed: [] },
    $inc: { completedTests: -1000 }, // Reset completed tests counter (adjust as needed)
  })

  res.json(new ApiResponse(200, null, "User progress reset successfully"))
})

module.exports = {
  getAllTests,
  getTestsByLevel,
  getTestById,
  checkAnswer,
  markAsListened,
  createTest,
  updateTest,
  deleteTest,
  getUserProgress,
  getAllTestsWithCompletion,
  resetUserProgress,
}