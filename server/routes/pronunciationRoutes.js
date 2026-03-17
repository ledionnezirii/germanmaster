const express = require("express")
const router = express.Router()
const multer = require("multer")
const {
  getWords,
  addWord,
  checkPronunciation,
  getUserCompletedPackages,
  transcribeAudio,
} = require("../controllers/pronunciationController")
const protect = require("../middleware/auth")
const isAdmin = require("../middleware/isAdmin")

const upload = multer({ storage: multer.memoryStorage() })

router.get("/", protect, getWords)
router.post("/", protect, isAdmin, addWord)
router.post("/check", protect, checkPronunciation)
router.get("/completed-pronunciation-packages", protect, getUserCompletedPackages)
router.post("/transcribe", protect, upload.single("audio"), transcribeAudio)

module.exports = router