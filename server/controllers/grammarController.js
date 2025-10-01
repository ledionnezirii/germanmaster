const Grammar = require("../models/Grammar")
const { ApiError } = require("../utils/ApiError")
const { ApiResponse } = require("../utils/ApiResponse")
const { asyncHandler } = require("../utils/asyncHandler")

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

// @desc    Get single topic by ID
// @route   GET /api/grammar/:id
// @access  Public
const getTopicById = asyncHandler(async (req, res) => {
  const topic = await Grammar.findById(req.params.id).populate("createdBy", "emri mbiemri")

  if (!topic || !topic.isActive) {
    throw new ApiError(404, "Grammar topic not found")
  }

  res.json(new ApiResponse(200, topic))
})

// @desc    Create new grammar topic
// @route   POST /api/grammar
// @access  Private (Admin)
const createTopic = asyncHandler(async (req, res) => {
  const { name, description, level, content, examples, exercises, difficulty, tags } = req.body

  const topic = await Grammar.create({
    name,
    description,
    level,
    content,
    examples,
    exercises,
    difficulty,
    tags,
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

  const updatedTopic = await Grammar.findByIdAndUpdate(req.params.id, req.body, {
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

// @desc    Mark grammar topic as finished
// @route   PUT /api/grammar/finished/:id
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

  if (!user.grammarFinished.includes(topicId)) {
    user.grammarFinished.push(topicId)
    await user.save()
  }

  res.json(new ApiResponse(200, { topicId }, "Grammar topic marked as finished"))
})

module.exports = {
  getAllTopics,
  getTopicsByLevel,
  getTopicById,
  createTopic,
  updateTopic,
  deleteTopic,
  markTopicAsFinished,
}
