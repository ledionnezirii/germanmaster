const express = require("express")
const {
  getAllTopics,
  getTopicsByLevel,
  getTopicById,
  createTopic,
  updateTopic,
  deleteTopic,
} = require("../controllers/grammarController")
const  auth  = require("../middleware/auth")
const isAdmin = require("../middleware/isAdmin")

const router = express.Router()

// Public routes
router.get("/", getAllTopics)
router.get("/level/:level", getTopicsByLevel)
router.get("/:id", getTopicById)

// Protected admin routes
router.post("/", auth, isAdmin, createTopic)
router.put("/:id", auth, isAdmin, updateTopic)
router.delete("/:id", auth, isAdmin, deleteTopic)

module.exports = router
