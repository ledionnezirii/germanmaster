const express = require("express")
const router = express.Router()
const Challenge = require("../models/Challenge")
const {
  getRandomQuestions,
  getCategories,
  getQuestionsByDifficulty,
  getQuestionStats,
} = require("../data/quizQuestions")

// GET /api/challenge/challengeQuestions
router.get("/challengeQuestions", (req, res) => {
  try {
    const count = Number.parseInt(req.query.count) || 10
    const category = req.query.category
    const difficulty = req.query.difficulty

    let questions
    if (difficulty && difficulty !== "random") {
      questions = getQuestionsByDifficulty(difficulty, count)
    } else if (category) {
      questions = getRandomQuestions(count, category)
    } else {
      questions = getRandomQuestions(count)
    }

    res.json({
      success: true,
      questions: questions.map((q) => ({
        id: q.id,
        question: q.question,
        options: q.options,
        category: q.category,
        // Don't send correct answer to client
      })),
      difficulty: difficulty || "random",
      category: category || null,
    })
  } catch (error) {
    console.error("Error fetching challenge questions:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching challenge questions",
      error: error.message,
    })
  }
})

// GET /api/challenge/challengeStats
router.get("/challengeStats", async (req, res) => {
  try {
    const stats = await Challenge.aggregate([
      { $match: { gameType: "quiz", status: "completed" } },
      {
        $group: {
          _id: null,
          totalChallenges: { $sum: 1 },
          totalPlayers: { $sum: { $size: "$users" } },
          avgScore: { $avg: { $avg: "$users.score" } },
          avgXP: { $avg: { $avg: "$users.xp" } },
        },
      },
    ])

    const questionStats = getQuestionStats()

    const result = stats[0] || {
      totalChallenges: 0,
      totalPlayers: 0,
      avgScore: 0,
      avgXP: 0,
    }

    res.json({
      success: true,
      stats: {
        ...result,
        questionStats,
      },
    })
  } catch (error) {
    console.error("Error fetching challenge statistics:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching challenge statistics",
      error: error.message,
    })
  }
})

// GET /api/challenge/categories - Get available question categories
router.get("/categories", (req, res) => {
  try {
    const categories = getCategories()

    res.json({
      success: true,
      categories,
      count: categories.length,
    })
  } catch (error) {
    console.error("Error fetching challenge categories:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching challenge categories",
      error: error.message,
    })
  }
})

// GET /api/challenge/difficulties - Get available difficulty levels
router.get("/difficulties", (req, res) => {
  try {
    const difficulties = [
      {
        level: "easy",
        name: "Easy",
        description: "Basic greetings, numbers, and colors",
        xpMultiplier: 1,
        categories: ["Greetings", "Numbers", "Colors"],
      },
      {
        level: "medium",
        name: "Medium",
        description: "Food, drinks, and common expressions",
        xpMultiplier: 1.5,
        categories: ["Food & Drink", "Politeness", "Expressions"],
      },
      {
        level: "hard",
        name: "Hard",
        description: "Grammar rules and complex structures",
        xpMultiplier: 2,
        categories: ["Grammar"],
      },
    ]

    res.json({
      success: true,
      difficulties,
    })
  } catch (error) {
    console.error("Error fetching difficulties:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching difficulties",
      error: error.message,
    })
  }
})

// GET /api/challenge/challengeHistory/:username
router.get("/challengeHistory/:username", async (req, res) => {
  try {
    const { username } = req.params
    const limit = Number.parseInt(req.query.limit) || 10

    const history = await Challenge.find({
      gameType: "quiz",
      status: "completed",
      "users.username": username,
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("users winner createdAt endTime questions difficulty category")

    const userHistory = history.map((challenge) => {
      const user = challenge.users.find((u) => u.username === username)
      const opponent = challenge.users.find((u) => u.username !== username)

      return {
        id: challenge._id,
        date: challenge.createdAt,
        endDate: challenge.endTime,
        score: user?.score || 0,
        totalQuestions: challenge.questions?.length || 0,
        xp: user?.xp || 0,
        isWinner: challenge.winner === username,
        opponent: opponent?.username || "Unknown",
        opponentScore: opponent?.score || 0,
        duration:
          challenge.endTime && challenge.createdAt
            ? Math.round((challenge.endTime - challenge.createdAt) / 1000)
            : null,
        difficulty: challenge.difficulty || "random",
        category: challenge.category || null,
      }
    })

    res.json({
      success: true,
      history: userHistory,
    })
  } catch (error) {
    console.error("Error fetching user challenge history:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching user challenge history",
      error: error.message,
    })
  }
})

// GET /api/challenge/challengeLeaderboard
router.get("/challengeLeaderboard", async (req, res) => {
  try {
    const limit = Number.parseInt(req.query.limit) || 10

    const leaderboard = await Challenge.aggregate([
      { $match: { gameType: "quiz", status: "completed" } },
      { $unwind: "$users" },
      {
        $group: {
          _id: "$users.username",
          totalXP: { $sum: "$users.xp" },
          totalChallenges: { $sum: 1 },
          totalWins: {
            $sum: {
              $cond: [{ $eq: ["$users.isWinner", true] }, 1, 0],
            },
          },
          avgScore: { $avg: "$users.score" },
        },
      },
      { $sort: { totalXP: -1 } },
      { $limit: limit },
    ])

    res.json({
      success: true,
      leaderboard,
    })
  } catch (error) {
    console.error("Error fetching challenge leaderboard:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching challenge leaderboard",
      error: error.message,
    })
  }
})

// GET /api/challenge/activeRooms - Get current active challenge rooms
router.get("/activeRooms", async (req, res) => {
  try {
    const activeRooms = await Challenge.find({
      status: "active",
      gameType: "quiz",
    })
      .select("roomId users startTime timeLimit difficulty category")
      .sort({ startTime: -1 })

    const roomsInfo = activeRooms.map((room) => ({
      roomId: room.roomId,
      players: room.users.map((u) => u.username),
      startTime: room.startTime,
      timeLimit: room.timeLimit,
      duration: Math.round((Date.now() - room.startTime) / 1000),
      difficulty: room.difficulty || "random",
      category: room.category || null,
    }))

    res.json({
      success: true,
      activeRooms: roomsInfo,
      count: roomsInfo.length,
    })
  } catch (error) {
    console.error("Error fetching active challenge rooms:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching active challenge rooms",
      error: error.message,
    })
  }
})

// POST /api/challenge/practice - Get practice questions (single player)
router.post("/practice", (req, res) => {
  try {
    const { count = 5, category, difficulty } = req.body

    let questions
    if (difficulty && difficulty !== "random") {
      questions = getQuestionsByDifficulty(difficulty, count)
    } else if (category) {
      questions = getRandomQuestions(count, category)
    } else {
      questions = getRandomQuestions(count)
    }

    res.json({
      success: true,
      questions: questions.map((q) => ({
        id: q.id,
        question: q.question,
        options: q.options,
        category: q.category,
        // Don't send correct answer to client
      })),
      message: "Practice questions generated successfully",
      difficulty: difficulty || "random",
      category: category || null,
    })
  } catch (error) {
    console.error("Error generating practice questions:", error)
    res.status(500).json({
      success: false,
      message: "Error generating practice questions",
      error: error.message,
    })
  }
})

module.exports = router
