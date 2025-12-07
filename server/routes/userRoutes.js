const express = require("express")
const router = express.Router()
const {
  getProfile,
  getUserXp,
  updateStudyHours,
  updateAvatarStyle,
  updateProfile,
  addXp,
  updateStreak,
} = require("../controllers/userController")
const protect = require("../middleware/auth")
const { checkSubscription } = require("../middleware/checkSubscription")

// Apply subscription check to all routes that require active subscription
router.get("/profile", protect, checkSubscription, getProfile)
router.get("/xp", protect, checkSubscription, getUserXp)
router.put("/study-hours", protect, checkSubscription, updateStudyHours)
router.put("/avatar-style", protect, updateAvatarStyle) // No subscription check for avatar
router.put("/profile", protect, updateProfile) // No subscription check for profile update
router.post("/add-xp", protect, checkSubscription, addXp)
router.post("/update-streak", protect, checkSubscription, updateStreak)

module.exports = router