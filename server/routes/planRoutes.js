const express = require("express")
const  protect  = require("../middleware/auth")
const { createPlan, getPlanByLevel, markTopicAsCompleted } = require("../controllers/planController")

const router = express.Router()

console.log("planRoutes.js loaded. Applying protect middleware.")
router.use(protect)

router.route("/").post(createPlan)
router.route("/:level").get(getPlanByLevel)
// Reverted to :planId for markTopicAsCompleted
router.route("/:planId/topic/:topicId/complete").put(markTopicAsCompleted)

module.exports = router
