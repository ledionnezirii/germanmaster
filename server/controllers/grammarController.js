const Grammar = require("../models/Grammar")
const { ApiError } = require("../utils/ApiError")
const { ApiResponse } = require("../utils/ApiResponse")
const { asyncHandler } = require("../utils/asyncHandler")

// Helper function to check if date is today (reset at 00:01)
const isDateToday = (date) => {
  if (!date) return false
  const today = new Date()
  const dateToCheck = new Date(date)
  return (
    today.getFullYear() === dateToCheck.getFullYear() &&
    today.getMonth() === dateToCheck.getMonth() &&
    today.getDate() === dateToCheck.getDate()
  )
}

const canAccessMoreTopicsToday = (user) => {
  if (!user.grammarDailyTopics || !user.grammarDailyTopics.date) {
    return true
  }

  if (!isDateToday(user.grammarDailyTopics.date)) {
    return true // New day, reset limit
  }

  const topicsAccessedToday = user.grammarDailyTopics.topicIds.length
  return topicsAccessedToday < 2
}

const getTopicsAccessedToday = (user) => {
  if (!user.grammarDailyTopics || !user.grammarDailyTopics.date) {
    return 0
  }

  if (!isDateToday(user.grammarDailyTopics.date)) {
    return 0 // New day, reset count
  }

  return user.grammarDailyTopics.topicIds.length
}

const getAccessedTopicIdsToday = (user) => {
  if (!user.grammarDailyTopics || !user.grammarDailyTopics.date) {
    return []
  }

  if (!isDateToday(user.grammarDailyTopics.date)) {
    return [] // New day, no topics accessed yet
  }

  return user.grammarDailyTopics.topicIds.map((id) => String(id))
}

const resetDailyTopicsIfNewDay = (user) => {
  if (!user.grammarDailyTopics || !user.grammarDailyTopics.date || !isDateToday(user.grammarDailyTopics.date)) {
    user.grammarDailyTopics = {
      date: new Date(),
      topicIds: [],
    }
  }
}

// @desc    Get all grammar topics
// @route   GET /api/grammar
// @access  Public
const getAllTopics = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, level, difficulty } = req.query

  const query = { isActive: true }

  if (level) {
    query.level = level
  }

  if (difficulty) {
    query.difficulty = Number.parseInt(difficulty)
  }

  const topics = await Grammar.find(query)
    .sort({ level: 1, difficulty: 1, createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate("createdBy", "emri mbiemri")

  const total = await Grammar.countDocuments(query)

  res.json(
    new ApiResponse(200, {
      topics,
      pagination: {
        currentPage: Number.parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalTopics: total,
      },
    }),
  )
})

// @desc    Get topics by level
// @route   GET /api/grammar/level/:level
// @access  Public
const getTopicsByLevel = asyncHandler(async (req, res) => {
  const { level } = req.params
  const { page = 1, limit = 20 } = req.query

  if (!["A1", "A2", "B1", "B2", "C1", "C2"].includes(level)) {
    throw new ApiError(400, "Invalid level")
  }

  const topics = await Grammar.find({ level, isActive: true })
    .sort({ difficulty: 1, createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)

  const total = await Grammar.countDocuments({ level, isActive: true })

  res.json(
    new ApiResponse(200, {
      topics,
      level,
      pagination: {
        currentPage: Number.parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalTopics: total,
      },
    }),
  )
})

// @desc    Get single topic by ID - with daily limit check
// @route   GET /api/grammar/:id
// @access  Private
const getTopicById = asyncHandler(async (req, res) => {
  const User = require("../models/User")
  const userId = req.user?.id

  const topic = await Grammar.findById(req.params.id).populate("createdBy", "emri mbiemri")

  if (!topic || !topic.isActive) {
    throw new ApiError(404, "Grammar topic not found")
  }

  if (userId) {
    const user = await User.findById(userId)
    if (!user) {
      throw new ApiError(404, "User not found")
    }

    resetDailyTopicsIfNewDay(user)

    const topicIdString = String(req.params.id)
    const alreadyAccessedToday = user.grammarDailyTopics.topicIds.some((id) => String(id) === topicIdString)

    // Check if topic is already finished (always allow access)
    const isFinished = user.grammarFinished.some((id) => String(id) === topicIdString)

    // If not already accessed today and not finished, check limit and add to list
    if (!alreadyAccessedToday && !isFinished) {
      if (!canAccessMoreTopicsToday(user)) {
        const topicsAccessedCount = getTopicsAccessedToday(user)
        throw new ApiError(
          429,
          `You can only access 2 grammar topics per day. You've accessed ${topicsAccessedCount} already. Come back tomorrow at 00:01.`,
        )
      }

      user.grammarDailyTopics.topicIds.push(req.params.id)
      await user.save()
    }
  }

  res.json(new ApiResponse(200, topic))
})

// @desc    Create new grammar topic
// @route   POST /api/grammar
// @access  Private (Admin)
const createTopic = asyncHandler(async (req, res) => {
  const { name, description, moreInfo, level, content, rules, examples, exercises, difficulty, tags, numbers } =
    req.body

  const topic = await Grammar.create({
    name,
    description,
    moreInfo: moreInfo || "",
    level,
    content,
    rules: rules || [],
    examples: examples || [],
    exercises: exercises || [],
    numbers: numbers || [],
    difficulty,
    tags: tags || [],
    createdBy: req.user.id,
  })

  res.status(201).json(new ApiResponse(201, topic, "Grammar topic created successfully"))
})

// @desc    Update grammar topic
// @route   PUT /api/grammar/:id
// @access  Private (Admin)
const updateTopic = asyncHandler(async (req, res) => {
  const topic = await Grammar.findById(req.params.id)

  if (!topic) {
    throw new ApiError(404, "Grammar topic not found")
  }

  const allowedUpdates = [
    "name",
    "description",
    "moreInfo",
    "level",
    "content",
    "rules",
    "examples",
    "exercises",
    "numbers",
    "difficulty",
    "tags",
    "isActive",
  ]

  const updates = {}
  allowedUpdates.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field]
    }
  })

  const updatedTopic = await Grammar.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  })

  res.json(new ApiResponse(200, updatedTopic, "Grammar topic updated successfully"))
})

// @desc    Delete grammar topic
// @route   DELETE /api/grammar/:id
// @access  Private (Admin)
const deleteTopic = asyncHandler(async (req, res) => {
  const topic = await Grammar.findById(req.params.id)

  if (!topic) {
    throw new ApiError(404, "Grammar topic not found")
  }

  topic.isActive = false
  await topic.save()

  res.json(new ApiResponse(200, null, "Grammar topic deleted successfully"))
})

// @desc    Mark grammar topic as finished - with daily limit check
// @route   POST /api/grammar/:id/finish
// @access  Private
const markTopicAsFinished = asyncHandler(async (req, res) => {
  const topicId = req.params.id
  const userId = req.user.id

  const topic = await Grammar.findById(topicId)
  if (!topic) {
    throw new ApiError(404, "Grammar topic not found")
  }

  const User = require("../models/User")
  const user = await User.findById(userId)
  if (!user) {
    throw new ApiError(404, "User not found")
  }

  // Reset daily topics if new day
  resetDailyTopicsIfNewDay(user)

  const topicIdString = String(topicId)
  const alreadyAccessedToday = user.grammarDailyTopics.topicIds.some((id) => String(id) === topicIdString)

  // Check if already finished
  const alreadyFinished = user.grammarFinished.some((id) => String(id) === topicIdString)

  if (!alreadyAccessedToday && !alreadyFinished) {
    if (!canAccessMoreTopicsToday(user)) {
      const topicsAccessedCount = getTopicsAccessedToday(user)
      throw new ApiError(
        429,
        `You can only finish 2 grammar topics per day. You've accessed ${topicsAccessedCount} already. Come back tomorrow at 00:01.`,
      )
    }
    // Add to accessed topics when finishing
    user.grammarDailyTopics.topicIds.push(topicId)
  }

  // Add to finished list if not already there
  if (!alreadyFinished) {
    user.grammarFinished.push(topicId)
  }

  await user.save()

  res.json(new ApiResponse(200, { topicId, grammarFinished: user.grammarFinished }, "Grammar topic marked as finished"))
})

// @desc    Get finished topics
// @route   GET /api/grammar/finished
// @access  Private
const getFinishedTopics = asyncHandler(async (req, res) => {
  const userId = req.user.id

  const User = require("../models/User")
  const user = await User.findById(userId).select("grammarFinished")

  if (!user) {
    throw new ApiError(404, "User not found")
  }

  res.json(new ApiResponse(200, { finishedTopics: user.grammarFinished }))
})

// @desc    Get daily limit status
// @route   GET /api/grammar/daily-limit-status
// @access  Private
const getDailyLimitStatus = asyncHandler(async (req, res) => {
  const userId = req.user.id

  const User = require("../models/User")
  const user = await User.findById(userId)

  if (!user) {
    throw new ApiError(404, "User not found")
  }

  resetDailyTopicsIfNewDay(user)
  await user.save() // Save in case we reset

  const topicsAccessedToday = getTopicsAccessedToday(user)
  const accessedTopicIds = getAccessedTopicIdsToday(user)
  const canAccessMore = canAccessMoreTopicsToday(user)
  const remainingTopics = Math.max(0, 2 - topicsAccessedToday)

  res.json(
    new ApiResponse(200, {
      topicsAccessedToday,
      canAccessMore,
      remainingTopics,
      limit: 2,
      accessedTopicIds,
    }),
  )
})

module.exports = {
  getAllTopics,
  getTopicsByLevel,
  getTopicById,
  createTopic,
  updateTopic,
  deleteTopic,
  markTopicAsFinished,
  getFinishedTopics,
  getDailyLimitStatus,
}