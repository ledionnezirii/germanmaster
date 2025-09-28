// routes/quizRoutes.js
const express = require("express");
const router = express.Router();
const  quizController  = require("../controllers/quizController");
const auth = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");

// CRUD routes
router.get("/", quizController.getAllQuizes);

// NEW: Get all completed quizzes for logged-in user
router.get("/completed/user", auth, quizController.getCompletedQuizes);

// Get quiz by ID
router.get("/:id", quizController.getQuizById);

router.post("/", auth, isAdmin, quizController.createQuiz);
router.post("/bulk", auth, isAdmin, quizController.createBulkQuizes);
router.put("/:id", auth, isAdmin, quizController.updateQuiz);

// Submit quiz
router.post("/:id/submit", auth, quizController.submitQuiz);

router.delete("/:id", auth, isAdmin, quizController.deleteQuiz);

module.exports = router;
