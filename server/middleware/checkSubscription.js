const User = require("../models/User")
const { ApiError } = require("../utils/ApiError")
const { asyncHandler } = require("../utils/asyncHandler")

// Middleware to check if user's subscription is active
const checkSubscription = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id)

  if (!user) {
    throw new ApiError(404, "User not found")
  }

  const now = new Date()

  // Check if subscription has expired
  if (user.subscriptionExpiresAt && user.subscriptionExpiresAt < now) {
    return res.status(403).json({
      success: false,
      message: "Your free trial has expired. Please subscribe to continue.",
      code: "SUBSCRIPTION_EXPIRED",
      data: {
        subscriptionType: user.subscriptionType,
        expiresAt: user.subscriptionExpiresAt,
        trialStartedAt: user.trialStartedAt,
      },
    })
  }

  // User has active subscription or trial
  next()
})

module.exports = { checkSubscription }
