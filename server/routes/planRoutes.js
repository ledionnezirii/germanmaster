const express = require("express")
const protect = require("../middleware/auth")
const adminAuth = require("../middleware/isAdmin")
const {
  createOrUpdatePlan,
  getPlanByLevel,
  getWeekByNumber,
  markTopicAsCompleted,
  getAllPlans,
  deletePlan,
  startWeek,
} = require("../controllers/planController")

const router = express.Router()

router.use(protect)

// Admin routes
router.route("/admin/all").get(adminAuth, getAllPlans)
router.route("/admin/:level").put(adminAuth, createOrUpdatePlan).delete(adminAuth, deletePlan)

// User routes
router.route("/:level").get(getPlanByLevel)
router.route("/:level/week/:weekNumber").get(getWeekByNumber)
router.route("/:level/week/:weekNumber/start").post(startWeek)
router.route("/:planId/topic/:topicId/complete").put(markTopicAsCompleted)

module.exports = router
