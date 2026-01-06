const express = require("express");
const router = express.Router();
const dialogueController = require("../controllers/dialogueController");
const  protect  = require("../middleware/auth"); // Your auth middleware

// Public routes (or protected based on your needs)
router.get("/", protect, dialogueController.getAllDialogues);
router.get("/progress", protect, dialogueController.getUserProgress);
router.get("/finished", protect, dialogueController.getFinishedDialogues);
router.get("/:id", protect, dialogueController.getDialogueById);

// Quiz submission
router.post("/submit", protect, dialogueController.submitDialogueQuiz);

// Admin routes (add admin middleware if needed)
router.post("/", protect, dialogueController.createDialogue);
router.put("/:id", protect, dialogueController.updateDialogue);
router.delete("/:id", protect, dialogueController.deleteDialogue);

module.exports = router;