const Category = require("../models/Category")
const { ApiError } = require("../utils/ApiError")
const { ApiResponse } = require("../utils/ApiResponse")
const { asyncHandler } = require("../utils/asyncHandler")

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
const getAllCategories = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, level } = req.query

  const query = { isActive: true }
  if (level) {
    query.level = level
  }

  const categories = await Category.find(query)
    .select("-words") // Exclude words for performance
    .sort({ category: 1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate("createdBy", "emri mbiemri")

  const total = await Category.countDocuments(query)

  // Add word count to each category
  const categoriesWithCount = await Promise.all(
    categories.map(async (cat) => {
      const wordCount = cat.words ? cat.words.length : 0
      return {
        ...cat.toObject(),
        wordCount,
      }
    }),
  )

  res.json(
    new ApiResponse(200, {
      data: categoriesWithCount,
      pagination: {
        currentPage: Number.parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalCategories: total,
      },
    }),
  )
})

// @desc    Get category by ID with words
// @route   GET /api/categories/:id
// @access  Public
const getCategoryById = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id).populate("createdBy", "emri mbiemri")

  if (!category || !category.isActive) {
    throw new ApiError(404, "Category not found")
  }

  res.json(
    new ApiResponse(200, {
      data: {
        ...category.toObject(),
        wordCount: category.words.length,
      },
    }),
  )
})

// @desc    Create new category
// @route   POST /api/categories
// @access  Private (Admin)
const createCategory = asyncHandler(async (req, res) => {
  const { category, description, level, words, icon, color } = req.body

  // Check if category already exists
  const existingCategory = await Category.findOne({
    category: { $regex: new RegExp(`^${category}$`, "i") },
  })

  if (existingCategory) {
    throw new ApiError(400, `Category "${category}" already exists`)
  }

  const newCategory = await Category.create({
    category,
    description,
    level,
    words,
    icon,
    color,
    createdBy: req.user.id,
  })

  res.status(201).json(new ApiResponse(201, newCategory, "Category created successfully"))
})

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private (Admin)
const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id)

  if (!category) {
    throw new ApiError(404, "Category not found")
  }

  const updatedCategory = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })

  res.json(new ApiResponse(200, updatedCategory, "Category updated successfully"))
})

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private (Admin)
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id)

  if (!category) {
    throw new ApiError(404, "Category not found")
  }

  // Soft delete
  category.isActive = false
  await category.save()

  res.json(new ApiResponse(200, null, "Category deleted successfully"))
})

// @desc    Add word to category
// @route   POST /api/categories/:id/words
// @access  Private (Admin)
const addWordToCategory = asyncHandler(async (req, res) => {
  const { word, translation, examples, pronunciation } = req.body

  const category = await Category.findById(req.params.id)

  if (!category) {
    throw new ApiError(404, "Category not found")
  }

  // Check if word already exists in category
  const existingWord = category.words.find((w) => w.word.toLowerCase() === word.toLowerCase())

  if (existingWord) {
    throw new ApiError(400, `Word "${word}" already exists in this category`)
  }

  category.words.push({
    word,
    translation,
    examples,
    pronunciation,
  })

  await category.save()

  res.json(new ApiResponse(200, category, "Word added to category successfully"))
})

// @desc    Remove word from category
// @route   DELETE /api/categories/:id/words/:wordId
// @access  Private (Admin)
const removeWordFromCategory = asyncHandler(async (req, res) => {
  const { id, wordId } = req.params

  const category = await Category.findById(id)

  if (!category) {
    throw new ApiError(404, "Category not found")
  }

  category.words = category.words.filter((word) => word._id.toString() !== wordId)
  await category.save()

  res.json(new ApiResponse(200, category, "Word removed from category successfully"))
})

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  addWordToCategory,
  removeWordFromCategory,
}
