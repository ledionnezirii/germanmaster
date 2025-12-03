const User = require("../models/User");
const { ApiError } = require("../utils/ApiError");
const { asyncHandler } = require("../utils/asyncHandler");

// Middleware to check if user has active subscription
const checkSubscription = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const now = new Date();

  // Admin users always have access
  if (user.role === "admin") {
    return next();
  }

  // Check if subscription is active
  if (user.subscriptionExpiresAt && user.subscriptionExpiresAt > now) {
    // Subscription is active
    return next();
  }

  // Subscription expired
  throw new ApiError(403, "Your subscription has expired. Please renew to continue.");
});

// Middleware to check if free trial is active
const checkTrialStatus = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const now = new Date();

  // Admin users always have access
  if (user.role === "admin") {
    req.isTrialExpired = false;
    req.isSubscriptionActive = true;
    return next();
  }

  // Check trial expiration
  if (user.subscriptionType === "free_trial") {
    if (user.subscriptionExpiresAt && user.subscriptionExpiresAt < now) {
      req.isTrialExpired = true;
      req.isSubscriptionActive = false;
    } else {
      req.isTrialExpired = false;
      req.isSubscriptionActive = true;
    }
  } else if (user.isPaid && user.subscriptionExpiresAt && user.subscriptionExpiresAt > now) {
    req.isTrialExpired = false;
    req.isSubscriptionActive = true;
  } else {
    req.isTrialExpired = true;
    req.isSubscriptionActive = false;
  }

  next();
});

module.exports = {
  checkSubscription,
  checkTrialStatus,
};