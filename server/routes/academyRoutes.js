const express = require("express")
const router = express.Router()
const {
  createAcademy,
  getMyAcademies,
  getAcademy,
  createGroup,
  inviteToGroup,
  acceptInvitation,
  createTask,
  completeTask,
  getGroupLeaderboard,
  deleteGroup,
  getGroupInviteInfo, // Added new controller function for invite info
} = require("../controllers/academyController")

// Middleware to protect routes (you should have this in your app)
const protect = require("../middleware/auth") // Adjust path as needed

// Academy routes
router.post("/", protect, createAcademy)
router.get("/", protect, getMyAcademies)
router.get("/:academyId", protect, getAcademy)

// Group routes
router.post("/:academyId/groups", protect, createGroup)
router.post("/:academyId/groups/:groupId/invite", protect, inviteToGroup)
router.post("/:academyId/groups/:groupId/accept", protect, acceptInvitation)
router.delete("/:academyId/groups/:groupId", protect, deleteGroup)
router.get("/:academyId/groups/:groupId/invite-info", getGroupInviteInfo)

// Task routes
router.post("/:academyId/groups/:groupId/tasks", protect, createTask)
router.post("/:academyId/groups/:groupId/tasks/:taskId/complete", protect, completeTask)

// Leaderboard
router.get("/:academyId/groups/:groupId/leaderboard", protect, getGroupLeaderboard)

module.exports = router
