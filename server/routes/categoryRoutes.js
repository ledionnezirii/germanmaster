const express = require("express")
const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  addWordToCategory,
  removeWordFromCategory,
} = require("../controllers/categoryController")
const  auth  = require("../middleware/auth")
const isAdmin = require("../middleware/isAdmin")
const { validateCategory } = require("../middleware/validation")

const router = express.Router()

// Public routes
router.get("/", getAllCategories)
router.get("/:id", getCategoryById)

// Protected admin routes
router.post("/", auth, isAdmin, validateCategory, createCategory)
router.put("/:id", auth, isAdmin, updateCategory)
router.delete("/:id", auth, isAdmin, deleteCategory)
router.post("/:id/words", auth, isAdmin, addWordToCategory)
router.delete("/:id/words/:wordId", auth, isAdmin, removeWordFromCategory)

module.exports = router
