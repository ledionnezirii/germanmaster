const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const helmet = require("helmet")
const compression = require("compression")
const { createServer } = require("http")
const { Server } = require("socket.io")
const jwt = require("jsonwebtoken")
require("dotenv").config()

const {
  handleJoinChallenge,
  handleSubmitAnswer,
  handleLeaveChallenge,
  handleDisconnect,
  getWaitingPlayersCount,
  getActiveRoomsCount,
} = require("./controllers/challengeController")

const { initRaceSocket } = require("./socket/raceSocket")

// Import payment controller for webhook
const paymentController = require("./controllers/paymentController")

const authRoutes = require("./routes/authRoutes")
const userRoutes = require("./routes/userRoutes")
const dictionaryRoutes = require("./routes/dictionaryRoutes")
const translateRoutes = require("./routes/translateRoutes")
const listenRoutes = require("./routes/listenRoutes")
const categoryRoutes = require("./routes/categoryRoutes")
const questionRoutes = require("./routes/questionRoutes")
const grammarRoutes = require("./routes/grammarRoutes")
const favoriteRoutes = require("./routes/favoriteRoutes")
const challengeRoutes = require("./routes/challengeRoutes")
const leaderboardRoutes = require("./routes/leaderboardRoutes")
const planRoutes = require("./routes/planRoutes")
const testRoutes = require("./routes/testRoutes")
const pronunciationRoutes = require("./routes/pronunciationRoutes")
const paymentRoutes = require("./routes/paymentRoutes")
const quizRoutes = require("./routes/quizRoutes")
const certificateRoutes = require("./routes/certificateRoutes")
const leagueRoutes = require("./routes/leagueRoutes")
const achievementRoutes = require("./routes/achievementsRoutes")
const puzzleRoutes = require("./routes/puzzleRoutes")
const practiceRoutes = require("./routes/practiceRoutes")
const wordRoutes = require("./routes/wordRoutes")
const ttsRoutes = require("./routes/ttsRoutes")
const phraseRoutes = require("./routes/phraseRoutes")
const academyRoutes = require("./routes/academyRoutes")
const raceRoutes = require("./routes/raceRoutes")
const dialoguesRoutes = require("./routes/dialogueRoutes")
const activityRoutes = require("./routes/activityRoutes")


const { errorHandler, notFound } = require("./middleware/errorMiddleware")
const { requestLogger } = require("./middleware/loggerMiddleware")

const app = express()
const server = createServer(app)

const io = new Server(server, {
  cors: {
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL
        : [
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:5173",
            "http://192.168.1.48:3000",
            "http://192.168.1.48:3001",
            "http://192.168.1.48:5173",
            "https://17061968.netlify.app",
          ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
})

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token
    if (!token) {
      console.log("No token provided for socket connection")
      return next(new Error("Authentication error: No token provided"))
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    socket.userId = decoded.id || decoded._id
    socket.username = decoded.username || decoded.emri || decoded.firstName
    console.log(`Socket authenticated for user: ${socket.username} (${socket.userId})`)
    next()
  } catch (error) {
    console.error("Socket authentication error:", error.message)
    next(new Error("Authentication error: Invalid token"))
  }
})

initRaceSocket(io)

io.on("connection", (socket) => {
  console.log(`🔌 User connected: ${socket.id} (${socket.username})`)
  socket.emit("connected", {
    message: "Successfully connected to challenge server",
    userId: socket.userId,
    username: socket.username,
  })

  socket.on("joinRace", (data) => {
    console.log("[Race] Join race event received:", data)
    const raceData = {
      roomId: data.roomId,
      userId: socket.userId,
      username: socket.username,
    }
    // Event will be handled by initRaceSocket
    socket.emit("race:join", raceData)
  })

  socket.on("playerReady", (data) => {
    console.log("[Race] Player ready event received:", data)
    socket.emit("race:ready", {
      roomId: data.roomId,
      userId: socket.userId,
    })
  })

  socket.on("submitAnswer", (data) => {
    console.log("[Race] Submit answer event received:", data)
    socket.emit("race:submitAnswer", {
      ...data,
      userId: socket.userId,
      questionIndex: data.questionIndex || 0,
    })
  })

  socket.on("leaveRace", (data) => {
    console.log("[Race] Leave race event received:", data)
    socket.emit("race:leave", {
      roomId: data.roomId,
      userId: socket.userId,
    })
  })

  // Challenge events
  socket.on("joinChallenge", (data) => {
    console.log("Join challenge event received:", data)
    const challengeData = {
      username: data.username || socket.username,
      userId: data.userId || socket.userId,
      gameType: data.gameType || "quiz",
      difficulty: data.difficulty,
      category: data.category,
    }
    handleJoinChallenge(socket, io, challengeData)
  })

  socket.on("submitAnswer", (data) => {
    console.log("Submit answer event received:", data)
    handleSubmitAnswer(socket, io, data)
  })

  socket.on("leaveChallenge", () => {
    console.log("Leave challenge event received")
    handleLeaveChallenge(socket, io)
  })

  socket.on("submitScore", (data) => {
    console.log("Submit score event received (legacy):", data)
    handleSubmitAnswer(socket, io, {
      roomId: data.roomId,
      questionId: data.questionId,
      answer: data.answer,
      timeSpent: data.timeSpent,
      gameType: "quiz",
    })
  })

  socket.on("disconnect", (reason) => {
    console.log(`🔌 User disconnected: ${socket.id} (${socket.username}), reason: ${reason}`)
    handleDisconnect(socket, io)
  })

  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error)
  })
})

// ============================================================
// CRITICAL: Webhook route MUST be FIRST before ANY middleware
// ============================================================
app.post("/api/payments/webhook", express.raw({ type: "application/json" }), paymentController.handleWebhook)

console.log("✅ Webhook route registered: POST /api/payments/webhook (with raw body parser)")

// Now add other middleware AFTER the webhook route
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
  }),
)
app.use(compression())

app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL
        : [
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:5173",
            "http://192.168.1.48:3000",
            "http://192.168.1.48:3001",
            "http://192.168.1.48:5173",
            "https://17061968.netlify.app",
          ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "paddle-signature"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  }),
)

// JSON parser for all other routes - AFTER webhook
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

app.use(requestLogger)

app.use("/uploads", (req, res, next) => {
  const allowedOrigins =
    process.env.NODE_ENV === "production"
      ? [process.env.FRONTEND_URL]
      : ["http://localhost:3000", "http://localhost:3001", "http://localhost:5173", "https://17061968.netlify.app"]
  const origin = req.headers.origin
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin)
  } else if (process.env.NODE_ENV !== "production") {
    res.header("Access-Control-Allow-Origin", "*")
  }
  res.header("Access-Control-Allow-Methods", "GET")
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization")
  res.header("Access-Control-Allow-Credentials", "true")
  res.header("Cross-Origin-Resource-Policy", "cross-origin")
  next()
})
app.use("/uploads", express.static("uploads"))

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    waitingPlayers: getWaitingPlayersCount(),
    activeRooms: getActiveRoomsCount(),
  })
})

console.log("Registering API routes...")
app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/dictionary", dictionaryRoutes)
app.use("/api/translate", translateRoutes)
app.use("/api/listen", listenRoutes)
app.use("/api/categories", categoryRoutes)
app.use("/api/questions", questionRoutes)
app.use("/api/grammar", grammarRoutes)
app.use("/api/favorites", favoriteRoutes)
app.use("/api/challenge", challengeRoutes)
app.use("/api/leaderboard", leaderboardRoutes)
app.use("/api/plan", planRoutes)
app.use("/api/tests", testRoutes)
app.use("/api/pronunciation", pronunciationRoutes)
app.use("/api/payments", paymentRoutes)
app.use("/api/quizes", quizRoutes)
app.use("/api/certificates", certificateRoutes)
app.use("/api/league", leagueRoutes)
app.use("/api", achievementRoutes)
app.use("/api/puzzle", puzzleRoutes)
app.use("/api/practice", practiceRoutes)
app.use("/api/words", wordRoutes)
app.use("/api/tts", ttsRoutes)
app.use("/api/phrases", phraseRoutes)
app.use("/api/academies", academyRoutes)
app.use("/api/race", raceRoutes)
app.use("/api/dialogue",dialoguesRoutes)
app.use("api/activity",activityRoutes)

app.use(notFound)
app.use(errorHandler)

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`)
    process.exit(1)
  }
}

const gracefulShutdown = (signal) => {
  console.log(`👋 ${signal} received. Shutting down gracefully...`)
  server.close(() => {
    console.log("🔌 HTTP server closed.")
    mongoose.connection
      .close()
      .then(() => {
        console.log("📦 MongoDB connection closed.")
        process.exit(0)
      })
      .catch((err) => {
        console.error("Failed to close MongoDB connection:", err)
        process.exit(1)
      })
  })
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"))
process.on("SIGINT", () => gracefulShutdown("SIGINT"))

const PORT = process.env.PORT || 5000
const startServer = async () => {
  await connectDB()
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`)
    console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`)
    console.log(`💳 Webhook endpoint: POST /api/payments/webhook`)
    console.log(`🎯 Challenge system enabled with German questions`)
    console.log(`🏁 Race system enabled - Live quiz competition`)
  })
}

startServer().catch((error) => {
  console.error("Failed to start server:", error)
  process.exit(1)
})
