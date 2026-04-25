const express = require("express")
const router = express.Router()
const protect = require("../middleware/auth")
const {
  updateUserXP,
  getUserAchievements,
  checkStreakAchievements,
  checkTestAchievements,
  getAchievementLeaderboard,
} = require("../controllers/achievementsController")

// Route to update user's XP and check for achievements
router.post("/users/:userId/xp", protect, updateUserXP)

// Route to get all achievements for a user (locked and unlocked)
router.get("/users/:userId/achievements", protect, getUserAchievements)

// Route to check and update streak-based achievements
router.post("/users/:userId/achievements/streak", protect, checkStreakAchievements)

// Route to check and update test-based achievements
router.post("/users/:userId/achievements/tests", protect, checkTestAchievements)

// Route to get achievement leaderboard
router.get("/achievements/leaderboard", getAchievementLeaderboard)

module.exports = router
