const Dictionary = require("../models/Dictionary")
const { ApiError } = require("../utils/ApiError")
const { ApiResponse } = require("../utils/ApiResponse")
const { asyncHandler } = require("../utils/asyncHandler")

// @desc    Get all dictionary words
// @route   GET /api/dictionary
// @access  Public
const getAllWords = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, level, sortBy = "word", sortOrder = "asc" } = req.query

  // Build query
  const query = { isActive: true }

  if (search) {
    query.$or = [
      { word: { $regex: search, $options: "i" } },
      { translation: { $regex: search, $options: "i" } },
      { tags: { $in: [new RegExp(search, "i")] } },
    ]
  }

  if (level) {
    query.level = level
  }

  // Build sort object
  const sort = {}
  sort[sortBy] = sortOrder === "desc" ? -1 : 1

  // Execute query with pagination
  const words = await Dictionary.find(query)
    .sort(sort)
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate("createdBy", "emri mbiemri")

  const total = await Dictionary.countDocuments(query)

  res.json(
    new ApiResponse(200, {
      words,
      pagination: {
        currentPage: Number.parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalWords: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    }),
  )
})

// @desc    Get words by level
// @route   GET /api/dictionary/level/:level
// @access  Public
const getWordsByLevel = asyncHandler(async (req, res) => {
  const { level } = req.params
  const { page = 1, limit = 20 } = req.query

  if (!["A1", "A2", "B1", "B2", "C1", "C2"].includes(level)) {
    throw new ApiError(400, "Invalid level. Must be one of: A1, A2, B1, B2, C1, C2")
  }

  const words = await Dictionary.find({ level, isActive: true })
    .sort({ word: 1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate("createdBy", "emri mbiemri")

  const total = await Dictionary.countDocuments({ level, isActive: true })

  res.json(
    new ApiResponse(200, {
      words,
      level,
      pagination: {
        currentPage: Number.parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalWords: total,
      },
    }),
  )
})

// @desc    Get single word by ID
// @route   GET /api/dictionary/:id
// @access  Public
const getWordById = asyncHandler(async (req, res) => {
  const word = await Dictionary.findById(req.params.id).populate("createdBy", "emri mbiemri")

  if (!word || !word.isActive) {
    throw new ApiError(404, "Word not found")
  }

  res.json(new ApiResponse(200, word))
})

// @desc    Add new word
// @route   POST /api/dictionary/add
// @access  Private (Admin)
const addWord = asyncHandler(async (req, res) => {
  const { word, translation, level, pronunciation, partOfSpeech, examples, difficulty, tags } = req.body

  // Check if word already exists
  const existingWord = await Dictionary.findOne({
    word: { $regex: new RegExp(`^${word}$`, "i") },
    level,
  })

  if (existingWord) {
    throw new ApiError(400, `Word "${word}" already exists for level ${level}`)
  }

  const newWord = await Dictionary.create({
    word,
    translation,
    level,
    pronunciation,
    partOfSpeech,
    examples,
    difficulty,
    tags,
    createdBy: req.user.id,
  })

  res.status(201).json(new ApiResponse(201, newWord, "Word added successfully"))
})

// @desc    Add multiple words
// @route   POST /api/dictionary/bulk
// @access  Private (Admin)
const addMultipleWords = asyncHandler(async (req, res) => {
  const { words } = req.body

  if (!Array.isArray(words) || words.length === 0) {
    throw new ApiError(400, "Words array is required and cannot be empty")
  }

  // Validate each word
  const validatedWords = words.map((word) => ({
    ...word,
    createdBy: req.user.id,
  }))

  try {
    const createdWords = await Dictionary.insertMany(validatedWords, { ordered: false })

    res.status(201).json(
      new ApiResponse(
        201,
        {
          words: createdWords,
          count: createdWords.length,
        },
        `${createdWords.length} words added successfully`,
      ),
    )
  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError(400, "Some words already exist. Duplicates were skipped.")
    }
    throw error
  }
})

// @desc    Update word
// @route   PUT /api/dictionary/:id
// @access  Private (Admin)
const updateWord = asyncHandler(async (req, res) => {
  const word = await Dictionary.findById(req.params.id)

  if (!word) {
    throw new ApiError(404, "Word not found")
  }

  const updatedWord = await Dictionary.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })

  res.json(new ApiResponse(200, updatedWord, "Word updated successfully"))
})

// @desc    Delete word
// @route   DELETE /api/dictionary/:id
// @access  Private (Admin)
const deleteWord = asyncHandler(async (req, res) => {
  const word = await Dictionary.findById(req.params.id)

  if (!word) {
    throw new ApiError(404, "Word not found")
  }

  // Soft delete
  word.isActive = false
  await word.save()

  res.json(new ApiResponse(200, null, "Word deleted successfully"))
})

// @desc    Search words
// @route   GET /api/dictionary/search
// @access  Public
const searchWords = asyncHandler(async (req, res) => {
  const { q, level, limit = 10 } = req.query

  if (!q || q.trim().length < 2) {
    throw new ApiError(400, "Search query must be at least 2 characters long")
  }

  const query = {
    isActive: true,
    $or: [
      { word: { $regex: q, $options: "i" } },
      { translation: { $regex: q, $options: "i" } },
      { tags: { $in: [new RegExp(q, "i")] } },
    ],
  }

  if (level) {
    query.level = level
  }

  const words = await Dictionary.find(query).limit(Number.parseInt(limit)).sort({ word: 1 })

  res.json(
    new ApiResponse(200, {
      words,
      query: q,
      count: words.length,
    }),
  )
})

module.exports = {
  getAllWords,
  getWordsByLevel,
  getWordById,
  addWord,
  addMultipleWords,
  updateWord,
  deleteWord,
  searchWords,
}
