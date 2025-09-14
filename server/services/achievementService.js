const User = require("../models/User");
const { ApiError } = require("../utils/ApiError");

const xpMilestones = [
  { xp: 100, achievement: "Reached 100 XP" },
  { xp: 200, achievement: "Reached 200 XP" },
  { xp: 300, achievement: "Reached 300 XP" },
  { xp: 400, achievement: "Reached 400 XP" },
  { xp: 500, achievement: "Reached 500 XP" },
  { xp: 1200, achievement: "Reached 1200 XP" },
  { xp: 1300, achievement: "Reached 1300 XP" },
];

// Adds a single achievement if not present
async function addAchievement(userId, achievementName) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");
  if (!user.achievements.includes(achievementName)) {
    user.achievements.push(achievementName);
    await user.save();
  }
  return user.achievements;
}

// Evaluates milestones based on XP added and awards achievements
async function evaluateXpMilestones(user, addedXp) {
  if (!user) throw new ApiError(404, "User not found");
  const oldXp = user.xp;
  const newXp = oldXp + addedXp;
  let newAchievements = [];

  for (const milestone of xpMilestones) {
    if (oldXp < milestone.xp && newXp >= milestone.xp) {
      if (!user.achievements.includes(milestone.achievement)) {
        user.achievements.push(milestone.achievement);
        newAchievements.push(milestone.achievement);
      }
    }
  }

  user.xp = newXp;
  await user.save();

  return newAchievements;
}

module.exports = {
  addAchievement,
  evaluateXpMilestones,
};
