// socket/index.js
const { Server } = require("socket.io")
const { getLeaderboard } = require("../controllers/leaderboardController")
const User = require("../models/User")

let io

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  })

  io.on("connection", async (socket) => {
    console.log("A user connected:", socket.id)

    // Send initial all-time leaderboard to newly connected client
    try {
      const protocol = process.env.NODE_ENV === "production" ? "https" : "http"
      const host = process.env.SERVER_HOST || "localhost:5000"
      const allTimeLeaderboard = await getLeaderboard(protocol, host, {}, 10, "xp")
      socket.emit("leaderboardUpdate", { type: "all-time", data: allTimeLeaderboard })
    } catch (error) {
      console.error("Error sending initial leaderboard:", error)
      socket.emit("leaderboardError", { message: "Failed to load initial leaderboard." })
    }

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id)
    })

    // ✅ FIXED: use xpField param instead of wrong lastLoginDate filter
    socket.on("requestLeaderboard", async ({ timeFrame, limit }) => {
      try {
        const protocol = process.env.NODE_ENV === "production" ? "https" : "http"
        const host = process.env.SERVER_HOST || "localhost:5000"

        let xpField = "xp"
        if (timeFrame === "weekly") xpField = "weeklyXp"
        else if (timeFrame === "monthly") xpField = "monthlyXp"

        const leaderboard = await getLeaderboard(protocol, host, {}, limit || 10, xpField)
        socket.emit("leaderboardUpdate", { type: timeFrame, data: leaderboard })
      } catch (error) {
        console.error(`Error fetching ${timeFrame} leaderboard via socket:`, error)
        socket.emit("leaderboardError", { message: `Failed to load ${timeFrame} leaderboard.` })
      }
    })
  })

  // MongoDB change stream — requires Replica Set in production
  try {
    const userChangeStream = User.watch()

    userChangeStream.on("change", async (change) => {
      console.log("User data changed:", change.operationType)

      try {
        const protocol = process.env.NODE_ENV === "production" ? "https" : "http"
        const host = process.env.SERVER_HOST || "localhost:5000"

        // ✅ FIXED: all three use the correct xpField
        const allTimeLeaderboard = await getLeaderboard(protocol, host, {}, 10, "xp")
        io.emit("leaderboardUpdate", { type: "all-time", data: allTimeLeaderboard })

        const weeklyLeaderboard = await getLeaderboard(protocol, host, {}, 10, "weeklyXp")
        io.emit("leaderboardUpdate", { type: "weekly", data: weeklyLeaderboard })

        const monthlyLeaderboard = await getLeaderboard(protocol, host, {}, 10, "monthlyXp")
        io.emit("leaderboardUpdate", { type: "monthly", data: monthlyLeaderboard })
      } catch (error) {
        console.error("Error emitting leaderboard updates after change:", error)
      }
    })

    userChangeStream.on("error", (error) => {
      console.error("User change stream error:", error)
    })
  } catch (e) {
    console.warn("MongoDB Change Stream could not be initialized. Ensure MongoDB is running as a replica set.")
    console.warn("Error:", e.message)
  }
}

// Manually emit leaderboard updates (e.g. after a user action)
const emitLeaderboardUpdate = async (timeFrame = "all-time", limit = 10) => {
  if (!io) {
    console.warn("Socket.io not initialized. Cannot emit leaderboard update.")
    return
  }
  try {
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http"
    const host = process.env.SERVER_HOST || "localhost:5000"

    let xpField = "xp"
    if (timeFrame === "weekly") xpField = "weeklyXp"
    else if (timeFrame === "monthly") xpField = "monthlyXp"

    const leaderboard = await getLeaderboard(protocol, host, {}, limit, xpField)
    io.emit("leaderboardUpdate", { type: timeFrame, data: leaderboard })
    console.log(`Emitted ${timeFrame} leaderboard update.`)
  } catch (error) {
    console.error("Error emitting leaderboard update:", error)
  }
}

module.exports = { initSocket, emitLeaderboardUpdate, io: () => io }