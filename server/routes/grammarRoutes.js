const express = require("express");
const router = express.Router();
const {
  getAllPhrases,
  getPhrasesByLevel,
  getPhraseById,
  createPhrase,
  createBulkPhrases,
  updatePhrase,
  deletePhrase,
  markPhraseAsFinished,
  unmarkPhraseAsFinished,
  getFinishedPhrases,
  getUserPhraseProgress,
  getDailyLimitStatus,
} = require("../controllers/phraseController");
const isAdmin = require("../middleware/isAdmin");
const protect = require("../middleware/auth");

// Public routes
router.get("/", getAllPhrases);
router.get("/level/:level", protect, getPhrasesByLevel);
router.get("/user/finished", protect, getFinishedPhrases);
router.get("/user/progress", protect, getUserPhraseProgress);
router.get("/user/daily-limit", protect, getDailyLimitStatus); // NEW ROUTE
router.get("/:id", protect, getPhraseById);

// User routes - mark/unmark phrases as finished
router.post("/:phraseId/finish", protect, markPhraseAsFinished);
router.delete("/:phraseId/finish", protect, unmarkPhraseAsFinished);

// Admin routes
router.post("/", protect, isAdmin, createPhrase);
router.post("/bulk", protect, isAdmin, createBulkPhrases);
router.put("/:id", protect, isAdmin, updatePhrase);
router.delete("/:id", protect, isAdmin, deletePhrase);

module.exports = router;