const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")
const compression = require("compression")
const { createServer } = require("http")
const { Server } = require("socket.io")
const jwt = require("jsonwebtoken")
require("dotenv").config()

// Import challenge handlers
const {
  handleJoinChallenge,
  handleQuizAnswer,
  handleLeaveChallenge, // NEW
  handleDisconnect,
  getWaitingPlayersCount,
  getActiveRoomsCount,
} = require("./controllers/challengeController")

// Import routes
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

// Import middleware
const { errorHandler, notFound } = require("./middleware/errorMiddleware")
const { requestLogger } = require("./middleware/loggerMiddleware")

const app = express()
const server = createServer(app)

// Socket.IO setup with authentication
const io = new Server(server, {
  cors: {
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL
        : ["http://localhost:3000", "http://localhost:3001", "http://localhost:5173"],
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
})

// Socket authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token

    if (!token) {
      console.log("No token provided for socket connection")
      return next(new Error("Authentication error: No token provided"))
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Attach user info to socket
    socket.userId = decoded.id || decoded._id
    socket.username = decoded.username || decoded.emri || decoded.firstName

    console.log(`Socket authenticated for user: ${socket.username} (${socket.userId})`)
    next()
  } catch (error) {
    console.error("Socket authentication error:", error.message)
    next(new Error("Authentication error: Invalid token"))
  }
})

// Store active challenges in memory (for backward compatibility)
const activeChallenges = {}

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log(`🔌 User connected: ${socket.id} (${socket.username})`)

  // Send connection confirmation
  socket.emit("connected", {
    message: "Successfully connected to challenge server",
    userId: socket.userId,
    username: socket.username,
  })

  // Handle joining a challenge
  socket.on("joinChallenge", (data) => {
    console.log("Join challenge event received:", data)

    // Use socket user info if not provided in data
    const challengeData = {
      username: data.username || socket.username,
      userId: data.userId || socket.userId,
    }

    handleJoinChallenge(socket, io, challengeData, activeChallenges)
  })

  // Handle quiz answers
  socket.on("quizAnswer", (data) => {
    console.log("Quiz answer event received:", data)
    handleQuizAnswer(socket, io, data, activeChallenges)
  })

  // NEW: Handle leaving challenge
  socket.on("leaveChallenge", () => {
    console.log("Leave challenge event received")
    handleLeaveChallenge(socket, io)
  })

  // Keep old submitScore for backward compatibility
  socket.on("submitScore", (data) => {
    console.log("Submit score event received (legacy):", data)
    handleQuizAnswer(socket, io, data, activeChallenges)
  })

  // Handle disconnect
  socket.on("disconnect", (reason) => {
    console.log(`🔌 User disconnected: ${socket.id} (${socket.username}), reason: ${reason}`)
    handleDisconnect(socket, io)
  })

  // Handle connection errors
  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error)
  })
})

// Security middleware
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
  }),
)
app.use(compression())

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
})

app.use("/api/", limiter)

// CORS configuration
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL
        : ["http://localhost:3000", "http://localhost:3001", "http://localhost:5173"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
)

// Body parsing middleware
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// Request logging
app.use(requestLogger)

// Fix the CORS middleware for uploads
app.use("/uploads", (req, res, next) => {
  const allowedOrigins = process.env.NODE_ENV === "production"
    ? [process.env.FRONTEND_URL]
    : ["http://localhost:3000", "http://localhost:3001", "http://localhost:5173"];
  
  const origin = req.headers.origin;
  
  // Check if the request origin is in the allowed origins list
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  } else if (process.env.NODE_ENV !== "production") {
    // For development, allow any localhost origin
    res.header("Access-Control-Allow-Origin", "*");
  }
  
  res.header("Access-Control-Allow-Methods", "GET");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});
app.use("/uploads", express.static("uploads"))

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    waitingPlayers: getWaitingPlayersCount(),
    activeRooms: getActiveRoomsCount(),
  })
})

// API routes
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

// Error handling middleware
app.use(notFound)
app.use(errorHandler)

// Database connection
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

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`👋 ${signal} received. Shutting down gracefully...`)

  server.close(() => {
    console.log("🔌 HTTP server closed.")

    mongoose.connection.close().then(() => {
      console.log("📦 MongoDB connection closed.")
      process.exit(0)
    }).catch((err) => {
      console.error("Failed to close MongoDB connection:", err)
      process.exit(1)
    })
  })
}


process.on("SIGTERM", () => gracefulShutdown("SIGTERM"))
process.on("SIGINT", () => gracefulShutdown("SIGINT"))

// Start server
const PORT = process.env.PORT || 5000

const startServer = async () => {
  await connectDB()

  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`)
    console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`)
    console.log(`🎯 Challenge system enabled with German questions`)
    console.log(`📊 Challenge API endpoints:`)
    console.log(`   GET /api/challenge/challengeQuestions - Get random challenge questions`)
    console.log(`   GET /api/challenge/challengeStats - Get challenge statistics`)
    console.log(`   GET /api/challenge/challengeHistory/:username - Get user challenge history`)
    console.log(`   GET /api/challenge/challengeLeaderboard - Get challenge leaderboard`)
    console.log(`   GET /api/challenge/activeRooms - Get active challenge rooms`)
    console.log(`   GET /api/challenge/categories - Get question categories`)
    console.log(`   POST /api/challenge/practice - Get practice questions`)
  })
}

startServer().catch((error) => {
  console.error("Failed to start server:", error)
  process.exit(1)
})
