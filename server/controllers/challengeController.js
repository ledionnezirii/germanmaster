const Challenge = require("../models/Challenge")
const User = require("../models/User")
const { getRandomQuestions, getQuestionsByDifficulty } = require("../data/quizQuestions")

// In-memory storage for active games
const waitingPlayers = new Map()
const activeRooms = new Map()

const handleJoinChallenge = async (socket, io, data, activeChallenges) => {
  try {
    const { username, difficulty = "random", category = null } = data
    const userId = socket.userId || data.userId

    console.log(`Player ${username} (${userId}) wants to join challenge with difficulty: ${difficulty}`)

    if (!userId) {
      console.error("No userId found for user:", username)
      socket.emit("error", { message: "User ID not found. Please reconnect." })
      return
    }

    // Remove player from waiting list if they were already waiting
    for (const [socketId, playerData] of waitingPlayers.entries()) {
      if (playerData.userId === userId || playerData.username === username) {
        waitingPlayers.delete(socketId)
        console.log(`Removed ${username} from previous waiting position`)
        break
      }
    }

    // Check if there are other waiting players (excluding current user)
    let opponent = null
    for (const [socketId, playerData] of waitingPlayers.entries()) {
      if (playerData.userId !== userId && playerData.username !== username) {
        opponent = { socketId, ...playerData }
        waitingPlayers.delete(socketId)
        break
      }
    }

    if (opponent) {
      // Found an opponent - start the game
      const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      console.log(`Starting game between ${username} and ${opponent.username}`)

      // Get questions based on difficulty/category
      let selectedQuestions
      try {
        if (difficulty && difficulty !== "random") {
          selectedQuestions = getQuestionsByDifficulty(difficulty, 10)
        } else if (category) {
          selectedQuestions = getRandomQuestions(10, category)
        } else {
          selectedQuestions = getRandomQuestions(10)
        }

        console.log(`Selected ${selectedQuestions.length} questions for the challenge (${difficulty || "random"})`)
      } catch (error) {
        console.error("Error selecting questions:", error)
        socket.emit("error", { message: "Error loading questions. Please try again." })
        return
      }

      // Create challenge record
      try {
        const challenge = new Challenge({
          roomId,
          users: [
            {
              username,
              userId,
              socketId: socket.id,
              score: 0,
              xp: 0,
              answers: [],
              finished: false,
            },
            {
              username: opponent.username,
              userId: opponent.userId,
              socketId: opponent.socketId,
              score: 0,
              xp: 0,
              answers: [],
              finished: false,
            },
          ],
          questions: selectedQuestions,
          status: "active",
          timeLimit: 300,
          startTime: new Date(),
          difficulty: difficulty || "random",
          category: category || null,
        })

        await challenge.save()
        activeRooms.set(roomId, challenge)

        console.log(`Challenge created with ID: ${challenge._id}`)

        // Join both players to the room
        socket.join(roomId)
        const opponentSocket = io.sockets.sockets.get(opponent.socketId)
        if (opponentSocket) {
          opponentSocket.join(roomId)
        } else {
          console.warn(`Opponent socket ${opponent.socketId} not found`)
        }

        // Notify both players
        io.to(roomId).emit("quizStart", {
          roomId,
          message: `Quiz mes ${username} dhe ${opponent.username} ka nisur!`,
          users: [
            { username, userId },
            { username: opponent.username, userId: opponent.userId },
          ],
          questions: selectedQuestions.map((q) => ({
            id: q.id,
            question: q.question,
            options: q.options,
            category: q.category,
          })),
          timeLimit: 300,
          startTime: challenge.startTime,
          difficulty: difficulty || "random",
          category: category || null,
        })

        console.log(`Game started successfully in room ${roomId}`)
      } catch (dbError) {
        console.error("Database error creating challenge:", dbError)
        socket.emit("error", { message: "Error creating challenge. Please try again." })
        return
      }
    } else {
      // No opponent found - add to waiting list
      waitingPlayers.set(socket.id, {
        username,
        userId,
        socketId: socket.id,
        joinedAt: Date.now(),
        difficulty: difficulty || "random",
        category: category || null,
      })

      console.log(`${username} added to waiting list. Total waiting: ${waitingPlayers.size}`)

      socket.emit("waitingForOpponent", {
        message: `Duke pritur për një kundërshtar... (${waitingPlayers.size} lojtar në pritje)`,
        roomId: null,
        waitingCount: waitingPlayers.size,
        difficulty: difficulty || "random",
        category: category || null,
      })

      // Notify all waiting players about the count
      for (const [socketId, playerData] of waitingPlayers.entries()) {
        io.to(socketId).emit("waitingUpdate", {
          waitingCount: waitingPlayers.size,
          message: `Duke pritur për një kundërshtar... (${waitingPlayers.size} lojtar në pritje)`,
        })
      }
    }
  } catch (error) {
    console.error("Error in handleJoinChallenge:", error)
    console.error("Error stack:", error.stack)
    socket.emit("error", { message: "Gabim në lidhjen e sfidës" })
  }
}

const handleQuizAnswer = async (socket, io, data, activeChallenges) => {
  try {
    const { roomId, questionId, answer, timeSpent } = data
    const challenge = activeRooms.get(roomId)

    if (!challenge) {
      socket.emit("error", { message: "Dhoma nuk u gjet" })
      return
    }

    // Find the user in the challenge
    const userIndex = challenge.users.findIndex((u) => u.socketId === socket.id)
    if (userIndex === -1) {
      socket.emit("error", { message: "Përdoruesi nuk u gjet në sfidë" })
      return
    }

    const user = challenge.users[userIndex]

    // Check if question exists and user hasn't already answered it
    const question = challenge.questions.find((q) => q.id === questionId)
    if (!question) {
      socket.emit("error", { message: "Pyetja nuk u gjet" })
      return
    }

    const alreadyAnswered = user.answers.find((a) => a.questionId === questionId)
    if (alreadyAnswered) {
      socket.emit("error", { message: "Keni përgjigjur tashmë për këtë pyetje" })
      return
    }

    // Record the answer
    const isCorrect = question.correctAnswer === answer
    user.answers.push({
      questionId,
      answer,
      isCorrect,
      timeSpent: timeSpent || 0,
      timestamp: Date.now(),
    })

    // Update score if correct
    if (isCorrect) {
      user.score++
    }

    console.log(`${user.username} answered question ${questionId}: ${answer} (${isCorrect ? "correct" : "incorrect"})`)

    // Check if this user has answered all questions
    const totalQuestions = challenge.questions.length

    if (user.answers.length === totalQuestions) {
      // User finished all questions
      user.finished = true
      user.finishTime = Date.now()

      // Calculate XP (10 XP per correct answer + time bonus + difficulty bonus)
      const baseXP = user.score * 10
      const perfectScoreBonus = user.score === totalQuestions ? 50 : 0
      const timeBonus = Math.max(0, 30 - Math.floor((user.finishTime - challenge.startTime) / 1000 / 10))

      // Difficulty bonus
      let difficultyBonus = 0
      if (challenge.difficulty === "medium") difficultyBonus = 20
      if (challenge.difficulty === "hard") difficultyBonus = 50

      const xpEarned = baseXP + perfectScoreBonus + timeBonus + difficultyBonus

      user.xp = xpEarned

      console.log(`${user.username} finished with score: ${user.score}/${totalQuestions}, XP: ${xpEarned}`)

      // Notify room about player finishing
      io.to(roomId).emit("playerFinished", {
        username: user.username,
        score: user.score,
        xp: xpEarned,
        totalQuestions,
        time: Math.round((user.finishTime - challenge.startTime) / 1000),
      })

      // Update user's XP in database
      try {
        await User.findByIdAndUpdate(user.userId, {
          $inc: {
            totalXP: xpEarned,
            "quizStats.totalQuizzes": 1,
            "quizStats.correctAnswers": user.score,
          },
        })
      } catch (dbError) {
        console.error("Error updating user XP:", dbError)
      }
    }

    // Check if all players have finished
    const allFinished = challenge.users.every((u) => u.finished)

    if (allFinished) {
      // End the quiz
      const sortedUsers = challenge.users.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score // Higher score first
        return a.finishTime - b.finishTime // Faster time first if same score
      })

      // Determine winner
      let winner = null
      if (sortedUsers.length > 1 && sortedUsers[0].score > sortedUsers[1].score) {
        sortedUsers[0].isWinner = true
        winner = sortedUsers[0].username

        // Update winner's stats
        try {
          await User.findByIdAndUpdate(sortedUsers[0].userId, {
            $inc: { "quizStats.wins": 1 },
          })
        } catch (dbError) {
          console.error("Error updating winner stats:", dbError)
        }
      }

      // Update challenge status
      challenge.status = "completed"
      challenge.winner = winner
      challenge.endTime = new Date()

      console.log(`Challenge completed. Winner: ${winner || "Tie"}`)

      // Send final results
      io.to(roomId).emit("quizResult", {
        message: winner ? `🎉 ${winner} fitoi quiz-in!` : "🤝 Barazim!",
        users: sortedUsers.map((u) => ({
          username: u.username,
          score: u.score,
          xp: u.xp,
          isWinner: u.isWinner || false,
          finishTime: u.finishTime,
        })),
        winner,
        roomId,
        difficulty: challenge.difficulty,
        category: challenge.category,
      })

      // Clean up
      activeRooms.delete(roomId)

      // Save final challenge state
      try {
        await Challenge.findOneAndUpdate(
          { roomId },
          {
            status: "completed",
            winner,
            endTime: challenge.endTime,
            users: challenge.users,
          },
        )
      } catch (dbError) {
        console.error("Error saving challenge results:", dbError)
      }
    }
  } catch (error) {
    console.error("Error handling quiz answer:", error)
    socket.emit("error", { message: "Gabim në përpunimin e përgjigjes" })
  }
}

// Handle user leaving challenge with XP reward for remaining player
const handleLeaveChallenge = async (socket, io) => {
  console.log(`Player ${socket.id} (${socket.username}) wants to leave challenge`)

  // Remove from waiting players
  const waitingPlayer = waitingPlayers.get(socket.id)
  if (waitingPlayer) {
    waitingPlayers.delete(socket.id)
    console.log(`Removed ${waitingPlayer.username} from waiting list`)

    // Update waiting count for remaining players
    for (const [socketId, playerData] of waitingPlayers.entries()) {
      io.to(socketId).emit("waitingUpdate", {
        waitingCount: waitingPlayers.size,
        message: `Duke pritur për një kundërshtar... (${waitingPlayers.size} lojtar në pritje)`,
      })
    }

    // Notify user they left successfully
    socket.emit("leftChallenge", {
      message: "Keni dalë nga pritja për kundërshtar",
    })
    return
  }

  // Handle active games
  for (const [roomId, challenge] of activeRooms.entries()) {
    const userIndex = challenge.users.findIndex((u) => u.socketId === socket.id)
    if (userIndex !== -1) {
      const leavingUser = challenge.users[userIndex]
      const remainingUser = challenge.users.find((u) => u.socketId !== socket.id)

      console.log(`${leavingUser.username} left active challenge ${roomId}`)

      if (remainingUser) {
        // Calculate XP reward for remaining player (winner by default)
        const winnerXP = 75 // Base XP for winning by opponent leaving
        const difficultyBonus = challenge.difficulty === "medium" ? 20 : challenge.difficulty === "hard" ? 50 : 0
        const totalWinnerXP = winnerXP + difficultyBonus

        console.log(`Awarding ${totalWinnerXP} XP to ${remainingUser.username} for opponent leaving`)

        // Update remaining user's XP in database
        try {
          await User.findByIdAndUpdate(remainingUser.userId, {
            $inc: {
              totalXP: totalWinnerXP,
              "quizStats.wins": 1,
            },
          })
        } catch (dbError) {
          console.error("Error updating winner XP:", dbError)
        }

        // Notify remaining player with XP reward
        socket.to(roomId).emit("opponentLeft", {
          message: `${leavingUser.username} doli nga loja`,
          roomId,
          reason: "left",
          winnerXp: totalWinnerXP,
        })
      }

      // Notify the leaving user
      socket.emit("leftChallenge", {
        message: "Keni dalë nga challenge-i",
      })

      // Clean up the room
      activeRooms.delete(roomId)

      // Update challenge status in database
      Challenge.findOneAndUpdate(
        { roomId },
        {
          status: "abandoned",
          endTime: new Date(),
          winner: remainingUser ? remainingUser.username : null,
        },
      ).catch((err) => console.error("Error updating abandoned challenge:", err))

      break
    }
  }
}

const handleDisconnect = async (socket, io) => {
  console.log(`Player disconnected: ${socket.id} (${socket.username})`)

  // Remove from waiting players
  const waitingPlayer = waitingPlayers.get(socket.id)
  if (waitingPlayer) {
    waitingPlayers.delete(socket.id)
    console.log(`Removed ${waitingPlayer.username} from waiting list`)

    // Update waiting count for remaining players
    for (const [socketId, playerData] of waitingPlayers.entries()) {
      io.to(socketId).emit("waitingUpdate", {
        waitingCount: waitingPlayers.size,
        message: `Duke pritur për një kundërshtar... (${waitingPlayers.size} lojtar në pritje)`,
      })
    }
  }

  // Handle active games
  for (const [roomId, challenge] of activeRooms.entries()) {
    const userIndex = challenge.users.findIndex((u) => u.socketId === socket.id)
    if (userIndex !== -1) {
      const disconnectedUser = challenge.users[userIndex]
      const remainingUser = challenge.users.find((u) => u.socketId !== socket.id)

      console.log(`${disconnectedUser.username} disconnected from active challenge ${roomId}`)

      if (remainingUser) {
        // Calculate XP reward for remaining player (winner by default)
        const winnerXP = 50 // Less XP for disconnection vs voluntary leave
        const difficultyBonus = challenge.difficulty === "medium" ? 20 : challenge.difficulty === "hard" ? 50 : 0
        const totalWinnerXP = winnerXP + difficultyBonus

        console.log(`Awarding ${totalWinnerXP} XP to ${remainingUser.username} for opponent disconnecting`)

        // Update remaining user's XP in database
        try {
          await User.findByIdAndUpdate(remainingUser.userId, {
            $inc: {
              totalXP: totalWinnerXP,
              "quizStats.wins": 1,
            },
          })
        } catch (dbError) {
          console.error("Error updating winner XP:", dbError)
        }

        // Notify remaining player with XP reward
        socket.to(roomId).emit("opponentLeft", {
          message: `${disconnectedUser.username} u shkëput nga loja`,
          roomId,
          reason: "disconnected",
          winnerXp: totalWinnerXP,
        })
      }

      // Clean up the room
      activeRooms.delete(roomId)

      // Update challenge status in database
      Challenge.findOneAndUpdate(
        { roomId },
        {
          status: "abandoned",
          endTime: new Date(),
          winner: remainingUser ? remainingUser.username : null,
        },
      ).catch((err) => console.error("Error updating abandoned challenge:", err))

      break
    }
  }
}

// Helper functions
const getWaitingPlayersCount = () => waitingPlayers.size
const getActiveRoomsCount = () => activeRooms.size

module.exports = {
  handleJoinChallenge,
  handleQuizAnswer,
  handleLeaveChallenge,
  handleDisconnect,
  getWaitingPlayersCount,
  getActiveRoomsCount,
}
