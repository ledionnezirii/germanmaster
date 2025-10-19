const express = require("express");
const router = express.Router();
const practiceController = require("../controllers/practiceController");
const protect = require("../middleware/auth"); // Adjust path as needed
const isAdmin = require("../middleware/isAdmin");
// Public/User routes
router.get("/", protect, practiceController.getAllPractices);
router.get("/stats", protect, practiceController.getPracticeStats);
router.get("/progress", protect, practiceController.getUserProgress);
router.get("/user/finished", protect, practiceController.getFinishedPractices)
router.get("/:id", protect, practiceController.getPracticeById);
router.post("/:id/submit", protect, practiceController.submitPractice);

// Admin routes
router.post("/", protect, isAdmin, practiceController.createPractice);
router.post("/bulk", protect, isAdmin, practiceController.createBulkPractices);
router.put("/:id", protect, isAdmin, practiceController.updatePractice);
router.delete("/:id", protect, isAdmin, practiceController.deletePractice);

module.exports = router;
