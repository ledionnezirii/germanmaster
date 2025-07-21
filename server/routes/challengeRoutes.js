const express = require("express")
const router = express.Router()
const Challenge = require("../models/Challenge")
const {
  getRandomQuestions,
  getCategories,
  getQuestionsByDifficulty,
  getQuestionStats,
} = require("../data/quizQuestions")
const { getRandomGermanWords } = require("../data/germanWords"); // NEW: Import for word race

// GET /api/challenge/challengeQuestions (can be adapted for word race if needed)
router.get("/challengeQuestions", (req, res) => {
  try {
    const count = Number.parseInt(req.query.count) || 10
    const category = req.query.category
    const difficulty = req.query.difficulty
    const gameType = req.query.gameType || "quiz"; // NEW: gameType parameter

    let questions;
    if (gameType === "wordRace") {
      questions = getRandomGermanWords(count);
      res.json({
        success: true,
        questions: questions.map((q) => ({
          id: q.id,
          word: q.word,
          translation: q.translation,
          category: q.category,
        })),
        gameType: "wordRace",
      });
    } else { // Existing quiz logic
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
        })),
        difficulty: difficulty || "random",
        category: category || null,
        gameType: "quiz",
      })
    }
  } catch (error) {
    console.error("Error fetching challenge questions/words:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching challenge questions/words",
      error: error.message,
    })
  }
})

// GET /api/challenge/challengeStats
router.get("/challengeStats", async (req, res) => {
  try {
    const stats = await Challenge.aggregate([
      { $match: { status: "completed" } }, // Match all completed challenges
      {
        $group: {
          _id: "$gameType", // Group by gameType
          totalChallenges: { $sum: 1 },
          totalPlayers: { $sum: { $size: "$users" } },
          avgScore: { $avg: { $avg: "$users.score" } }, // For quiz
          avgCorrectWords: { $avg: { $avg: "$users.correctWords" } }, // For wordRace
          avgXP: { $avg: { $avg: "$users.xp" } },
        },
      },
    ]);

    const questionStats = getQuestionStats(); // Assuming this is for quiz questions
    const result = {};
    stats.forEach(s => {
      result[s._id] = {
        totalChallenges: s.totalChallenges,
        totalPlayers: s.totalPlayers,
        avgScore: s.avgScore || 0,
        avgCorrectWords: s.avgCorrectWords || 0,
        avgXP: s.avgXP || 0,
      };
    });

    res.json({
      success: true,
      stats: {
        quiz: result.quiz || { totalChallenges: 0, totalPlayers: 0, avgScore: 0, avgXP: 0 },
        wordRace: result.wordRace || { totalChallenges: 0, totalPlayers: 0, avgCorrectWords: 0, avgXP: 0 },
        questionStats,
      },
    });
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
    const categories = getCategories() // Assuming this is for quiz categories
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
      status: "completed",
      "users.username": username,
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("users winner createdAt endTime questions difficulty category gameType") // NEW: Select gameType

    const userHistory = history.map((challenge) => {
      const user = challenge.users.find((u) => u.username === username)
      const opponent = challenge.users.find((u) => u.username !== username)
      return {
        id: challenge._id,
        date: challenge.createdAt,
        endDate: challenge.endTime,
        score: user?.score || 0, // For quiz
        wordsTyped: user?.wordsTyped || 0, // For wordRace
        correctWords: user?.correctWords || 0, // For wordRace
        totalQuestions: challenge.questions?.length || 0,
        xp: user?.xp || 0,
        isWinner: challenge.winner === username,
        opponent: opponent?.username || "Unknown",
        opponentScore: opponent?.score || 0, // For quiz
        opponentCorrectWords: opponent?.correctWords || 0, // For wordRace
        duration:
          challenge.endTime && challenge.createdAt
            ? Math.round((challenge.endTime - challenge.createdAt) / 1000)
            : null,
        difficulty: challenge.difficulty || "random",
        category: challenge.category || null,
        gameType: challenge.gameType, // Include gameType
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
      { $match: { status: "completed" } },
      { $unwind: "$users" },
      {
        $group: {
          _id: "$users.userId", // Group by userId to sum up stats across all games
          username: { $first: "$users.username" },
          totalXP: { $sum: "$users.xp" },
          totalChallenges: { $sum: 1 },
          totalWins: {
            $sum: {
              $cond: [{ $eq: ["$users.isWinner", true] }, 1, 0],
            },
          },
          totalQuizScore: { $sum: "$users.score" }, // Sum of quiz scores
          totalCorrectWords: { $sum: "$users.correctWords" }, // Sum of correct words in word race
        },
      },
      { $sort: { totalXP: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          username: 1,
          totalXP: 1,
          totalChallenges: 1,
          totalWins: 1,
          avgQuizScore: { $divide: ["$totalQuizScore", "$totalChallenges"] },
          avgCorrectWords: { $divide: ["$totalCorrectWords", "$totalChallenges"] },
        }
      }
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
    })
      .select("roomId users startTime timeLimit difficulty category gameType") // NEW: Select gameType
      .sort({ startTime: -1 })
    const roomsInfo = activeRooms.map((room) => ({
      roomId: room.roomId,
      players: room.users.map((u) => u.username),
      startTime: room.startTime,
      timeLimit: room.timeLimit,
      duration: Math.round((Date.now() - room.startTime) / 1000),
      difficulty: room.difficulty || "random",
      category: room.category || null,
      gameType: room.gameType, // Include gameType
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
    const { count = 5, category, difficulty, gameType = "quiz" } = req.body // NEW: gameType
    let questions;
    if (gameType === "wordRace") {
      questions = getRandomGermanWords(count);
      res.json({
        success: true,
        questions: questions.map((q) => ({
          id: q.id,
          word: q.word,
          translation: q.translation,
          category: q.category,
        })),
        message: "Practice words generated successfully",
        gameType: "wordRace",
      });
    } else { // Existing quiz logic
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
        })),
        message: "Practice questions generated successfully",
        difficulty: difficulty || "random",
        category: category || null,
        gameType: "quiz",
      })
    }
  } catch (error) {
    console.error("Error generating practice questions/words:", error)
    res.status(500).json({
      success: false,
      message: "Error generating practice questions/words",
      error: error.message,
    })
  }
})

module.exports = router
