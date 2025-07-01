const express = require("express")
const {
  getAllWords,
  getWordsByLevel,
  getWordById,
  addWord,
  addMultipleWords,
  updateWord,
  deleteWord,
  searchWords,
} = require("../controllers/dictionaryController")
const  auth  = require("../middleware/auth")
const isAdmin = require("../middleware/isAdmin")
const { validateWord } = require("../middleware/validation")

const router = express.Router()

// Public routes
router.get("/", getAllWords)
router.get("/search", searchWords)
router.get("/level/:level", getWordsByLevel)
router.get("/:id", getWordById)

// Protected admin routes
router.post("/", auth, isAdmin, validateWord, addWord)
router.post("/bulk", auth, isAdmin, addMultipleWords)
router.put("/:id", auth, isAdmin, validateWord, updateWord)
router.delete("/:id", auth, isAdmin, deleteWord)

module.exports = router
