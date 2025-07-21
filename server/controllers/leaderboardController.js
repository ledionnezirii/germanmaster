// controllers/leaderboardController.js
const User = require("../models/User")

// Helper function to get absolute URL for a given relative path
// This function now takes protocol and host directly
const getAbsoluteUrl = (protocol, host, relativePath) => {
  if (!relativePath) return null
  const normalizedPath = relativePath.startsWith("/") ? relativePath : `/${relativePath}`
  return `${protocol}://${host}${normalizedPath}`
}

// Helper function to get leaderboard data
// Modified to accept protocol and host instead of req
const getLeaderboard = async (protocol, host, filter = {}, limit = 10) => {
  try {
    console.log("Fetching leaderboard with filter:", filter, "and limit:", limit)
    const leaderboard = await User.find(filter)
      .sort({ xp: -1, streakCount: -1 }) // Sort by XP, then by streak for tie-breaking
      .limit(limit)
      .select("emri mbiemri xp level profilePicture streakCount") // Select relevant fields
      .lean() // Return plain JavaScript objects

    // Add rank and transform profilePicture to absolute URL for each user
    return leaderboard.map((user, index) => ({
      rank: index + 1,
      name: `${user.emri} ${user.mbiemri}`,
      xp: user.xp,
      level: user.level,
      // Use the getAbsoluteUrl helper to convert the relative path to an absolute URL
      avatar: user.profilePicture
        ? getAbsoluteUrl(protocol, host, user.profilePicture)
        : "/placeholder.svg?height=40&width=40",
      streak: user.streakCount,
    }))
  } catch (error) {
    console.error("Error fetching leaderboard:", error)
    throw new Error("Could not fetch leaderboard data")
  }
}

// Get all-time leaderboard
exports.getAllTimeLeaderboard = async (req, res) => {
  try {
    const limit = Number.parseInt(req.query.limit) || 10 // Default limit to 10
    const protocol = req.protocol
    const host = req.get("host")
    const leaderboard = await getLeaderboard(protocol, host, {}, limit) // Pass protocol and host
    res.status(200).json({ success: true, data: leaderboard })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Get weekly leaderboard (users active in the last 7 days, ranked by total XP)
exports.getWeeklyLeaderboard = async (req, res) => {
  try {
    const limit = Number.parseInt(req.query.limit) || 10
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const protocol = req.protocol
    const host = req.get("host")
    const leaderboard = await getLeaderboard(protocol, host, { lastLoginDate: { $gte: sevenDaysAgo } }, limit) // Pass protocol and host
    res.status(200).json({ success: true, data: leaderboard })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Get monthly leaderboard (users active in the last 30 days, ranked by total XP)
exports.getMonthlyLeaderboard = async (req, res) => {
  try {
    const limit = Number.parseInt(req.query.limit) || 10
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const protocol = req.protocol
    const host = req.get("host")
    const leaderboard = await getLeaderboard(protocol, host, { lastLoginDate: { $gte: thirtyDaysAgo } }, limit) // Pass protocol and host
    res.status(200).json({ success: true, data: leaderboard })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Export getLeaderboard for use in socket.js
module.exports.getLeaderboard = getLeaderboard
