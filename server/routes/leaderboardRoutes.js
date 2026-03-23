const express = require("express")
const {
  getAllTimeLeaderboard,
  getWeeklyLeaderboard,
  getMonthlyLeaderboard,
  getMyRank,
} = require("../controllers/leaderboardController")
const protect = require("../middleware/auth")

const router = express.Router()

// my-rank MUST be before /:period to avoid being caught by the wildcard
router.get("/my-rank", protect, getMyRank)

router.get("/all-time", getAllTimeLeaderboard)
router.get("/weekly", getWeeklyLeaderboard)
router.get("/monthly", getMonthlyLeaderboard)

module.exports = router