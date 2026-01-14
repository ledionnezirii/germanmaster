const User = require("../models/User");
const Payment = require("../models/Payment");

/**
 * Checks all users and revokes access if subscription has expired
 * Should be run periodically (every hour or every 15 minutes)
 */
const checkExpiredSubscriptions = async () => {
  try {
    console.log("[Subscription Checker] Starting expired subscription check...");
    
    const now = new Date();
    
    // Find all users who:
    // 1. Have isPaid = true
    // 2. But their subscriptionExpiresAt has passed
    const expiredUsers = await User.find({
      isPaid: true,
      subscriptionExpiresAt: { $lte: now }
    });

    console.log(`[Subscription Checker] Found ${expiredUsers.length} expired subscriptions`);

    for (const user of expiredUsers) {
      console.log(`[Subscription Checker] Revoking access for user ${user._id} (${user.email})`);
      console.log(`[Subscription Checker] - Expired at: ${user.subscriptionExpiresAt}`);
      
      user.isPaid = false;
      user.isActive = false;
      user.subscriptionCancelled = false; // Reset cancelled flag
      await user.save();

      // Also update the Payment record status
      await Payment.updateMany(
        {
          userId: user._id,
          status: "active",
          expiresAt: { $lte: now }
        },
        {
          $set: { status: "cancelled" }
        }
      );
    }

    console.log("[Subscription Checker] Finished checking expired subscriptions");
    return expiredUsers.length;
  } catch (error) {
    console.error("[Subscription Checker] Error:", error);
    throw error;
  }
};

module.exports =  checkExpiredSubscriptions;