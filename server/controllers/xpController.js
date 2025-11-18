const User = require("../models/User");

// Helper function to get the start of the current week (Monday)
const getWeekStart = () => {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

// Helper function to get the start of the current month
const getMonthStart = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
};

// Add XP to user and handle weekly/monthly resets
exports.addUserXp = async (userId, xpAmount) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const currentWeekStart = getWeekStart();
    const currentMonthStart = getMonthStart();

    // Check if we need to reset weekly XP
    if (!user.weekStartDate || user.weekStartDate < currentWeekStart) {
      user.weeklyXp = 0;
      user.weekStartDate = currentWeekStart;
    }

    // Check if we need to reset monthly XP
    if (!user.monthStartDate || user.monthStartDate < currentMonthStart) {
      user.monthlyXp = 0;
      user.monthStartDate = currentMonthStart;
    }

    // Add XP to all tracking fields
    user.xp += xpAmount;
    user.weeklyXp += xpAmount;
    user.monthlyXp += xpAmount;

    await user.save();

    return {
      totalXp: user.xp,
      weeklyXp: user.weeklyXp,
      monthlyXp: user.monthlyXp,
    };
  } catch (error) {
    console.error("Error adding XP:", error);
    throw error;
  }
};

// Reset weekly XP for all users (can be called via cron job)
exports.resetWeeklyXp = async () => {
  try {
    const currentWeekStart = getWeekStart();
    await User.updateMany(
      { weekStartDate: { $lt: currentWeekStart } },
      { weeklyXp: 0, weekStartDate: currentWeekStart }
    );
    console.log("Weekly XP reset completed");
  } catch (error) {
    console.error("Error resetting weekly XP:", error);
    throw error;
  }
};

// Reset monthly XP for all users (can be called via cron job)
exports.resetMonthlyXp = async () => {
  try {
    const currentMonthStart = getMonthStart();
    await User.updateMany(
      { monthStartDate: { $lt: currentMonthStart } },
      { monthlyXp: 0, monthStartDate: currentMonthStart }
    );
    console.log("Monthly XP reset completed");
  } catch (error) {
    console.error("Error resetting monthly XP:", error);
    throw error;
  }
};

module.exports = {
  addUserXp: exports.addUserXp,
  resetWeeklyXp: exports.resetWeeklyXp,
  resetMonthlyXp: exports.resetMonthlyXp,
};
