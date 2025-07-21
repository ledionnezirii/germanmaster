// socket/index.js
const { Server } = require("socket.io")
const { getLeaderboard } = require("../controllers/leaderboardController") // Import the helper
const User = require("../models/User") // Import User model to listen for changes

let io

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000", // Use FRONTEND_URL for consistency
      methods: ["GET", "POST"],
    },
  })

  io.on("connection", async (socket) => {
    console.log("A user connected:", socket.id)

    // Send initial leaderboard data to the newly connected client
    try {
      // For initial load, we need a base URL. Assuming the client is on localhost:3000
      // and the backend is on localhost:5000. Adjust if your setup is different.
      const protocol = process.env.NODE_ENV === "production" ? "https" : "http"
      const host = process.env.SERVER_HOST || "localhost:5000" // Use an env var for host
      const allTimeLeaderboard = await getLeaderboard(protocol, host, {}, 10)
      socket.emit("leaderboardUpdate", { type: "all-time", data: allTimeLeaderboard })
    } catch (error) {
      console.error("Error sending initial leaderboard:", error)
      socket.emit("leaderboardError", { message: "Failed to load initial leaderboard." })
    }

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id)
    })

    // You can also add listeners for specific leaderboard requests if needed
    socket.on("requestLeaderboard", async ({ timeFrame, limit }) => {
      try {
        const protocol = process.env.NODE_ENV === "production" ? "https" : "http"
        const host = process.env.SERVER_HOST || "localhost:5000"
        let filter = {}
        if (timeFrame === "weekly") {
          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          filter = { lastLoginDate: { $gte: sevenDaysAgo } }
        } else if (timeFrame === "monthly") {
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          filter = { lastLoginDate: { $gte: thirtyDaysAgo } }
        }
        const leaderboard = await getLeaderboard(protocol, host, filter, limit || 10)
        socket.emit("leaderboardUpdate", { type: timeFrame, data: leaderboard })
      } catch (error) {
        console.error(`Error fetching ${timeFrame} leaderboard via socket:`, error)
        socket.emit("leaderboardError", { message: `Failed to load ${timeFrame} leaderboard.` })
      }
    })
  })

  // Set up Mongoose change stream to listen for user updates
  // This requires MongoDB Replica Set for production. For development,
  // you might need to manually trigger updates or use a simpler polling mechanism
  // if change streams are not configured.
  try {
    const userChangeStream = User.watch()
    userChangeStream.on("change", async (change) => {
      console.log("User data changed:", change.operationType)
      // Re-fetch and emit all leaderboards on any user change
      // In a high-traffic app, you might want to debounce this or optimize.
      const protocol = process.env.NODE_ENV === "production" ? "https" : "http"
      const host = process.env.SERVER_HOST || "localhost:5000"

      const allTimeLeaderboard = await getLeaderboard(protocol, host, {}, 10)
      io.emit("leaderboardUpdate", { type: "all-time", data: allTimeLeaderboard })

      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const weeklyLeaderboard = await getLeaderboard(protocol, host, { lastLoginDate: { $gte: sevenDaysAgo } }, 10)
      io.emit("leaderboardUpdate", { type: "weekly", data: weeklyLeaderboard })

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const monthlyLeaderboard = await getLeaderboard(protocol, host, { lastLoginDate: { $gte: thirtyDaysAgo } }, 10)
      io.emit("leaderboardUpdate", { type: "monthly", data: monthlyLeaderboard })
    })
    userChangeStream.on("error", (error) => {
      console.error("User change stream error:", error)
    })
  } catch (e) {
    console.warn(
      "MongoDB Change Stream could not be initialized. Ensure MongoDB is running as a replica set for real-time updates. Falling back to manual updates or polling if implemented.",
    )
    console.warn("Error:", e.message)
  }
}

// Function to manually emit leaderboard updates (e.g., after a user action)
const emitLeaderboardUpdate = async (timeFrame = "all-time", filter = {}, limit = 10) => {
  if (!io) {
    console.warn("Socket.io not initialized. Cannot emit leaderboard update.")
    return
  }
  try {
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http"
    const host = process.env.SERVER_HOST || "localhost:5000"
    const leaderboard = await getLeaderboard(protocol, host, filter, limit)
    io.emit("leaderboardUpdate", { type: timeFrame, data: leaderboard })
    console.log(`Emitted ${timeFrame} leaderboard update.`)
  } catch (error) {
    console.error("Error emitting leaderboard update:", error)
  }
}

module.exports = { initSocket, emitLeaderboardUpdate, io: () => io }
