const express = require("express")
const {
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
} = require("../controllers/dictionaryController")
const auth = require("../middleware/auth")
const isAdmin = require("../middleware/isAdmin")
const { validateWord } = require("../middleware/validation")

const router = express.Router()

// Public routes
router.get("/", auth,getAllWords)
router.get("/search", auth,searchWords)
router.get("/level/:level", auth,getWordsByLevel)

// Protected user routes - unlock features (MUST come BEFORE /:id route!)
router.get("/unlocks/stats", auth, getUnlockStats)
router.get("/unlocks/my", auth, getMyUnlockedWords)
router.post("/:id/unlock", auth, unlockWord)

// This MUST come after the specific routes above
router.get("/:id", getWordById)

// Protected admin routes
router.post("/", auth, isAdmin, validateWord, addWord)
router.post("/bulk", auth, isAdmin, addMultipleWords)
router.put("/:id", auth, isAdmin, validateWord, updateWord)
router.delete("/:id", auth, isAdmin, deleteWord)

module.exports = router