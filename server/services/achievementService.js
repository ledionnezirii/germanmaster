const User = require("../models/User")
const { ApiError } = require("../utils/ApiError")

const generateXpMilestones = () => {
  const milestones = []

  // Every 500 XP until 3000
  for (let xp = 500; xp <= 3000; xp += 500) {
    milestones.push({
      xp,
      achievement: `${xp} XP Master`,
      icon: getAchievementIcon(xp),
      tier: getTier(xp),
    })
  }

  // Every 2000 XP after 3000 (5000, 7000, 9000, etc.)
  for (let xp = 5000; xp <= 20000; xp += 2000) {
    milestones.push({
      xp,
      achievement: `${xp} XP Legend`,
      icon: getAchievementIcon(xp),
      tier: getTier(xp),
    })
  }

  return milestones
}

const getAchievementIcon = (xp) => {
  if (xp <= 1000) return "🌟"
  if (xp <= 2000) return "⭐"
  if (xp <= 3000) return "💫"
  if (xp <= 5000) return "🏆"
  if (xp <= 10000) return "👑"
  return "💎"
}

const getTier = (xp) => {
  if (xp <= 1000) return "Bronze"
  if (xp <= 2000) return "Silver"
  if (xp <= 3000) return "Gold"
  if (xp <= 10000) return "Platinum"
  return "Diamond"
}

const xpMilestones = generateXpMilestones()

// Adds a single achievement if not present
async function addAchievement(userId, achievementName) {
  const user = await User.findById(userId)
  if (!user) throw new ApiError(404, "User not found")
  if (!user.achievements.includes(achievementName)) {
    user.achievements.push(achievementName)
    await user.save()
  }
  return user.achievements
}

async function evaluateXpMilestones(user, addedXp) {
  if (!user) throw new ApiError(404, "User not found")
  const oldXp = user.xp
  const newXp = oldXp + addedXp
  const newAchievements = []

  for (const milestone of xpMilestones) {
    if (oldXp < milestone.xp && newXp >= milestone.xp) {
      if (!user.achievements.includes(milestone.achievement)) {
        user.achievements.push(milestone.achievement)
        newAchievements.push({
          name: milestone.achievement,
          icon: milestone.icon,
          tier: milestone.tier,
          xp: milestone.xp,
        })
      }
    }
  }

  user.xp = newXp

  if (newAchievements.length > 0) {
    user.newAchievements = newAchievements.map((a) => a.name)
  }

  await user.save()

  return newAchievements
}

function getAchievementDetails(achievementName) {
  const milestone = xpMilestones.find((m) => m.achievement === achievementName)
  return (
    milestone || {
      achievement: achievementName,
      icon: "🏅",
      tier: "Special",
      xp: 0,
    }
  )
}

module.exports = {
  addAchievement,
  evaluateXpMilestones,
  getAchievementDetails,
  xpMilestones,
}
