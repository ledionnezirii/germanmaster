const express = require("express")
const router = express.Router()
const {
  getLearnedWords,
  addLearnedWord,
  updateLearnedWord,
  removeLearnedWord,
  getWordStats,
  addQuizXp,
} = require("../controllers/wordController")
const  protect  = require("../middleware/auth")

// All routes require authentication
router.use(protect)

// GET /api/words - Get all learned words
router.get("/", getLearnedWords)

// GET /api/words/stats - Get word statistics
router.get("/stats", getWordStats)

// POST /api/words - Add a new learned word
router.post("/", addLearnedWord)

// POST /api/words/quiz-xp - Add XP for correct quiz answers
router.post("/quiz-xp", addQuizXp)

// PUT /api/words/:id - Update a learned word
router.put("/:id", updateLearnedWord)

// DELETE /api/words/:id - Remove a learned word
router.delete("/:id", removeLearnedWord)

module.exports = router
