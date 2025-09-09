const Dictionary = require("../models/Dictionary")
const { ApiError } = require("../utils/ApiError")
const { ApiResponse } = require("../utils/ApiResponse")
const { asyncHandler } = require("../utils/asyncHandler")
const mongoose = require("mongoose") // Import mongoose to check for valid ObjectId

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

// @desc    Add multiple words - FURTHER IMPROVED VERSION
// @route   POST /api/dictionary/bulk
// @access  Private (Admin)
const addMultipleWords = asyncHandler(async (req, res) => {
  const { words } = req.body

  if (!Array.isArray(words) || words.length === 0) {
    throw new ApiError(400, "Words array is required and cannot be empty")
  }

  // Ensure req.user.id is available and valid
  let userId = req.user?.id
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    // Fallback to a dummy valid ObjectId for testing if user is not authenticated
    // In a production environment, you should enforce authentication here.
    console.warn("req.user.id is missing or invalid. Using a dummy ObjectId for createdBy.")
    userId = new mongoose.Types.ObjectId("60d5ec49f8c7a10015e8d7c1") // A valid dummy ObjectId
  }

  console.log(`Attempting to add ${words.length} words with createdBy: ${userId}...`)

  const wordsToInsert = []
  const validationErrors = []

  for (let i = 0; i < words.length; i++) {
    const wordData = words[i]

    try {
      // Basic validation for required fields
      if (!wordData.word || !wordData.translation || !wordData.level) {
        validationErrors.push(`Word ${i + 1} (index ${i}): Missing required fields (word, translation, or level).`)
        continue // Skip to next word
      }

      // Transform examples: ensure 'albanian' field exists
      const transformedExamples =
        wordData.examples?.map((example) => ({
          german: example.german || "",
          albanian: example.albanian || example.english || "", // Prioritize albanian, fallback to english
        })) || []

      // Prepare word object for Mongoose validation
      const preparedWord = {
        word: wordData.word.trim(),
        translation: wordData.translation.trim(),
        level: wordData.level,
        pronunciation: wordData.pronunciation || "",
        partOfSpeech: wordData.partOfSpeech || "",
        examples: transformedExamples,
        difficulty: wordData.difficulty || 1,
        tags: Array.isArray(wordData.tags) ? wordData.tags.map((tag) => tag.trim().toLowerCase()) : [],
        createdBy: userId, // Use the determined userId
        isActive: true, // Ensure default is set
      }

      // Use Mongoose's model validation without saving to DB yet
      const tempWord = new Dictionary(preparedWord)
      await tempWord.validate() // This will throw if validation fails

      wordsToInsert.push(preparedWord)
      console.log(`Word ${i + 1} ('${preparedWord.word}') passed validation.`)
    } catch (error) {
      // Capture Mongoose validation errors
      if (error.name === "ValidationError") {
        const messages = Object.values(error.errors)
          .map((err) => err.message)
          .join(", ")
        validationErrors.push(`Word ${i + 1} ('${wordData.word || "unknown"}'): Validation failed - ${messages}`)
      } else {
        validationErrors.push(`Word ${i + 1} ('${wordData.word || "unknown"}'): ${error.message}`)
      }
      console.error(`Validation error for word ${i + 1}:`, error.message)
    }
  }

  console.log(`Validated ${wordsToInsert.length} words for insertion. ${validationErrors.length} words had errors.`)

  if (wordsToInsert.length === 0) {
    throw new ApiError(400, `No valid words to insert. Please check your data. Errors: ${validationErrors.join("; ")}`)
  }

  try {
    const insertResult = await Dictionary.insertMany(wordsToInsert, {
      ordered: false, // Continue inserting even if some fail
      rawResult: true, // Get detailed results including insertedIds
    })

    const insertedCount = insertResult.insertedCount || insertResult.length // Fallback for older Mongoose versions
    const insertedDocs = insertResult.ops || insertResult // Fallback for older Mongoose versions

    const duplicateErrors = []
    if (insertResult.writeErrors && insertResult.writeErrors.length > 0) {
      insertResult.writeErrors.forEach((err) => {
        if (err.code === 11000) {
          // Duplicate key error
          duplicateErrors.push(`Duplicate word: ${err.op.word} (Level: ${err.op.level})`)
        } else {
          duplicateErrors.push(`Write error for word '${err.op.word || "unknown"}': ${err.errmsg || err.message}`)
        }
      })
    }

    const finalErrors = [...validationErrors, ...duplicateErrors]
    const responseMessage =
      finalErrors.length > 0
        ? `${insertedCount} words added successfully. ${finalErrors.length} words had issues.`
        : `${insertedCount} words added successfully`

    res.status(201).json(
      new ApiResponse(
        201,
        {
          words: insertedDocs,
          count: insertedCount,
          errors: finalErrors.length > 0 ? finalErrors : undefined,
          totalAttempted: words.length,
          successful: insertedCount,
          failed: words.length - insertedCount, // Total attempted - successfully inserted
        },
        responseMessage,
      ),
    )
  } catch (error) {
    console.error("Critical insertion error:", error)
    // This catch block is for errors that prevent insertMany from even starting
    // or unexpected database errors not caught by writeErrors.
    throw new ApiError(
      500,
      `Failed to insert words: ${error.message}. Previous validation errors: ${validationErrors.join("; ")}`,
    )
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
  addMultipleWords, // Updated with better error handling
  updateWord,
  deleteWord,
  searchWords,
}
