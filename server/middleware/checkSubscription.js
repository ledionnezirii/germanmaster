const User = require("../models/User");

const checkSubscription = async (req, res, next) => {
  try {
    // Skip for non-protected routes
    if (!req.user) {
      return next();
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return next();
    }

    const now = new Date();
    const expiresAt = user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt) : null;

    // Check if subscription has expired
    if (expiresAt && expiresAt < now) {
      console.log(`[Subscription Check] User ${user._id} subscription expired at ${expiresAt}`);
      
      // If user was paid but subscription expired, revoke access
      if (user.isPaid) {
        console.log(`[Subscription Check] Revoking access for user ${user._id}`);
        user.isPaid = false;
        user.isActive = false;
        user.subscriptionCancelled = false; // Reset cancelled flag
        await user.save();
      }
    }

    // Attach fresh subscription status to request
    req.subscriptionStatus = {
      active: user.isPaid && expiresAt && expiresAt > now,
      expired: !expiresAt || expiresAt < now,
      expiresAt: expiresAt,
      cancelled: user.subscriptionCancelled || false,
    };

    next();
  } catch (error) {
    console.error("[Subscription Check] Error:", error);
    next(); // Don't block request on error
  }
};

module.exports = checkSubscription;