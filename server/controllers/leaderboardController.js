// controllers/leaderboardController.js
const User = require("../models/User")

// Helper function to get absolute URL for a given relative path
// This function now takes protocol and host directly
const getAbsoluteUrl = (protocol, host, relativePath) => {
  if (!relativePath) return null
  const normalizedPath = relativePath.startsWith("/") ? relativePath : `/${relativePath}`
  return `${protocol}://${host}${normalizedPath}`
}

const getLeaderboard = async (protocol, host, filter = {}, limit = 10, xpField = "xp") => {
  try {
    console.log("Fetching leaderboard with filter:", filter, "limit:", limit, "xpField:", xpField)
    
    // Build the sort object dynamically based on xpField
    const sortObj = {}
    sortObj[xpField] = -1
    sortObj.streakCount = -1 // Tie-breaker
    
    const leaderboard = await User.find(filter)
      .sort(sortObj)
      .limit(limit)
      .select(`emri mbiemri xp weeklyXp monthlyXp level profilePicture avatarStyle streakCount`) 
      .lean()

    // Add rank and transform profilePicture to absolute URL for each user
    return leaderboard.map((user, index) => ({
      _id: user._id,
      rank: index + 1,
      name: `${user.emri} ${user.mbiemri}`,
      xp: user[xpField], // Use the appropriate XP field
      level: user.level,
      avatar: user.profilePicture
        ? getAbsoluteUrl(protocol, host, user.profilePicture)
        : "/placeholder.svg?height=40&width=40",
      avatarStyle: user.avatarStyle || "adventurer",
      streak: user.streakCount,
    }))
  } catch (error) {
    console.error("Error fetching leaderboard:", error)
    throw new Error("Could not fetch leaderboard data")
  }
}
// </CHANGE>

// Get all-time leaderboard
exports.getAllTimeLeaderboard = async (req, res) => {
  try {
    const limit = Number.parseInt(req.query.limit) || 20
    const protocol = req.protocol
    const host = req.get("host")
    const leaderboard = await getLeaderboard(protocol, host, {}, limit, "xp")
    res.status(200).json({ success: true, data: leaderboard })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.getWeeklyLeaderboard = async (req, res) => {
  try {
    const limit = Number.parseInt(req.query.limit) || 10
    const protocol = req.protocol
    const host = req.get("host")
    // Use weeklyXp field for weekly leaderboard
    const leaderboard = await getLeaderboard(protocol, host, {}, limit, "weeklyXp")
    res.status(200).json({ success: true, data: leaderboard })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.getMonthlyLeaderboard = async (req, res) => {
  try {
    const limit = Number.parseInt(req.query.limit) || 20
    const protocol = req.protocol
    const host = req.get("host")
    // Use monthlyXp field for monthly leaderboard
    const leaderboard = await getLeaderboard(protocol, host, {}, limit, "monthlyXp")
    res.status(200).json({ success: true, data: leaderboard })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Export getLeaderboard for use in socket.js
module.exports.getLeaderboard = getLeaderboard
