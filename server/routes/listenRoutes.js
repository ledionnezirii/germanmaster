const express = require("express")
const {
  getAllTests,
  getTestsByLevel,
  getTestById,
  checkAnswer,
  markAsListened,
  createTest,
  updateTest,
  deleteTest,
  getUserProgress,
} = require("../controllers/listenController")
const  auth  = require("../middleware/auth")
const isAdmin = require("../middleware/isAdmin")

const router = express.Router()

// Public routes
router.get("/", getAllTests)
router.get("/level/:level", getTestsByLevel)
router.get("/:id", getTestById)

// Protected user routes
router.post("/check", auth, checkAnswer)
router.post("/:id/mark-listened", auth, markAsListened)
router.get("/user/progress", auth, getUserProgress)

// Protected admin routes
router.post("/", auth, isAdmin, createTest)
router.put("/:id", auth, isAdmin, updateTest)
router.delete("/:id", auth, isAdmin, deleteTest)

module.exports = router
