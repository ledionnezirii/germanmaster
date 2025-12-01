const express = require("express")
const protect = require("../middleware/auth")
const adminAuth = require("../middleware/isAdmin")
const {
  createOrUpdatePlan,
  getPlanByLevel,
  markTopicAsCompleted,
  getAllPlans,
  deletePlan,
} = require("../controllers/planController")

const router = express.Router()

router.use(protect)

router.route("/admin/all").get(adminAuth, getAllPlans)
router.route("/admin/:level").put(adminAuth, createOrUpdatePlan).delete(adminAuth, deletePlan)

router.route("/:level").get(getPlanByLevel)
router.route("/:planId/topic/:topicId/complete").put(markTopicAsCompleted)

module.exports = router
