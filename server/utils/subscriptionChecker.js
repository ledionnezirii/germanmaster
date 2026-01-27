const User = require("../models/User");
const Payment = require("../models/Payment");

/**
 * ✅ CRON JOB: Checks all users and revokes access if subscription has expired
 * Run this every hour via node-cron or a scheduler
 */
const checkExpiredSubscriptions = async () => {
  try {
    console.log("[Subscription Checker] Starting expired subscription check...");
    
    const now = new Date();
    
    // Find all users who have isPaid = true BUT subscriptionExpiresAt has passed
    const expiredUsers = await User.find({
      isPaid: true,
      subscriptionExpiresAt: { $lt: now }
    });

    console.log(`[Subscription Checker] Found ${expiredUsers.length} expired subscriptions`);

    for (const user of expiredUsers) {
      console.log(`[Subscription Checker] Revoking access for user ${user._id} (${user.email})`);
      console.log(`[Subscription Checker] - Expired at: ${user.subscriptionExpiresAt}`);
      
      // Revoke access
      user.isPaid = false;
      user.isActive = false;
      user.subscriptionCancelled = false; // Reset cancelled flag
      user.subscriptionType = null; // Clear subscription type
      await user.save();

      // Update Payment records to 'expired'
      await Payment.updateMany(
        {
          userId: user._id,
          status: "active",
          expiresAt: { $lte: now }
        },
        {
          $set: { status: "expired" }
        }
      );
    }

    console.log(`[Subscription Checker] ✅ Finished. Revoked ${expiredUsers.length} subscriptions.`);
    return expiredUsers.length;
  } catch (error) {
    console.error("[Subscription Checker] ❌ Error:", error);
    throw error;
  }
};

module.exports = checkExpiredSubscriptions;