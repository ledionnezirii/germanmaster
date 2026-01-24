const express = require("express");
const router = express.Router();
const {
  getAllSentences,
  getSentenceById,
  getSentencesByLevel,
  createSentence,
  createBulkSentences,
  updateSentence,
  deleteSentence,
  submitSentence,
  getCompletedSentences,
  getFinishedSentences
} = require("../controllers/sentenceController");
const  protect  = require("../middleware/auth");
const adminOnly = require("../middleware/isAdmin")

// Public routes (protected by auth)
router.get("/", protect, getAllSentences);
router.get("/completed", protect, getCompletedSentences);
router.get("/finished", protect, getFinishedSentences);
router.get("/level/:level", protect, getSentencesByLevel);
router.get("/:id", protect, getSentenceById);
router.post("/:id/submit", protect, submitSentence);

// Admin routes
router.post("/", protect, adminOnly, createSentence);
router.post("/bulk", protect, adminOnly, createBulkSentences);
router.put("/:id", protect, adminOnly, updateSentence);
router.delete("/:id", protect, adminOnly, deleteSentence);

module.exports = router;
