const User = require("../models/User")
const { ApiError } = require("../utils/ApiError")
const { ApiResponse } = require("../utils/ApiResponse")
const { asyncHandler } = require("../utils/asyncHandler")
const achievementsService = require("../services/achievementsService") // Assuming achievementsService is required

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
  const user = await User.findById(req.user.id).select("xp")
  if (!user) {
    throw new ApiError(404, "User not found")
  }
  res.json(new ApiResponse(200, { xp: user.xp }))
})

const updateStudyHours = asyncHandler(async (req, res) => {
  const { hours } = req.body
  if (typeof hours !== "number" || hours <= 0) {
    throw new ApiError(400, "Hours must be a positive number")
  }
  const user = await User.findById(req.user.id)
  if (!user) {
    throw new ApiError(404, "User not found")
  }
  user.studyHours += hours
  await user.save()
  res.json(
    new ApiResponse(
      200,
      {
        studyHours: user.studyHours,
        level: user.level,
      },
      "Study hours updated successfully",
    ),
  )
})

const updateAvatarStyle = asyncHandler(async (req, res) => {
  const { avatarStyle } = req.body;

  if (!avatarStyle || typeof avatarStyle !== "string") {
    throw new ApiError(400, "Avatar style is required and must be a string");
  }


  const user = await User.findById(req.user.id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.lastAvatarChangeDate) {
    const now = new Date();
    const lastChange = new Date(user.lastAvatarChangeDate);
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

    if (lastChange > oneMinuteAgo) {
      const nextChangeDate = new Date(lastChange.getTime() + 60 * 1000);
      const secondsRemaining = Math.ceil((nextChangeDate - now) / 1000);
      throw new ApiError(
        429,
        `You can change your avatar again in ${secondsRemaining} seconds. Last changed: ${lastChange.toLocaleString()}`
      );
    }
  }

  user.avatarStyle = avatarStyle;
  user.lastAvatarChangeDate = new Date();
  await user.save();

  const avatarUrl = `https://api.dicebear.com/7.x/${user.avatarStyle}/svg?seed=${user._id}`;

  res.json(
    new ApiResponse(
      200,
      { 
        avatar: avatarUrl,
        avatarStyle: user.avatarStyle,
        lastAvatarChangeDate: user.lastAvatarChangeDate,
        nextAvailableChange: new Date(user.lastAvatarChangeDate.getTime() + 60 * 1000)
      },
      "Avatar style updated successfully"
    )
  );
});


const updateProfile = asyncHandler(async (req, res) => {
  const { emri, mbiemri } = req.body
  const user = await User.findById(req.user.id)
  if (!user) {
    throw new ApiError(404, "User not found")
  }
  if (emri) user.emri = emri
  if (mbiemri) user.mbiemri = mbiemri
  await user.save()
  res.json(
    new ApiResponse(
      200,
      {
        firstName: user.emri,
        lastName: user.mbiemri,
        email: user.email,
      },
      "Profile updated successfully",
    ),
  )
})

const addXp = asyncHandler(async (req, res) => {
  const { xp, reason } = req.body;
  if (typeof xp !== "number" || xp <= 0) {
    throw new ApiError(400, "XP must be a positive number");
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const newAchievements = await achievementsService.evaluateXpMilestones(user, xp);

  res.json(
    new ApiResponse(
      200,
      {
        xp: user.xp,
        level: user.level,
        achievements: user.achievements,
        newAchievements,
        reason: reason || "XP added",
      },
      newAchievements.length
        ? `Congratulations! You earned new achievements: ${newAchievements.map(a => a.name).join(", ")}`
        : "XP added successfully"
    )
  );
});

module.exports = {
  getProfile,
  getUserXp,
  updateStudyHours,
  updateAvatarStyle,
  updateProfile,
  addXp,
}
