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
} = require("../controllers/phraseController");
const isAdmin = require("../middleware/isAdmin");
const protect = require("../middleware/auth");

// Assuming you have these middleware functions
// const { protect } = require("../middleware/auth");
// const { adminOnly } = require("../middleware/admin");

// Public routes (or protected based on your needs)
router.get("/", getAllPhrases); // Add protect middleware if needed
router.get("/level/:level",protect,getPhrasesByLevel); // Add protect middleware if needed
router.get("/user/finished", protect,getFinishedPhrases); // Requires protect middleware
router.get("/user/progress", protect,getUserPhraseProgress); // Requires protect middleware
router.get("/:id",protect, getPhraseById); // Add protect middleware if needed

// User routes - mark/unmark phrases as finished
router.post("/:phraseId/finish", protect,markPhraseAsFinished); // Requires protect middleware
router.delete("/:phraseId/finish", protect,unmarkPhraseAsFinished); // Requires protect middleware

// Admin routes - CRUD operations
router.post("/", protect, isAdmin, createPhrase); // Requires protect + adminOnly middleware
router.post("/bulk", protect, isAdmin, createBulkPhrases); // Requires protect + adminOnly middleware
router.put("/:id", protect, isAdmin, updatePhrase); // Requires protect + adminOnly middleware
router.delete("/:id", protect, isAdmin, deletePhrase); // Requires protect + adminOnly middleware

module.exports = router;
