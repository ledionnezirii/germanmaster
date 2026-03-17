const express = require("express");
const router = express.Router();
const storyController = require("../controllers/storyController");
const protect = require("../middleware/auth");
const adminOnly = require("../middleware/isAdmin");

// Public / user routes
router.get("/", protect, storyController.getAllStories);
router.get("/finished", protect, storyController.getFinishedStories);
router.get("/:id", protect, storyController.getStoryById);
router.post("/submit", protect, storyController.submitStory);
router.post("/check-answer", protect, storyController.checkStepAnswer);

// Admin routes
router.post("/", protect, adminOnly, storyController.createStory);
router.put("/:id", protect, adminOnly, storyController.updateStory);
router.delete("/:id", protect, adminOnly, storyController.deleteStory);

module.exports = router;
