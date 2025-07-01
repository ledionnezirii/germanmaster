const Favorite = require("../models/Favorite")
const Dictionary = require("../models/Dictionary")
const { ApiError } = require("../utils/ApiError")
const { ApiResponse } = require("../utils/ApiResponse")
const { asyncHandler } = require("../utils/asyncHandler")

// @desc    Get all user favorites
// @route   GET /api/favorites
// @access  Private
const getAllFavorites = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, level } = req.query

  const query = { userId: req.user.id }

  const favorites = await Favorite.find(query)
    .populate({
      path: "wordId",
      match: level ? { level, isActive: true } : { isActive: true },
      select: "word translation level pronunciation partOfSpeech examples tags",
    })
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)

  // Filter out favorites where word was deleted or doesn't match level
  const validFavorites = favorites.filter((fav) => fav.wordId)

  const total = await Favorite.countDocuments(query)

  res.json(
    new ApiResponse(200, {
      favorites: validFavorites,
      pagination: {
        currentPage: Number.parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalFavorites: total,
      },
    }),
  )
})

// @desc    Add word to favorites
// @route   POST /api/favorites
// @access  Private
const addFavorite = asyncHandler(async (req, res) => {
  const { wordId, notes } = req.body

  if (!wordId) {
    throw new ApiError(400, "Word ID is required")
  }

  // Check if word exists
  const word = await Dictionary.findById(wordId)
  if (!word || !word.isActive) {
    throw new ApiError(404, "Word not found")
  }

  // Check if already favorited
  const existingFavorite = await Favorite.findOne({
    userId: req.user.id,
    wordId,
  })

  if (existingFavorite) {
    throw new ApiError(400, "Word is already in favorites")
  }

  const favorite = await Favorite.create({
    userId: req.user.id,
    wordId,
    notes,
  })

  const populatedFavorite = await Favorite.findById(favorite._id).populate(
    "wordId",
    "word translation level pronunciation",
  )

  res.status(201).json(new ApiResponse(201, populatedFavorite, "Word added to favorites"))
})

// @desc    Remove word from favorites
// @route   DELETE /api/favorites/:wordId
// @access  Private
const removeFavorite = asyncHandler(async (req, res) => {
  const { wordId } = req.params

  const favorite = await Favorite.findOne({
    userId: req.user.id,
    wordId,
  })

  if (!favorite) {
    throw new ApiError(404, "Favorite not found")
  }

  await Favorite.findByIdAndDelete(favorite._id)

  res.json(new ApiResponse(200, null, "Word removed from favorites"))
})

// @desc    Update favorite notes
// @route   PUT /api/favorites/:wordId
// @access  Private
const updateFavoriteNotes = asyncHandler(async (req, res) => {
  const { wordId } = req.params
  const { notes } = req.body

  const favorite = await Favorite.findOne({
    userId: req.user.id,
    wordId,
  })

  if (!favorite) {
    throw new ApiError(404, "Favorite not found")
  }

  favorite.notes = notes
  await favorite.save()

  const populatedFavorite = await Favorite.findById(favorite._id).populate(
    "wordId",
    "word translation level pronunciation",
  )

  res.json(new ApiResponse(200, populatedFavorite, "Favorite notes updated"))
})

// @desc    Check if word is favorited
// @route   GET /api/favorites/check/:wordId
// @access  Private
const checkFavorite = asyncHandler(async (req, res) => {
  const { wordId } = req.params

  const favorite = await Favorite.findOne({
    userId: req.user.id,
    wordId,
  })

  res.json(
    new ApiResponse(200, {
      isFavorite: !!favorite,
      favoriteId: favorite?._id,
      notes: favorite?.notes,
    }),
  )
})

// @desc    Get favorites by level
// @route   GET /api/favorites/level/:level
// @access  Private
const getFavoritesByLevel = asyncHandler(async (req, res) => {
  const { level } = req.params
  const { page = 1, limit = 20 } = req.query

  if (!["A1", "A2", "B1", "B2", "C1", "C2"].includes(level)) {
    throw new ApiError(400, "Invalid level")
  }

  const favorites = await Favorite.find({ userId: req.user.id })
    .populate({
      path: "wordId",
      match: { level, isActive: true },
      select: "word translation level pronunciation partOfSpeech examples",
    })
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)

  // Filter out favorites where word doesn't match level
  const validFavorites = favorites.filter((fav) => fav.wordId)

  res.json(
    new ApiResponse(200, {
      favorites: validFavorites,
      level,
      count: validFavorites.length,
    }),
  )
})

// @desc    Get favorite statistics
// @route   GET /api/favorites/stats
// @access  Private
const getFavoriteStats = asyncHandler(async (req, res) => {
  const stats = await Favorite.aggregate([
    { $match: { userId: req.user._id } },
    {
      $lookup: {
        from: "dictionaries",
        localField: "wordId",
        foreignField: "_id",
        as: "word",
      },
    },
    { $unwind: "$word" },
    { $match: { "word.isActive": true } },
    {
      $group: {
        _id: "$word.level",
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ])

  const totalFavorites = await Favorite.countDocuments({ userId: req.user.id })

  res.json(
    new ApiResponse(200, {
      totalFavorites,
      byLevel: stats,
    }),
  )
})

module.exports = {
  getAllFavorites,
  addFavorite,
  removeFavorite,
  updateFavoriteNotes,
  checkFavorite,
  getFavoritesByLevel,
  getFavoriteStats,
}
