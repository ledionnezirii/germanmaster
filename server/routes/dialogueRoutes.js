const express = require("express");
const router = express.Router();
const dialogueController = require("../controllers/dialogueController");
const protect = require("../middleware/auth");

// Public routes (or protected based on your needs)
router.get("/", protect, dialogueController.getAllDialogues);
router.get("/progress", protect, dialogueController.getUserProgress);
router.get("/finished", protect, dialogueController.getFinishedDialogues);
router.get("/:id", protect, dialogueController.getDialogueById);

// Quiz/Exercise submissions
router.post("/submit", protect, dialogueController.submitDialogueQuiz); // For regular type
router.post("/submit-sentence-builder", protect, dialogueController.submitSentenceBuilder); // NEW
router.post("/submit-free-write", protect, dialogueController.submitFreeWrite); // NEW

// Admin routes
router.post("/", protect, dialogueController.createDialogue);
router.put("/:id", protect, dialogueController.updateDialogue);
router.delete("/:id", protect, dialogueController.deleteDialogue);

module.exports = router;