const User = require("../models/User")
const { resetWeeklyXp, resetMonthlyXp, getWeekStart, getMonthStart } = require("./xpController")

const getAbsoluteUrl = (protocol, host, relativePath) => {
  if (!relativePath) return null
  const normalizedPath = relativePath.startsWith("/") ? relativePath : `/${relativePath}`
  return `${protocol}://${host}${normalizedPath}`
}

const getLeaderboard = async (protocol, host, filter = {}, limit = 10, xpField = "xp") => {
  try {
    const sortObj = {}
    sortObj[xpField] = -1
    sortObj.streakCount = -1

    const leaderboard = await User.find(filter)
      .sort(sortObj)
      .limit(limit)
      .select(`emri mbiemri xp weeklyXp monthlyXp level profilePicture avatarStyle streakCount`)
      .lean()

    return leaderboard.map((user, index) => ({
      _id: user._id,
      rank: index + 1,
      name: `${user.emri} ${user.mbiemri}`,
      xp: user[xpField] || 0,
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
    const weekStart = getWeekStart()
    const needsWeeklyReset = await User.exists({ weekStartDate: { $lt: weekStart } })
    if (needsWeeklyReset) await resetWeeklyXp()
    const limit = Number.parseInt(req.query.limit) || 20
    const protocol = req.protocol
    const host = req.get("host")
    const leaderboard = await getLeaderboard(protocol, host, {}, limit, "weeklyXp")
    res.status(200).json({ success: true, data: leaderboard })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.getMonthlyLeaderboard = async (req, res) => {
  try {
    const monthStart = getMonthStart()
    const needsMonthlyReset = await User.exists({ monthStartDate: { $lt: monthStart } })
    if (needsMonthlyReset) await resetMonthlyXp()
    const limit = Number.parseInt(req.query.limit) || 20
    const protocol = req.protocol
    const host = req.get("host")
    const leaderboard = await getLeaderboard(protocol, host, {}, limit, "monthlyXp")
    res.status(200).json({ success: true, data: leaderboard })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.getMyRank = async (req, res) => {
  try {
    const userId = req.user._id
    const timeFrame = req.query.timeFrame || "all-time"

    let xpField = "xp"
    if (timeFrame === "weekly") xpField = "weeklyXp"
    else if (timeFrame === "monthly") xpField = "monthlyXp"

    const user = await User.findById(userId)
      .select("emri mbiemri xp weeklyXp monthlyXp level profilePicture avatarStyle streakCount")
      .lean()

    if (!user) return res.status(404).json({ success: false, message: "User not found" })

    const userXp = user[xpField] || 0
    const filter = {}
    filter[xpField] = { $gt: userXp }
    const rank = (await User.countDocuments(filter)) + 1

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        rank,
        name: `${user.emri} ${user.mbiemri}`,
        xp: userXp,
        level: user.level,
        avatarStyle: user.avatarStyle || "adventurer",
        streak: user.streakCount,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

module.exports.getLeaderboard = getLeaderboard