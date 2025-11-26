const express = require("express")
const {
  getAllTopics,
  getTopicsByLevel,
  getTopicById,
  createTopic,
  updateTopic,
  deleteTopic,
  markTopicAsFinished,
  getFinishedTopics,
  getDailyLimitStatus,
} = require("../controllers/grammarController")
const auth = require("../middleware/auth")
const isAdmin = require("../middleware/isAdmin")

const router = express.Router()

// Public routes
router.get("/", getAllTopics)
router.get("/level/:level", getTopicsByLevel)

router.get("/daily-limit-status", auth, getDailyLimitStatus)
router.get("/finished", auth, getFinishedTopics)

router.get("/:id", auth, getTopicById)
router.post("/:id/finish", auth, markTopicAsFinished)

// Protected admin routes
router.post("/", auth, isAdmin, createTopic)
router.put("/:id", auth, isAdmin, updateTopic)
router.delete("/:id", auth, isAdmin, deleteTopic)

module.exports = router
