const XP_MILESTONES = [
  { xp: 100, name: "First Steps", description: "Earned your first 100 XP" },
  { xp: 500, name: "Getting Started", description: "Reached 500 XP" },
  { xp: 1000, name: "Dedicated Learner", description: "Reached 1,000 XP" },
  { xp: 2500, name: "Rising Star", description: "Reached 2,500 XP" },
  { xp: 5000, name: "Expert", description: "Reached 5,000 XP" },
  { xp: 10000, name: "Master", description: "Reached 10,000 XP" },
  { xp: 25000, name: "Legend", description: "Reached 25,000 XP" },
  { xp: 50000, name: "Champion", description: "Reached 50,000 XP" },
]

/**
 * Evaluates XP milestones and updates user achievements
 * @param {Object} user - Mongoose user document
 * @param {Number} xpGained - Amount of XP being added
 * @returns {Array} Array of newly unlocked achievements
 */
const evaluateXpMilestones = async (user, xpGained) => {
  const oldXp = user.xp || 0
  const newXp = oldXp + xpGained

  user.xp = newXp
  user.weekXp = (user.weekXp || 0) + xpGained

  // Initialize achievements array if it doesn't exist
  if (!user.achievements) {
    user.achievements = []
  }

  // Find milestones that were just crossed
  const newAchievements = []
  for (const milestone of XP_MILESTONES) {
    // Check if this milestone was just crossed
    if (oldXp < milestone.xp && newXp >= milestone.xp) {
      // Check if user doesn't already have this achievement
      if (!user.achievements.includes(milestone.name)) {
        user.achievements.push(milestone.name)
        newAchievements.push(milestone)
      }
    }
  }

  // Store new achievements temporarily for the response
  if (newAchievements.length > 0) {
    user.newAchievements = newAchievements.map((a) => a.name)
  }

  return newAchievements
}

/**
 * Get all available XP milestones
 * @returns {Array} Array of all XP milestone achievements
 */
const getAllMilestones = () => {
  return XP_MILESTONES
}

/**
 * Get user's progress towards next milestone
 * @param {Number} currentXp - User's current XP
 * @returns {Object} Progress information
 */
const getNextMilestone = (currentXp) => {
  const nextMilestone = XP_MILESTONES.find((m) => m.xp > currentXp)

  if (!nextMilestone) {
    return {
      completed: true,
      message: "All milestones completed!",
    }
  }

  const progress = (currentXp / nextMilestone.xp) * 100
  const remaining = nextMilestone.xp - currentXp

  return {
    milestone: nextMilestone,
    progress: Math.round(progress),
    remaining,
    completed: false,
  }
}

module.exports = {
  evaluateXpMilestones,
  getAllMilestones,
  getNextMilestone,
  XP_MILESTONES,
}
