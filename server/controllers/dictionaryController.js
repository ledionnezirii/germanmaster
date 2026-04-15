const Dictionary = require("../models/Dictionary")
const User = require("../models/User")
const { ApiError } = require("../utils/ApiError")
const { ApiResponse } = require("../utils/ApiResponse")
const { asyncHandler } = require("../utils/asyncHandler")
const mongoose = require("mongoose")

const FREE_DAILY_LIMIT = 5
const PAID_DAILY_LIMIT = 25

const buildLanguageQuery = (language) => {
  if (!language) return {}
  if (language === "de") {
    return { $or: [{ language: "de" }, { language: { $exists: false } }, { language: null }] }
  }
  return { language }
}

const getDailyLimit = (user) => {
  return user.isPaid ? PAID_DAILY_LIMIT : FREE_DAILY_LIMIT
}

// Helper function to check unlock status
const addUnlockStatus = (words, userId) => {
  if (!userId) {
    return words.map((word) => {
      const wordObj = word.toObject ? word.toObject() : { ...word }
      wordObj.isUnlocked = false
      delete wordObj.unlocks
      return wordObj
    })
  }

  const userIdStr = userId.toString()

  return words.map((word) => {
    const wordObj = word.toObject ? word.toObject() : { ...word }

    const unlocksArray = wordObj.unlocks || word.unlocks || []

    const hasUnlocked = unlocksArray.some((unlock) => {
      if (!unlock || !unlock.userId) return false

      let unlockUserIdStr
      if (unlock.userId._id) {
        unlockUserIdStr = unlock.userId._id.toString()
      } else if (typeof unlock.userId === "object" && unlock.userId.toString) {
        unlockUserIdStr = unlock.userId.toString()
      } else {
        unlockUserIdStr = String(unlock.userId)
      }

      return unlockUserIdStr === userIdStr
    })

    wordObj.isUnlocked = hasUnlocked
    delete wordObj.unlocks

    return wordObj
  })
}

// Helper function to get daily unlock count
const getDailyUnlockCount = async (userId) => {
  const twentyFourHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000)
  const result = await Dictionary.aggregate([
    { $unwind: "$unlocks" },
    {
      $match: {
        "unlocks.userId": new mongoose.Types.ObjectId(userId),
        "unlocks.unlockedAt": { $gte: twentyFourHoursAgo },
      },
    },
    { $count: "total" },
  ])

  return result.length > 0 ? result[0].total : 0
}

// @desc    Get all words with pagination and unlock status
// @route   GET /api/dictionary
// @access  Public
const getAllWords = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, level, sortBy = "word", sortOrder = "asc", language } = req.query
  const userId = req.user?.id

  const langQuery = buildLanguageQuery(language)
  const query = { isActive: true, ...langQuery }

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

  const sort = {}
  sort[sortBy] = sortOrder === "desc" ? -1 : 1

  const words = await Dictionary.find(query)
    .select("+unlocks")
    .sort(sort)
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate("createdBy", "emri mbiemri")
    .lean()

  const total = await Dictionary.countDocuments(query)

  const wordsWithUnlockStatus = addUnlockStatus(words, userId)

  res.json(
    new ApiResponse(200, {
      words: wordsWithUnlockStatus,
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

// @desc    Get words by level with unlock status
// @route   GET /api/dictionary/level/:level
// @access  Public
const getWordsByLevel = asyncHandler(async (req, res) => {
  const { level } = req.params
  const { page = 1, limit = 20, language } = req.query
  const userId = req.user?.id

  if (!["A1", "A2", "B1", "B2", "C1", "C2"].includes(level)) {
    throw new ApiError(400, "Invalid level. Must be one of: A1, A2, B1, B2, C1, C2")
  }

  const langQuery = buildLanguageQuery(language)
  const words = await Dictionary.find({ level, isActive: true, ...langQuery })
    .select("+unlocks")
    .sort({ word: 1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate("createdBy", "emri mbiemri")
    .lean()

  const total = await Dictionary.countDocuments({ level, isActive: true, ...langQuery })

  const wordsWithUnlockStatus = addUnlockStatus(words, userId)

  res.json(
    new ApiResponse(200, {
      words: wordsWithUnlockStatus,
      level,
      pagination: {
        currentPage: Number.parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalWords: total,
      },
    }),
  )
})

// @desc    Get single word by ID with unlock status
// @route   GET /api/dictionary/:id
// @access  Public
const getWordById = asyncHandler(async (req, res) => {
  const userId = req.user?.id
  const word = await Dictionary.findById(req.params.id).populate("createdBy", "emri mbiemri")

  if (!word || !word.isActive) {
    throw new ApiError(404, "Word not found")
  }

  const wordsWithStatus = addUnlockStatus([word], userId)

  res.json(new ApiResponse(200, wordsWithStatus[0]))
})

// @desc    Unlock a word
// @route   POST /api/dictionary/:id/unlock
// @access  Private
const unlockWord = asyncHandler(async (req, res) => {
  const userId = req.user.id
  const wordId = req.params.id
  const language = req.body.language || "de"

  const word = await Dictionary.findById(wordId).select("+unlocks")
  if (!word || !word.isActive) {
    throw new ApiError(404, "Word not found")
  }

  // Fetch user to determine their plan
  const user = await User.findById(userId)
  if (!user) {
    throw new ApiError(404, "User not found")
  }

  // Check if already unlocked
  const alreadyUnlocked = word.unlocks?.some((unlock) => unlock.userId.toString() === userId.toString())
  if (alreadyUnlocked) {
    const wordWithStatus = addUnlockStatus([word], userId)
    return res.json(
      new ApiResponse(200, {
        message: "Fjala është zhbllokuar më parë",
        isUnlocked: true,
        word: wordWithStatus[0],
      }),
    )
  }

  // Check daily limit based on plan
  const dailyLimit = getDailyLimit(user)
  const dailyUnlocks = await getDailyUnlockCount(userId)

  if (dailyUnlocks >= dailyLimit) {
    throw new ApiError(
      429,
      `Keni arritur limitin ditor prej ${dailyLimit} fjalëve. Provoni përsëri pas 24 orësh.`,
    )
  }

  // Add unlock to Dictionary word
  word.unlocks.push({
    userId: userId,
    unlockedAt: new Date(),
  })
  await word.save()

  // Also save to User's dictionaryUnlockedWords field
  await User.findByIdAndUpdate(
    userId,
    {
      $push: {
        dictionaryUnlockedWords: {
          wordId: new mongoose.Types.ObjectId(wordId),
          language,
          unlockedAt: new Date(),
        },
      },
    },
    { new: true },
  )

  const wordWithStatus = addUnlockStatus([word], userId)

  res.status(201).json(
    new ApiResponse(
      201,
      {
        word: wordWithStatus[0],
        remainingUnlocks: dailyLimit - dailyUnlocks - 1,
        dailyLimit,
        isPaid: user.isPaid,
        unlockedAt: new Date(),
      },
      "Fjala u zhbllokua me sukses!",
    ),
  )
})

// @desc    Get user's unlock statistics
// @route   GET /api/dictionary/unlocks/stats
// @access  Private
const getUnlockStats = asyncHandler(async (req, res) => {
  const userId = req.user.id

  const user = await User.findById(userId)
  if (!user) {
    throw new ApiError(404, "User not found")
  }

  const dailyLimit = getDailyLimit(user)
  const dailyUnlocks = await getDailyUnlockCount(userId)

  const totalResult = await Dictionary.aggregate([
    { $unwind: "$unlocks" },
    {
      $match: {
        "unlocks.userId": new mongoose.Types.ObjectId(userId),
      },
    },
    { $count: "total" },
  ])

  const totalUnlocks = totalResult.length > 0 ? totalResult[0].total : 0

  let nextResetTime = null
  if (dailyUnlocks > 0) {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const oldestUnlockResult = await Dictionary.aggregate([
      { $unwind: "$unlocks" },
      {
        $match: {
          "unlocks.userId": new mongoose.Types.ObjectId(userId),
          "unlocks.unlockedAt": { $gte: twentyFourHoursAgo },
        },
      },
      { $sort: { "unlocks.unlockedAt": 1 } },
      { $limit: 1 },
      { $project: { unlockedAt: "$unlocks.unlockedAt" } },
    ])

    if (oldestUnlockResult.length > 0) {
      nextResetTime = new Date(oldestUnlockResult[0].unlockedAt.getTime() + 24 * 60 * 60 * 1000)
    }
  }

  res.json(
    new ApiResponse(200, {
      todayUnlocks: dailyUnlocks,
      totalUnlocks,
      remainingUnlocks: Math.max(0, dailyLimit - dailyUnlocks),
      dailyLimit,
      nextResetTime,
      canUnlock: dailyUnlocks < dailyLimit,
      isPaid: user.isPaid,
    }),
  )
})

// @desc    Get user's unlocked words
// @route   GET /api/dictionary/unlocks/my
// @access  Private
const getMyUnlockedWords = asyncHandler(async (req, res) => {
  const userId = req.user.id
  const { page = 1, limit = 20 } = req.query

  const result = await Dictionary.aggregate([
    { $unwind: "$unlocks" },
    {
      $match: {
        "unlocks.userId": new mongoose.Types.ObjectId(userId),
        isActive: true,
      },
    },
    { $sort: { "unlocks.unlockedAt": -1 } },
    { $skip: (page - 1) * limit },
    { $limit: limit * 1 },
    {
      $lookup: {
        from: "users",
        localField: "createdBy",
        foreignField: "_id",
        as: "createdBy",
      },
    },
    { $unwind: { path: "$createdBy", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        word: 1,
        translation: 1,
        level: 1,
        pronunciation: 1,
        partOfSpeech: 1,
        examples: 1,
        difficulty: 1,
        tags: 1,
        isActive: 1,
        unlockedAt: "$unlocks.unlockedAt",
        isUnlocked: { $literal: true },
        "createdBy.emri": 1,
        "createdBy.mbiemri": 1,
      },
    },
  ])

  const totalResult = await Dictionary.aggregate([
    { $unwind: "$unlocks" },
    {
      $match: {
        "unlocks.userId": new mongoose.Types.ObjectId(userId),
        isActive: true,
      },
    },
    { $count: "total" },
  ])

  const total = totalResult.length > 0 ? totalResult[0].total : 0

  res.json(
    new ApiResponse(200, {
      words: result,
      pagination: {
        currentPage: Number.parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalWords: total,
      },
    }),
  )
})

// @desc    Add new word
// @route   POST /api/dictionary
// @access  Private (Admin)
const addWord = asyncHandler(async (req, res) => {
  const { word, translation, level, pronunciation, partOfSpeech, examples, difficulty, tags, language = "de" } = req.body

  const existingWord = await Dictionary.findOne({
    word: { $regex: new RegExp(`^${word}$`, "i") },
    level,
    language,
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
    language,
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

  let userId = req.user?.id
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    userId = new mongoose.Types.ObjectId("60d5ec49f8c7a10015e8d7c1")
  }

  const wordsToInsert = []
  const validationErrors = []

  for (let i = 0; i < words.length; i++) {
    const wordData = words[i]

    try {
      if (!wordData.word || !wordData.translation || !wordData.level) {
        validationErrors.push(`Word ${i + 1}: Missing required fields.`)
        continue
      }

      const transformedExamples =
        wordData.examples?.map((example) => ({
          german: example.german || "",
          albanian: example.albanian || example.english || "",
        })) || []

      const preparedWord = {
        word: wordData.word.trim(),
        translation: wordData.translation.trim(),
        level: wordData.level,
        pronunciation: wordData.pronunciation || "",
        partOfSpeech: wordData.partOfSpeech || "",
        examples: transformedExamples,
        difficulty: wordData.difficulty || 1,
        tags: Array.isArray(wordData.tags) ? wordData.tags.map((tag) => tag.trim().toLowerCase()) : [],
        language: wordData.language || "de",
        createdBy: userId,
        isActive: true,
        unlocks: [],
      }

      const tempWord = new Dictionary(preparedWord)
      await tempWord.validate()

      wordsToInsert.push(preparedWord)
    } catch (error) {
      if (error.name === "ValidationError") {
        const messages = Object.values(error.errors)
          .map((err) => err.message)
          .join(", ")
        validationErrors.push(`Word ${i + 1}: ${messages}`)
      } else {
        validationErrors.push(`Word ${i + 1}: ${error.message}`)
      }
    }
  }

  if (wordsToInsert.length === 0) {
    throw new ApiError(400, `No valid words to insert. Errors: ${validationErrors.join("; ")}`)
  }

  try {
    const insertResult = await Dictionary.insertMany(wordsToInsert, {
      ordered: false,
      rawResult: true,
    })

    const insertedCount = insertResult.insertedCount || insertResult.length
    const insertedDocs = insertResult.ops || insertResult

    const duplicateErrors = []
    if (insertResult.writeErrors && insertResult.writeErrors.length > 0) {
      insertResult.writeErrors.forEach((err) => {
        if (err.code === 11000) {
          duplicateErrors.push(`Duplicate: ${err.op.word}`)
        }
      })
    }

    const finalErrors = [...validationErrors, ...duplicateErrors]

    res.status(201).json(
      new ApiResponse(
        201,
        {
          words: insertedDocs,
          count: insertedCount,
          errors: finalErrors.length > 0 ? finalErrors : undefined,
          totalAttempted: words.length,
          successful: insertedCount,
          failed: words.length - insertedCount,
        },
        `${insertedCount} words added successfully`,
      ),
    )
  } catch (error) {
    throw new ApiError(500, `Failed to insert words: ${error.message}`)
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

  word.isActive = false
  await word.save()

  res.json(new ApiResponse(200, null, "Word deleted successfully"))
})

// @desc    Search words
// @route   GET /api/dictionary/search
// @access  Public
const searchWords = asyncHandler(async (req, res) => {
  const { q, level, limit = 10, language } = req.query
  const userId = req.user?.id

  if (!q || q.trim().length < 2) {
    throw new ApiError(400, "Search query must be at least 2 characters long")
  }

  const langQuery = buildLanguageQuery(language)
  const query = {
    isActive: true,
    ...langQuery,
    $or: [
      { word: { $regex: q, $options: "i" } },
      { translation: { $regex: q, $options: "i" } },
      { tags: { $in: [new RegExp(q, "i")] } },
    ],
  }

  if (level) {
    query.level = level
  }

  const words = await Dictionary.find(query).select("+unlocks").limit(Number.parseInt(limit)).sort({ word: 1 }).lean()

  const wordsWithUnlockStatus = addUnlockStatus(words, userId)

  res.json(
    new ApiResponse(200, {
      words: wordsWithUnlockStatus,
      query: q,
      count: words.length,
    }),
  )
})

module.exports = {
  getAllWords,
  getWordsByLevel,
  getWordById,
  unlockWord,
  getUnlockStats,
  getMyUnlockedWords,
  addWord,
  addMultipleWords,
  updateWord,
  deleteWord,
  searchWords,
}