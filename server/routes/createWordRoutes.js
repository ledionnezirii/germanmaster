const express = require("express");
const router = express.Router();
const {
  getAllLessons,
  getLessonById,
  createLesson,
  bulkCreateLessons,
  updateLesson,
  deleteLesson,
  submitLesson,
  getFinishedLessons,
  getMyWords,
  addMyWord,
  deleteMyWord,
  submitMyWordsQuiz,
} = require("../controllers/createWordController");
const  protect = require("../middleware/auth");
const adminOnly = require("../middleware/isAdmin");

// User personal word list routes (free)
router.get("/my-words", protect, getMyWords);
router.post("/my-words", protect, addMyWord);
router.delete("/my-words/:id", protect, deleteMyWord);
router.post("/my-words/quiz", protect, submitMyWordsQuiz);

// Public/User routes
router.get("/", protect, getAllLessons);
router.get("/finished", protect, getFinishedLessons);
router.get("/:id", protect, getLessonById);
router.post("/submit", protect, submitLesson);

// Admin routes
router.post("/admin/bulk", protect, adminOnly, bulkCreateLessons);
router.post("/admin", protect, adminOnly, createLesson);
router.put("/:id", protect, adminOnly, updateLesson);
router.delete("/:id", protect, adminOnly, deleteLesson);

module.exports = router;