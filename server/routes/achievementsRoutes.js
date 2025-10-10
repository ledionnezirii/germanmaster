const express = require("express")
const router = express.Router()
const {
  updateUserXP,
  getUserAchievements,
  checkStreakAchievements,
  checkTestAchievements,
  getAchievementLeaderboard,
} = require("../controllers/achievementsController")

// Route to update user's XP and check for achievements
router.post("/users/:userId/xp", updateUserXP)

// Route to get all achievements for a user (locked and unlocked)
router.get("/users/:userId/achievements", getUserAchievements)

// Route to check and update streak-based achievements
router.post("/users/:userId/achievements/streak", checkStreakAchievements)

// Route to check and update test-based achievements
router.post("/users/:userId/achievements/tests", checkTestAchievements)

// Route to get achievement leaderboard
router.get("/achievements/leaderboard", getAchievementLeaderboard)

module.exports = router
