const Category = require("../models/Category");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const { asyncHandler } = require("../utils/asyncHandler");
const User = require("../models/User");
const { addUserXp } = require("./xpController")

const buildLanguageQuery = (language) => {
  if (!language) return {}
  if (language === "de") {
    return { $or: [{ language: "de" }, { language: { $exists: false } }, { language: null }] }
  }
  return { language }
}
// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
const getAllCategories = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, level, language } = req.query;

  const langQuery = buildLanguageQuery(language)
  const query = { isActive: true, ...langQuery };
  if (level) {
    query.level = level;
  }

  const categories = await Category.find(query)
    .select("-words") // Exclude words for performance
    .sort({ createdAt: 1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate("createdBy", "emri mbiemri");

  const total = await Category.countDocuments(query);

  // Add word count to each category
  const categoriesWithCount = await Promise.all(
    categories.map(async (cat) => {
      const wordCount = cat.words ? cat.words.length : 0;
      return {
        ...cat.toObject(),
        wordCount,
      };
    })
  );

  res.json(
    new ApiResponse(200, {
      data: categoriesWithCount,
      pagination: {
        currentPage: Number.parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalCategories: total,
      },
    })
  );
});

// @desc    Get category by ID with words
// @route   GET /api/categories/:id
// @access  Public
const getCategoryById = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id).populate(
    "createdBy",
    "emri mbiemri"
  );

  if (!category || !category.isActive) {
    throw new ApiError(404, "Category not found");
  }

  res.json(
    new ApiResponse(200, {
      data: {
        ...category.toObject(),
        wordCount: category.words.length,
      },
    })
  );
});

// @desc    Create new category
// @route   POST /api/categories
// @access  Private (Admin)
const createCategory = asyncHandler(async (req, res) => {
  const { category, description, level, words, icon, color, type, language = "de" } = req.body;

  console.log("[DEBUG] Received type from request body:", type);
  console.log("[DEBUG] Type of received type:", typeof type);
  console.log("[DEBUG] Full request body:", JSON.stringify(req.body, null, 2));

  // Check if category already exists
  const existingCategory = await Category.findOne({
    category: { $regex: new RegExp(`^${category}$`, "i") },
  });

  if (existingCategory) {
    throw new ApiError(400, `Category "${category}" already exists`);
  }

  const categoryData = {
    category,
    description,
    level,
    words,
    icon,
    color,
    type,
    language,
    createdBy: req.user.id,
  };
  console.log(
    "[DEBUG] Data being passed to Category.create:",
    JSON.stringify(categoryData, null, 2)
  );

  const newCategory = await Category.create(categoryData);

  console.log("[DEBUG] Created category type:", newCategory.type);
  console.log(
    "[DEBUG] Full created category:",
    JSON.stringify(newCategory.toObject(), null, 2)
  );

  res
    .status(201)
    .json(new ApiResponse(201, newCategory, "Category created successfully"));
});

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private (Admin)
const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  const updatedCategory = await Category.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  res.json(
    new ApiResponse(200, updatedCategory, "Category updated successfully")
  );
});

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private (Admin)
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  // Soft delete
  category.isActive = false;
  await category.save();

  res.json(new ApiResponse(200, null, "Category deleted successfully"));
});

// @desc    Add word to category
// @route   POST /api/categories/:id/words
// @access  Private (Admin)
const addWordToCategory = asyncHandler(async (req, res) => {
  const { word, translation, examples, pronunciation, type } = req.body;

  const category = await Category.findById(req.params.id);

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  // Check if word already exists in category
  const existingWord = category.words.find(
    (w) => w.word.toLowerCase() === word.toLowerCase()
  );

  if (existingWord) {
    throw new ApiError(400, `Word "${word}" already exists in this category`);
  }

  category.words.push({
    word,
    translation,
    examples,
    pronunciation,
    type,
  });

  await category.save();

  res.json(
    new ApiResponse(200, category, "Word added to category successfully")
  );
});

// @desc    Remove word from category
// @route   DELETE /api/categories/:id/words/:wordId
// @access  Private (Admin)
const removeWordFromCategory = asyncHandler(async (req, res) => {
  const { id, wordId } = req.params;

  const category = await Category.findById(id);

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  category.words = category.words.filter(
    (word) => word._id.toString() !== wordId
  );
  await category.save();

  res.json(
    new ApiResponse(200, category, "Word removed from category successfully")
  );
});

const finishCategory = asyncHandler(async (req, res) => {
  const categoryId = req.params.id;
  const userId = req.user.id;

  // Find the category
  const category = await Category.findById(categoryId);
  if (!category || !category.isActive) {
    throw new ApiError(404, "Category not found");
  }

  // Find the user
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Check if category is already finished
  if (user.categoryFinished.includes(categoryId)) {
    throw new ApiError(400, "Category already finished");
  }

  const xpGained = 10;

user.categoryFinished.push(categoryId)
await user.save()
await addUserXp(userId, xpGained)
  res.json(
    new ApiResponse(
      200,
      {
        xpGained,
        totalXp: user.xp,
        categoryName: category.category,
      },
      "Category finished successfully! Congratulations!"
    )
  );
});
const getFinishedCategories = asyncHandler(async (req, res) => {
  const { language } = req.query;
  const userId = req.user.id;

  const langMatch = language ? buildLanguageQuery(language) : {};

  const user = await User.findById(userId).populate({
    path: "categoryFinished",
    select: "category description level icon color type language",
    match: { isActive: true, ...langMatch },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const finishedCategoryIds = user.categoryFinished.map((cat) =>
    cat._id.toString()
  );

  res.json(
    new ApiResponse(200, {
      finishedCategories: user.categoryFinished,
      finishedCategoryIds: finishedCategoryIds,
      isPaid: user.isPaid || false,
    })
  );
});

// @desc    Bulk create categories
// @route   POST /api/categories/bulk
// @access  Private (Admin)
const bulkCreateCategories = asyncHandler(async (req, res) => {
  const { categories } = req.body;

  if (!Array.isArray(categories) || categories.length === 0) {
    throw new ApiError(400, "categories array is required");
  }

  const results = { created: [], skipped: [], errors: [] };

  for (const cat of categories) {
    try {
      const existing = await Category.findOne({
        category: { $regex: new RegExp(`^${cat.category}$`, "i") },
      });
      if (existing) {
        results.skipped.push(cat.category);
        continue;
      }
      const created = await Category.create({ ...cat, createdBy: req.user.id });
      results.created.push(created.category);
    } catch (err) {
      results.errors.push({ category: cat.category, error: err.message });
    }
  }

  res.status(201).json(new ApiResponse(201, results, `Created: ${results.created.length}, Skipped: ${results.skipped.length}, Errors: ${results.errors.length}`));
});

const getFinishedCategoriesWords = asyncHandler(async (req, res) => {
  const { language } = req.query;
  const userId = req.user.id;

  const user = await User.findById(userId).populate({
    path: "categoryFinished",
    select: "words language",
    match: { isActive: true },
  });

  if (!user) throw new ApiError(404, "User not found");

  let cats = user.categoryFinished || [];
  if (language) {
    const langQuery = buildLanguageQuery(language);
    if (language === "de") {
      cats = cats.filter(c => !c.language || c.language === "de");
    } else {
      cats = cats.filter(c => c.language === language);
    }
  }

  const words = cats.flatMap(c => c.words || []);
  res.json(new ApiResponse(200, { words }));
});

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  bulkCreateCategories,
  updateCategory,
  deleteCategory,
  addWordToCategory,
  removeWordFromCategory,
  finishCategory,
  getFinishedCategories,
  getFinishedCategoriesWords,
};
