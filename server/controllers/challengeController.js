const Challenge = require("../models/Challenge")
const User = require("../models/User")
const { getRandomQuestions, getQuestionsByDifficulty } = require("../data/quizQuestions") // Assuming this exists for quiz
const { getRandomGermanWords } = require("../data/germanWords") // NEW: Import for word race

// In-memory storage for active games
const waitingPlayers = new Map()
const activeRooms = new Map()

const handleJoinChallenge = async (socket, io, data) => {
  try {
    // Use socket.username and socket.userId directly, as they are populated by JWT auth middleware
    const username = socket.username // Use the username from the authenticated socket
    const userId = socket.userId
    const { difficulty = "random", category = null, gameType = "quiz" } = data // Extract other data from payload

    console.log(
      `Player ${username} (ID: ${userId}) wants to join challenge of type: ${gameType}, difficulty: ${difficulty}`,
    )

    if (!userId) {
      console.error("No userId found for user:", username)
      socket.emit("error", { message: "User ID not found. Please reconnect." })
      return
    }

    // Remove player from waiting list if they were already waiting
    for (const [socketId, playerData] of waitingPlayers.entries()) {
      if (playerData.userId === userId) {
        // Only check userId for uniqueness
        waitingPlayers.delete(socketId)
        console.log(`Removed ${username} from previous waiting position`)
        break
      }
    }

    // Check if there are other waiting players (excluding current user) for the same game type
    let opponent = null
    console.log(`Current player joining: ${username} (ID: ${userId})`)
    for (const [socketId, playerData] of waitingPlayers.entries()) {
      console.log(
        `Checking waiting player: ${playerData.username} (ID: ${playerData.userId}) for gameType ${playerData.gameType}`,
      )
      if (playerData.userId !== userId && playerData.gameType === gameType) {
        // Match based on distinct userId and same gameType
        opponent = { socketId, ...playerData }
        waitingPlayers.delete(socketId)
        console.log(`Found opponent: ${opponent.username} (ID: ${opponent.userId})`)
        break
      }
    }

    if (opponent) {
      // Found an opponent - start the game
      const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      console.log(`Starting ${gameType} game between ${username} and ${opponent.username}`)

      let selectedQuestions
      try {
        if (gameType === "wordRace") {
          selectedQuestions = getRandomGermanWords(10) // Get 10 German words for the race
          console.log(`Selected ${selectedQuestions.length} words for the word race`)
        } else {
          // Default to quiz logic
          if (difficulty && difficulty !== "random") {
            selectedQuestions = getQuestionsByDifficulty(difficulty, 10)
          } else if (category) {
            selectedQuestions = getRandomQuestions(10, category)
          } else {
            selectedQuestions = getRandomQuestions(10)
          }
          console.log(
            `Selected ${selectedQuestions.length} quiz questions for the challenge (${difficulty || "random"})`,
          )
        }
      } catch (error) {
        console.error("Error selecting questions/words:", error)
        socket.emit("error", { message: "Error loading game content. Please try again." })
        return
      }

      // Create challenge record
      try {
        const challenge = new Challenge({
          roomId,
          users: [
            {
              username, // Use username from socket
              userId, // Use userId from socket
              socketId: socket.id,
              score: 0,
              xp: 0,
              answers: [],
              finished: false,
              wordsTyped: 0, // Initialize for wordRace
              correctWords: 0, // Initialize for wordRace
            },
            {
              username: opponent.username,
              userId: opponent.userId,
              socketId: opponent.socketId,
              score: 0,
              xp: 0,
              answers: [],
              finished: false,
              wordsTyped: 0, // Initialize for wordRace
              correctWords: 0, // Initialize for wordRace
            },
          ],
          questions: selectedQuestions,
          status: "active",
          timeLimit: 300,
          startTime: new Date(),
          difficulty: difficulty || "random",
          category: category || null,
          gameType: gameType, // Set the game type
        })
        await challenge.save()
        activeRooms.set(roomId, challenge)
        console.log(`Challenge created with ID: ${challenge._id}, Type: ${gameType}`)

        // Join both players to the room
        socket.join(roomId)
        const opponentSocket = io.sockets.sockets.get(opponent.socketId)
        if (opponentSocket) {
          opponentSocket.join(roomId)
        } else {
          console.warn(`Opponent socket ${opponent.socketId} not found`)
        }

        // Notify both players based on game type
        const gameStartEvent = gameType === "wordRace" ? "wordRaceStart" : "quizStart"
        io.to(roomId).emit(gameStartEvent, {
          roomId,
          message: `Loja ${gameType === "wordRace" ? "e garës me fjalë" : "e kuizit"} mes ${username} dhe ${opponent.username} ka nisur!`,
          users: [
            { username, userId },
            { username: opponent.username, userId: opponent.userId },
          ],
          questions: selectedQuestions.map((q) => ({
            id: q.id,
            question: q.question, // For quiz
            options: q.options, // For quiz
            word: q.word, // For wordRace
            translation: q.translation, // For wordRace
            category: q.category,
          })),
          timeLimit: 300,
          startTime: challenge.startTime,
          difficulty: difficulty || "random",
          category: category || null,
          gameType: gameType,
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
        username, // Use username from socket
        userId, // Use userId from socket
        socketId: socket.id,
        joinedAt: Date.now(),
        difficulty: difficulty || "random",
        category: category || null,
        gameType: gameType, // Store game type in waiting list
      })
      console.log(`${username} added to waiting list for ${gameType}. Total waiting: ${waitingPlayers.size}`)
      socket.emit("waitingForOpponent", {
        message: `Duke pritur për një kundërshtar... (${waitingPlayers.size} lojtar në pritje)`,
        roomId: null,
        waitingCount: waitingPlayers.size,
        difficulty: difficulty || "random",
        category: category || null,
        gameType: gameType,
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

const handleSubmitAnswer = async (socket, io, data) => {
  // Renamed from handleQuizAnswer for generality
  try {
    const { roomId, questionId, answer, typedWord, timeSpent } = data // 'answer' for quiz, 'typedWord' for wordRace
    const challenge = activeRooms.get(roomId)

    if (!challenge) {
      socket.emit("error", { message: "Dhoma nuk u gjet" })
      return
    }

    const userIndex = challenge.users.findIndex((u) => u.socketId === socket.id)
    if (userIndex === -1) {
      socket.emit("error", { message: "Përdoruesi nuk u gjet në sfidë" })
      return
    }
    const user = challenge.users[userIndex]

    const question = challenge.questions.find((q) => q.id === questionId)
    if (!question) {
      socket.emit("error", { message: "Pyetja/Fjala nuk u gjet" })
      return
    }

    const alreadyAnswered = user.answers.find((a) => a.questionId === questionId)
    if (alreadyAnswered) {
      socket.emit("error", { message: "Keni përgjigjur tashmë për këtë pyetje/fjalë" })
      return
    }

    let isCorrect = false
    if (challenge.gameType === "quiz") {
      isCorrect = question.correctAnswer === answer
      if (isCorrect) {
        user.score++
      }
      user.answers.push({
        questionId,
        answer,
        isCorrect,
        timeSpent: timeSpent || 0,
        timestamp: Date.now(),
      })
      console.log(
        `${user.username} answered quiz question ${questionId}: ${answer} (${isCorrect ? "correct" : "incorrect"})`,
      )
    } else if (challenge.gameType === "wordRace") {
      user.wordsTyped++
      isCorrect = question.word.toLowerCase() === typedWord.toLowerCase() // Case-insensitive check
      if (isCorrect) {
        user.correctWords++
      }
      user.answers.push({
        questionId,
        typedWord,
        isCorrect,
        timeSpent: timeSpent || 0,
        timestamp: Date.now(),
      })
      console.log(`${user.username} typed word ${questionId}: "${typedWord}" (${isCorrect ? "correct" : "incorrect"})`)

      // Emit real-time progress update for word race
      io.to(roomId).emit("playerProgressUpdate", {
        username: user.username,
        wordsTyped: user.wordsTyped,
        correctWords: user.correctWords,
        totalWords: challenge.questions.length,
      })
    }

    const totalContent = challenge.questions.length
    const userProgressCount = challenge.gameType === "quiz" ? user.answers.length : user.wordsTyped

    if (userProgressCount === totalContent) {
      user.finished = true
      user.finishTime = Date.now()

      let xpEarned = 0
      if (challenge.gameType === "quiz") {
        const baseXP = user.score * 10
        const perfectScoreBonus = user.score === totalContent ? 50 : 0
        const timeBonus = Math.max(0, 30 - Math.floor((user.finishTime - challenge.startTime) / 1000 / 10))
        let difficultyBonus = 0
        if (challenge.difficulty === "medium") difficultyBonus = 20
        if (challenge.difficulty === "hard") difficultyBonus = 50
        xpEarned = baseXP + perfectScoreBonus + timeBonus + difficultyBonus
        user.xp = xpEarned
        console.log(`${user.username} finished quiz with score: ${user.score}/${totalContent}, XP: ${xpEarned}`)
      } else if (challenge.gameType === "wordRace") {
        const baseXP = user.correctWords * 15 // More XP for typing
        const accuracyBonus = user.correctWords === totalContent ? 75 : 0
        const speedBonus = Math.max(0, 50 - Math.floor((user.finishTime - challenge.startTime) / 1000 / 5)) // Faster speed bonus
        xpEarned = baseXP + accuracyBonus + speedBonus
        user.xp = xpEarned
        console.log(
          `${user.username} finished word race with correct words: ${user.correctWords}/${totalContent}, XP: ${xpEarned}`,
        )
      }

      io.to(roomId).emit("playerFinished", {
        username: user.username,
        score: user.score, // For quiz
        wordsTyped: user.wordsTyped, // For wordRace
        correctWords: user.correctWords, // For wordRace
        xp: xpEarned,
        totalQuestions: totalContent,
        time: Math.round((user.finishTime - challenge.startTime) / 1000),
        gameType: challenge.gameType,
      })

      try {
        await User.findByIdAndUpdate(user.userId, {
          $inc: {
            xp: xpEarned, // Update general XP field
            "quizStats.totalQuizzes": challenge.gameType === "quiz" ? 1 : 0,
            "quizStats.correctAnswers": challenge.gameType === "quiz" ? user.score : 0,
            "wordRaceStats.totalRaces": challenge.gameType === "wordRace" ? 1 : 0,
            "wordRaceStats.correctWords": challenge.gameType === "wordRace" ? user.correctWords : 0,
          },
        })
      } catch (dbError) {
        console.error("Error updating user XP/stats:", dbError)
      }
    }

    const allFinished = challenge.users.every((u) => u.finished)
    if (allFinished) {
      const sortedUsers = challenge.users.sort((a, b) => {
        if (challenge.gameType === "quiz") {
          if (b.score !== a.score) return b.score - a.score
          return a.finishTime - b.finishTime
        } else if (challenge.gameType === "wordRace") {
          if (b.correctWords !== a.correctWords) return b.correctWords - a.correctWords
          return a.finishTime - b.finishTime
        }
        return 0
      })

      let winner = null
      if (sortedUsers.length > 1) {
        if (challenge.gameType === "quiz" && sortedUsers[0].score > sortedUsers[1].score) {
          sortedUsers[0].isWinner = true
          winner = sortedUsers[0].username
        } else if (challenge.gameType === "wordRace" && sortedUsers[0].correctWords > sortedUsers[1].correctWords) {
          sortedUsers[0].isWinner = true
          winner = sortedUsers[0].username
        } else if (
          sortedUsers[0].score === sortedUsers[1].score ||
          sortedUsers[0].correctWords === sortedUsers[1].correctWords
        ) {
          // If scores/correct words are tied, check finish time
          if (sortedUsers[0].finishTime < sortedUsers[1].finishTime) {
            sortedUsers[0].isWinner = true
            winner = sortedUsers[0].username
          } else if (sortedUsers[1].finishTime < sortedUsers[0].finishTime) {
            sortedUsers[1].isWinner = true
            winner = sortedUsers[1].username
          }
        }
      } else if (sortedUsers.length === 1) {
        // Single player scenario (e.g., if opponent disconnected earlier)
        sortedUsers[0].isWinner = true
        winner = sortedUsers[0].username
      }

      if (winner) {
        try {
          await User.findByIdAndUpdate(sortedUsers.find((u) => u.username === winner).userId, {
            $inc: {
              "quizStats.wins": challenge.gameType === "quiz" ? 1 : 0,
              "wordRaceStats.wins": challenge.gameType === "wordRace" ? 1 : 0,
            },
          })
        } catch (dbError) {
          console.error("Error updating winner stats:", dbError)
        }
      }

      challenge.status = "completed"
      challenge.winner = winner
      challenge.endTime = new Date()
      console.log(`Challenge completed. Winner: ${winner || "Tie"}`)

      const resultEvent = challenge.gameType === "wordRace" ? "wordRaceResult" : "quizResult"
      io.to(roomId).emit(resultEvent, {
        message: winner
          ? `🎉 ${winner} fitoi ${challenge.gameType === "wordRace" ? "garën me fjalë" : "kuizin"}!`
          : "🤝 Barazim!",
        users: sortedUsers.map((u) => ({
          username: u.username,
          score: u.score, // For quiz
          wordsTyped: u.wordsTyped, // For wordRace
          correctWords: u.correctWords, // For wordRace
          xp: u.xp,
          isWinner: u.isWinner || false,
          finishTime: u.finishTime,
        })),
        winner,
        roomId,
        difficulty: challenge.difficulty,
        category: challenge.category,
        gameType: challenge.gameType,
      })

      activeRooms.delete(roomId)
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
    console.error("Error handling answer:", error)
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
        let winnerXP = 0
        if (challenge.gameType === "quiz") {
          winnerXP = 75 // Base XP for winning by opponent leaving
        } else if (challenge.gameType === "wordRace") {
          winnerXP = 100 // Slightly more XP for word race win by default
        }
        const difficultyBonus = challenge.difficulty === "medium" ? 20 : challenge.difficulty === "hard" ? 50 : 0
        const totalWinnerXP = winnerXP + difficultyBonus
        console.log(`Awarding ${totalWinnerXP} XP to ${remainingUser.username} for opponent leaving`)

        try {
          await User.findByIdAndUpdate(remainingUser.userId, {
            $inc: {
              xp: totalWinnerXP,
              "quizStats.wins": challenge.gameType === "quiz" ? 1 : 0,
              "wordRaceStats.wins": challenge.gameType === "wordRace" ? 1 : 0,
            },
          })
        } catch (dbError) {
          console.error("Error updating winner XP:", dbError)
        }

        socket.to(roomId).emit("opponentLeft", {
          message: `${leavingUser.username} doli nga loja`,
          roomId,
          reason: "left",
          winnerXp: totalWinnerXP,
          gameType: challenge.gameType,
        })
      }

      socket.emit("leftChallenge", {
        message: "Keni dalë nga challenge-i",
      })

      activeRooms.delete(roomId)
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
        let winnerXP = 0
        if (challenge.gameType === "quiz") {
          winnerXP = 50 // Less XP for disconnection vs voluntary leave
        } else if (challenge.gameType === "wordRace") {
          winnerXP = 75 // Slightly more XP for word race win by default
        }
        const difficultyBonus = challenge.difficulty === "medium" ? 20 : challenge.difficulty === "hard" ? 50 : 0
        const totalWinnerXP = winnerXP + difficultyBonus
        console.log(`Awarding ${totalWinnerXP} XP to ${remainingUser.username} for opponent disconnecting`)

        try {
          await User.findByIdAndUpdate(remainingUser.userId, {
            $inc: {
              xp: totalWinnerXP,
              "quizStats.wins": challenge.gameType === "quiz" ? 1 : 0,
              "wordRaceStats.wins": challenge.gameType === "wordRace" ? 1 : 0,
            },
          })
        } catch (dbError) {
          console.error("Error updating winner XP:", dbError)
        }

        socket.to(roomId).emit("opponentLeft", {
          message: `${disconnectedUser.username} u shkëput nga loja`,
          roomId,
          reason: "disconnected",
          winnerXp: totalWinnerXP,
          gameType: challenge.gameType,
        })
      }

      activeRooms.delete(roomId)
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
  handleSubmitAnswer, // Renamed and adapted
  handleLeaveChallenge,
  handleDisconnect,
  getWaitingPlayersCount,
  getActiveRoomsCount,
}
