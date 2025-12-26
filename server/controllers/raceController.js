const Race = require("../models/Race")
const RaceQuestion = require("../models/RaceQuestion")
const User = require("../models/User")

// Create a new race room
const createRoom = async (req, res) => {
  try {
    const { roomName, level, maxPlayers, questionsCount, gameMode } = req.body

    // Generate a unique 6-character room code
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase()

    const room = await Race.create({
      roomId,
      roomName,
      hostId: req.user._id,
      level,
      maxPlayers: maxPlayers || 10,
      questionsCount: questionsCount || 10,
      gameMode: gameMode || "multiplayer",
      status: "waiting",
      players: [
        {
          userId: req.user._id,
          username: req.user.emri || req.user.firstName || req.user.username,
          score: 0,
          correctAnswers: 0,
          isReady: false,
          answers: [],
        },
      ],
    })

    // Fetch random questions based on level
    const questions = await RaceQuestion.aggregate([{ $match: { level } }, { $sample: { size: questionsCount || 10 } }])

    room.questions = questions.map((q) => q._id)
    await room.save()

    res.status(201).json({
      success: true,
      data: room,
    })
  } catch (error) {
    console.error("Create room error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to create room",
      error: error.message,
    })
  }
}

// Get available rooms
const getAvailableRooms = async (req, res) => {
  try {
    const { level } = req.query

    const query = {
      status: { $in: ["waiting", "starting"] },
    }

    if (level) {
      query.level = level
    }

    const rooms = await Race.find(query)
      .populate("hostId", "emri firstName username")
      .populate("players.userId", "emri firstName username")
      .sort({ createdAt: -1 })
      .limit(20)

    res.json({
      success: true,
      data: rooms,
    })
  } catch (error) {
    console.error("Get available rooms error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch rooms",
      error: error.message,
    })
  }
}

// Get room details by MongoDB _id
const getRoomDetails = async (req, res) => {
  try {
    const { roomId } = req.params

    const room = await Race.findById(roomId)
      .populate("hostId", "emri firstName username")
      .populate("players.userId", "emri firstName username")
      .populate("questions")

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      })
    }

    res.json({
      success: true,
      data: room,
    })
  } catch (error) {
    console.error("Get room details error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch room details",
      error: error.message,
    })
  }
}

const getRoomByCode = async (req, res) => {
  try {
    const { roomCode } = req.params

    console.log("[v0] Looking for room with code:", roomCode)

    const room = await Race.findOne({ roomId: roomCode })
      .populate("hostId", "emri firstName username")
      .populate("players.userId", "emri firstName username")
      .populate("questions")

    if (!room) {
      console.log("[v0] Room not found for code:", roomCode)
      return res.status(404).json({
        success: false,
        message: "Room not found with this code",
      })
    }

    console.log("[v0] Room found:", room.roomName, "Status:", room.status)

    res.json({
      success: true,
      data: room,
    })
  } catch (error) {
    console.error("[v0] Get room by code error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch room by code",
      error: error.message,
    })
  }
}

// Join a room
const joinRoom = async (req, res) => {
  try {
    const { roomId } = req.params

    const room = await Race.findById(roomId)

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      })
    }

    if (room.status !== "waiting") {
      return res.status(400).json({
        success: false,
        message: "Room is not accepting new players",
      })
    }

    if (room.players.length >= room.maxPlayers) {
      return res.status(400).json({
        success: false,
        message: "Room is full",
      })
    }

    const alreadyJoined = room.players.some((p) => p.userId.toString() === req.user._id.toString())

    if (alreadyJoined) {
      return res.status(400).json({
        success: false,
        message: "You have already joined this room",
      })
    }

    room.players.push({
      userId: req.user._id,
      username: req.user.emri || req.user.firstName || req.user.username,
      score: 0,
      correctAnswers: 0,
      isReady: false,
      answers: [],
    })

    await room.save()

    const populatedRoom = await Race.findById(roomId)
      .populate("hostId", "emri firstName username")
      .populate("players.userId", "emri firstName username")
      .populate("questions")

    res.json({
      success: true,
      data: populatedRoom,
    })
  } catch (error) {
    console.error("Join room error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to join room",
      error: error.message,
    })
  }
}

// Leave a room
const leaveRoom = async (req, res) => {
  try {
    const { roomId } = req.params

    const room = await Race.findById(roomId)

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      })
    }

    room.players = room.players.filter((p) => p.userId.toString() !== req.user._id.toString())

    if (room.players.length === 0) {
      await Race.findByIdAndDelete(roomId)
      return res.json({
        success: true,
        message: "Room deleted as no players remain",
      })
    }

    await room.save()

    res.json({
      success: true,
      data: room,
    })
  } catch (error) {
    console.error("Leave room error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to leave room",
      error: error.message,
    })
  }
}

// Create a question
const createQuestion = async (req, res) => {
  try {
    const { question, options, correctAnswer, level, category, type } = req.body

    const newQuestion = await RaceQuestion.create({
      question,
      options,
      correctAnswer,
      level,
      category,
      type: type || "multiple-choice",
    })

    res.status(201).json({
      success: true,
      data: newQuestion,
    })
  } catch (error) {
    console.error("Create question error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to create question",
      error: error.message,
    })
  }
}

// Bulk create questions
const bulkCreateQuestions = async (req, res) => {
  try {
    const { questions } = req.body

    const createdQuestions = await RaceQuestion.insertMany(questions)

    res.status(201).json({
      success: true,
      data: createdQuestions,
      count: createdQuestions.length,
    })
  } catch (error) {
    console.error("Bulk create questions error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to create questions",
      error: error.message,
    })
  }
}

// Get questions
const getQuestions = async (req, res) => {
  try {
    const { level, category, limit = 50 } = req.query

    const query = {}
    if (level) query.level = level
    if (category) query.category = category

    const questions = await RaceQuestion.find(query).limit(Number.parseInt(limit))

    res.json({
      success: true,
      data: questions,
      count: questions.length,
    })
  } catch (error) {
    console.error("Get questions error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch questions",
      error: error.message,
    })
  }
}

// Update question
const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body

    const question = await RaceQuestion.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    })

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      })
    }

    res.json({
      success: true,
      data: question,
    })
  } catch (error) {
    console.error("Update question error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update question",
      error: error.message,
    })
  }
}

// Delete question
const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params

    const question = await RaceQuestion.findByIdAndDelete(id)

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      })
    }

    res.json({
      success: true,
      message: "Question deleted successfully",
    })
  } catch (error) {
    console.error("Delete question error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to delete question",
      error: error.message,
    })
  }
}

// Socket handler: Join race
const handleJoinRace = async (socket, io, data) => {
  try {
    const { roomId, userId, username } = data

    console.log("[v0] Handling join race:", { roomId, userId, username })

    const room = await Race.findById(roomId)
      .populate("hostId", "emri firstName username")
      .populate("players.userId", "emri firstName username")

    if (!room) {
      socket.emit("raceError", { message: "Room not found" })
      return
    }

    socket.join(roomId)
    console.log("[v0] User joined socket room:", roomId)

    io.to(roomId).emit("playerJoined", {
      userId,
      username,
      room,
    })
  } catch (error) {
    console.error("[v0] Join race error:", error)
    socket.emit("raceError", { message: "Failed to join race" })
  }
}

// Socket handler: Player ready
const handlePlayerReady = async (socket, io, data) => {
  try {
    const { roomId, userId } = data

    const room = await Race.findById(roomId)

    if (!room) {
      socket.emit("raceError", { message: "Room not found" })
      return
    }

    const player = room.players.find((p) => p.userId.toString() === userId)
    if (player) {
      player.isReady = true
      await room.save()
    }

    io.to(roomId).emit("playerReady", {
      userId,
      playersReady: room.players.filter((p) => p.isReady).length,
      totalPlayers: room.players.length,
    })

    const allReady = room.players.every((p) => p.isReady)
    if (allReady && room.players.length > 1) {
      room.status = "starting"
      await room.save()

      io.to(roomId).emit("gameStarting", {
        countdown: 3,
      })

      setTimeout(async () => {
        room.status = "in-progress"
        room.startedAt = new Date()
        await room.save()

        const populatedRoom = await Race.findById(roomId).populate("questions")

        io.to(roomId).emit("gameStarted", {
          questions: populatedRoom.questions,
        })
      }, 3000)
    }
  } catch (error) {
    console.error("Player ready error:", error)
    socket.emit("raceError", { message: "Failed to set player ready" })
  }
}

// Socket handler: Submit answer
const handleSubmitRaceAnswer = async (socket, io, data) => {
  try {
    const { roomId, userId, questionIndex, answer, timeSpent } = data

    const room = await Race.findById(roomId).populate("questions")

    if (!room) {
      socket.emit("raceError", { message: "Room not found" })
      return
    }

    const player = room.players.find((p) => p.userId.toString() === userId)
    const question = room.questions[questionIndex]

    if (player && question) {
      const isCorrect = answer === question.correctAnswer

      player.answers.push({
        questionIndex,
        answer,
        isCorrect,
        timeSpent,
      })

      if (isCorrect) {
        player.correctAnswers += 1
        const timeBonus = Math.max(0, 1000 - timeSpent)
        player.score += 100 + timeBonus
      }

      await room.save()

      io.to(roomId).emit("answerSubmitted", {
        userId,
        questionIndex,
        isCorrect,
        score: player.score,
        leaderboard: room.players.map((p) => ({
          userId: p.userId,
          username: p.username,
          score: p.score,
          correctAnswers: p.correctAnswers,
        })),
      })

      const allAnswered = room.players.every((p) => p.answers.length > questionIndex)

      if (allAnswered) {
        if (questionIndex + 1 >= room.questions.length) {
          room.status = "finished"
          room.finishedAt = new Date()
          await room.save()

          io.to(roomId).emit("gameFinished", {
            leaderboard: room.players
              .map((p) => ({
                userId: p.userId,
                username: p.username,
                score: p.score,
                correctAnswers: p.correctAnswers,
              }))
              .sort((a, b) => b.score - a.score),
          })
        } else {
          io.to(roomId).emit("nextQuestion", {
            questionIndex: questionIndex + 1,
          })
        }
      }
    }
  } catch (error) {
    console.error("Submit answer error:", error)
    socket.emit("raceError", { message: "Failed to submit answer" })
  }
}

// Socket handler: Leave race
const handleLeaveRace = async (socket, io, data) => {
  try {
    const { roomId, userId } = data

    const room = await Race.findById(roomId)

    if (!room) {
      return
    }

    room.players = room.players.filter((p) => p.userId.toString() !== userId)

    if (room.players.length === 0) {
      await Race.findByIdAndDelete(roomId)
      console.log("[v0] Room deleted:", roomId)
    } else {
      await room.save()
    }

    socket.leave(roomId)
    io.to(roomId).emit("playerLeft", { userId })
  } catch (error) {
    console.error("Leave race error:", error)
  }
}

module.exports = {
  createRoom,
  getAvailableRooms,
  getRoomDetails,
  getRoomByCode, // Export the new function
  joinRoom,
  leaveRoom,
  createQuestion,
  bulkCreateQuestions,
  getQuestions,
  updateQuestion,
  deleteQuestion,
  handleJoinRace,
  handlePlayerReady,
  handleSubmitRaceAnswer,
  handleLeaveRace,
}
