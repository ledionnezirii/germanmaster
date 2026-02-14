const express = require("express");
const router = express.Router();
const {
  getAllLessons,
  getLessonById,
  createLesson,
  updateLesson,
  deleteLesson,
  submitLesson,
  getFinishedLessons,
} = require("../controllers/createWordController");
const  protect = require("../middleware/auth");
const adminOnly = require("../middleware/isAdmin");

// Public/User routes
router.get("/",protect, getAllLessons);
router.get("/finished", protect, getFinishedLessons);
router.get("/:id", protect, getLessonById);
router.post("/submit", protect, submitLesson);

// Admin routes
router.post("/", protect, adminOnly, createLesson);
router.put("/:id", protect, adminOnly, updateLesson);
router.delete("/:id", protect, adminOnly, deleteLesson);

module.exports = router;