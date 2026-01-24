const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        // Subscription notifications
        "subscription_purchased",
        "subscription_cancelled",
        "subscription_expiring_10days",
        "subscription_expiring_7days",
        "subscription_expiring_4days",
        "subscription_expiring_2days",
        "subscription_expired",
        // Limit notifications
        "grammar_limit_reached",
        "phrase_limit_reached",
        "dictionary_limit_reached",
        // XP milestone notifications
        "xp_milestone_100",
        "xp_milestone_500",
        "xp_milestone_1000",
        "xp_milestone_2000",
        "xp_milestone_5000",
        "xp_milestone_10000",
        // Achievement notifications
        "achievement_unlocked",
        // General
        "custom",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      default: "bell",
    },
    color: {
      type: String,
      enum: ["info", "success", "warning", "error"],
      default: "info",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    link: {
      type: String,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);