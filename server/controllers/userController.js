const User = require("../models/User");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const { asyncHandler } = require("../utils/asyncHandler");
const achievementsService = require("../services/achievementsService");
const { addUserXp } = require("./xpController");
// </CHANGE>

const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)
    .populate("listenTestsPassed", "title level")
    .populate("passedTranslatedTexts", "title level");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const avatarUrl = `https://api.dicebear.com/7.x/${user.avatarStyle}/svg?seed=${user._id}`;

  res.json(
    new ApiResponse(200, {
      id: user._id,
      firstName: user.emri,
      lastName: user.mbiemri,
      email: user.email,
      avatar: avatarUrl,
      avatarStyle: user.avatarStyle,
      xp: user.xp,
      level: user.level,
      studyHours: user.studyHours,
      completedTests: user.completedTests,
      achievements: user.achievements,
      newAchievements: user.newAchievements || [],
      listenTestsPassed: user.listenTestsPassed,
      passedTranslatedTexts: user.passedTranslatedTexts,
      isPaid: user.isPaid,
      lastLogin: user.lastLogin,
      streakCount: user.streakCount,
    })
  );
});

const getUserXp = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  res.json(
    new ApiResponse(200, {
      xp: user.xp,
      level: user.level,
    })
  );
});

const updateStudyHours = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.studyHours += req.body.hours || 0;
  await user.save();

  res.json(
    new ApiResponse(200, {
      studyHours: user.studyHours,
      message: "Study hours updated successfully",
    })
  );
});

const updateAvatarStyle = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.avatarStyle = req.body.avatarStyle;
  await user.save();

  res.json(
    new ApiResponse(200, {
      avatarStyle: user.avatarStyle,
      message: "Avatar style updated successfully",
    })
  );
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.emri = req.body.firstName || user.emri;
  user.mbiemri = req.body.lastName || user.mbiemri;
  await user.save();

  res.json(
    new ApiResponse(200, {
      firstName: user.emri,
      lastName: user.mbiemri,
      message: "Profile updated successfully",
    })
  );
});

const addXp = asyncHandler(async (req, res) => {
  const xpAmount = req.body.xp || 0;
  
  if (xpAmount <= 0) {
    throw new ApiError(400, "XP amount must be greater than 0");
  }

  const result = await addUserXp(req.user.id, xpAmount);
  
  // Calculate new level based on total XP
  const user = await User.findById(req.user.id);
  user.level = Math.floor(user.xp / 1000) + 1;
  await user.save();

  res.json(
    new ApiResponse(200, {
      xp: result.totalXp,
      weeklyXp: result.weeklyXp,
      monthlyXp: result.monthlyXp,
      level: user.level,
      message: "XP added successfully",
    })
  );
  // </CHANGE>
});

const updateStreak = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastLogin = user.lastLogin ? new Date(user.lastLogin) : null;
  let lastLoginDate = null;

  if (lastLogin) {
    lastLoginDate = new Date(lastLogin);
    lastLoginDate.setHours(0, 0, 0, 0);
  }

  const todayTime = today.getTime();
  const lastLoginTime = lastLoginDate ? lastLoginDate.getTime() : null;
  const daysDifference = lastLoginTime ? (todayTime - lastLoginTime) / (1000 * 60 * 60 * 24) : null;

  let message = "";

  // First time login or no previous login - start streak at 1
  if (!lastLoginTime || daysDifference === null) {
    user.streakCount = 1;
    message = "Streak started!";
  }
  // Logged in yesterday - increment streak
  else if (daysDifference === 1) {
    user.streakCount += 1;
    message = "Streak incremented!";
  }
  // Already logged in today - no change to streak
  else if (daysDifference === 0) {
    message = "Already logged in today";
  }
  // Missed days - reset streak to 1
  else if (daysDifference > 1) {
    user.streakCount = 1;
    message = "Streak reset to 1";
  }

  user.lastLogin = new Date();
  await user.save();

  res.json(
    new ApiResponse(200, {
      streakCount: user.streakCount,
      lastLogin: user.lastLogin,
      message,
    })
  );
});

module.exports = {
  getProfile,
  getUserXp,
  updateStudyHours,
  updateAvatarStyle,
  updateProfile,
  addXp,
  updateStreak,
};
