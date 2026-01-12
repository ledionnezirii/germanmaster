const express = require("express");
const router = express.Router();
const activityController = require("../controllers/activityController");
const  protect  = require("../middleware/auth");

// All routes require authentication
router.use(protect);

// Time tracking (simple approach - just add time)
router.post("/add-time", activityController.addLearningTime);

// Get activity data
router.get("/heatmap", activityController.getActivityHeatmap);
router.get("/today", activityController.getTodayActivity);
router.get("/stats", activityController.getActivityStats);

module.exports = router