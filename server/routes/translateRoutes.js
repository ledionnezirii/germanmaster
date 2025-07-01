const express = require("express")
const {
  getAllTexts,
  getTextById,
  submitAnswers,
  getTextProgress,
  getUserProgress,
  createText,
  updateText,
  deleteText,
} = require("../controllers/translateController")
const  auth  = require("../middleware/auth")
const isAdmin = require("../middleware/isAdmin")

const router = express.Router()

// Public routes
router.get("/", getAllTexts)
router.get("/user/progress", auth, getUserProgress) // ✅ Vendoset sipër
router.get("/:id", getTextById)

// Protected user routes
router.post("/:id/submit", auth, submitAnswers)
router.get("/:id/progress", auth, getTextProgress)

// Protected admin routes
router.post("/", auth, isAdmin, createText)
router.put("/:id", auth, isAdmin, updateText)
router.delete("/:id", auth, isAdmin, deleteText)


module.exports = router
