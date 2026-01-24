const cron = require("node-cron");
const User = require("../models/User");
const { notifySubscriptionExpiring } = require("../controllers/notificationController");

// Run daily at 9:00 AM
cron.schedule("0 9 * * *", async () => {
  console.log("Checking subscription expiry dates...");
  
  const now = new Date();
  const users = await User.find({ isPaid: true, subscriptionExpiresAt: { $gt: now } });
  
  for (const user of users) {
    const daysRemaining = Math.ceil((new Date(user.subscriptionExpiresAt) - now) / (1000 * 60 * 60 * 24));
    
    if ([10, 7, 4, 2].includes(daysRemaining)) {
      await notifySubscriptionExpiring(user._id, daysRemaining);
    }
  }
});