const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");
const checkSubscription = require("../middleware/checkSubscription");
const {
  getAllSets,
  getSetById,
  submitQuiz,
  getFinishedSets,
  createSet,
  createBulkSets,
  updateSet,
  deleteSet,
} = require("../controllers/wordAudioController");

router.get("/", protect, checkSubscription, getAllSets);
router.get("/finished", protect, checkSubscription, getFinishedSets);
router.get("/:id", protect, checkSubscription, getSetById);
router.post("/submit", protect, checkSubscription, submitQuiz);

// Admin
router.post("/admin", protect, createSet);
router.post("/admin/bulk", protect, createBulkSets);
router.put("/admin/:id", protect, updateSet);
router.delete("/admin/:id", protect, deleteSet);

module.exports = router;