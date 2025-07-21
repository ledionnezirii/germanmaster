// No changes here. This file remains separate for backend routes.
const express = require("express")
const {
  getAllTimeLeaderboard,
  getWeeklyLeaderboard,
  getMonthlyLeaderboard,
} = require("../controllers/leaderboardController")

const router = express.Router()

router.get("/all-time", getAllTimeLeaderboard)
router.get("/weekly", getWeeklyLeaderboard)
router.get("/monthly", getMonthlyLeaderboard)

module.exports = router
