const express = require("express");
const router = express.Router();
const activityController = require("../controllers/activityController");
const  protect  = require("../middleware/auth");

// All routes require authentication
router.use(protect);

// Session management
router.post("/start-session", activityController.startSession);
router.post("/end-session", activityController.endSession);

// Time tracking (heartbeat approach)
router.post("/add-time", activityController.addTime);

// Get activity data
router.get("/heatmap", activityController.getActivityHeatmap);
router.get("/today", activityController.getTodayActivity);
router.get("/stats", activityController.getActivityStats);

module.exports = router;