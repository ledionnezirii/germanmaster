const express = require("express")
const {
  getAllQuestions,
  getQuestionsByLevel,
  getQuestionById,
  answerQuestion,
  getRandomQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getQuestionsByCategory,
} = require("../controllers/questionController")
const  auth  = require("../middleware/auth")
const isAdmin = require("../middleware/isAdmin")

const router = express.Router()

// Public routes
router.get("/", getAllQuestions)
router.get("/random", getRandomQuestion)
router.get("/level/:level", getQuestionsByLevel)
router.get("/category/:category", getQuestionsByCategory)
router.get("/:id", getQuestionById)

// Protected user routes
router.post("/:id/answer", auth, answerQuestion)

// Protected admin routes
router.post("/", auth, isAdmin, createQuestion)
router.put("/:id", auth, isAdmin, updateQuestion)
router.delete("/:id", auth, isAdmin, deleteQuestion)

module.exports = router
