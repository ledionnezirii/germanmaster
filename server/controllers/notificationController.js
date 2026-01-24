const Notification = require("../models/Notification");
const User = require("../models/User");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const { asyncHandler } = require("../utils/asyncHandler");

// @desc    Create a notification
// @route   POST /api/notifications
// @access  Private
const createNotification = async (userId, type, title, message, options = {}) => {
  try {
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      icon: options.icon || "bell",
      color: options.color || "info",
      link: options.link || null,
      metadata: options.metadata || {},
    });

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 20, unreadOnly = false } = req.query;

  const query = { userId };
  if (unreadOnly === "true") {
    query.isRead = false;
  }

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Notification.countDocuments(query);
  const unreadCount = await Notification.countDocuments({ userId, isRead: false });

  res.json(
    new ApiResponse(200, {
      notifications,
      unreadCount,
      pagination: {
        currentPage: Number.parseInt(page),
        totalPages: Math.ceil(total / limit),
        total,
      },
    })
  );
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  res.json(new ApiResponse(200, notification, "Notification marked as read"));
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { userId: req.user.id, isRead: false },
    { isRead: true }
  );

  res.json(new ApiResponse(200, null, "All notifications marked as read"));
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    userId: req.user.id,
  });

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  res.json(new ApiResponse(200, null, "Notification deleted"));
});

// @desc    Get unread count
// @route   GET /api/notifications/unread-count
// @access  Private
const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({
    userId: req.user.id,
    isRead: false,
  });

  res.json(new ApiResponse(200, { count }));
});

// ===============================
// NOTIFICATION TRIGGER FUNCTIONS
// ===============================

// Subscription notifications
const notifySubscriptionPurchased = async (userId, subscriptionType) => {
  return await createNotification(
    userId,
    "subscription_purchased",
    "🎉 Abonimi u Aktivizua!",
    `Abonimi juaj ${subscriptionType} u aktivizua me sukses. Gëzoni të gjitha veçoritë premium!`,
    {
      icon: "check-circle",
      color: "success",
      link: "/payments",
      metadata: { subscriptionType },
    }
  );
};

const notifySubscriptionCancelled = async (userId) => {
  return await createNotification(
    userId,
    "subscription_cancelled",
    "⚠️ Abonimi u Anulua",
    "Abonimi juaj u anulua. Do të keni akses deri në përfundimin e periudhës së paguar.",
    {
      icon: "alert-triangle",
      color: "warning",
      link: "/payments",
    }
  );
};

const notifySubscriptionExpiring = async (userId, daysRemaining) => {
  const typeMap = {
    10: "subscription_expiring_10days",
    7: "subscription_expiring_7days",
    4: "subscription_expiring_4days",
    2: "subscription_expiring_2days",
  };

  return await createNotification(
    userId,
    typeMap[daysRemaining],
    `⏰ Abonimi Skadon Pas ${daysRemaining} Ditësh`,
    `Abonimi juaj do të skadojë pas ${daysRemaining} ditësh. Rinojoni për të vazhduar me veçoritë premium!`,
    {
      icon: "clock",
      color: "warning",
      link: "/payments",
      metadata: { daysRemaining },
    }
  );
};

const notifySubscriptionExpired = async (userId) => {
  return await createNotification(
    userId,
    "subscription_expired",
    "❌ Abonimi Ka Skaduar",
    "Abonimi juaj ka skaduar. Rinojoni për të vazhduar të mësoni pa kufizime!",
    {
      icon: "x-circle",
      color: "error",
      link: "/payments",
    }
  );
};

// Limit notifications
const notifyGrammarLimitReached = async (userId) => {
  return await createNotification(
    userId,
    "grammar_limit_reached",
    "📚 Limit Ditor i Gramatikës",
    "Keni arritur limitin ditor prej 2 temash gramatike. Provoni përsëri nesër në ora 00:01!",
    {
      icon: "book",
      color: "warning",
      link: "/grammar",
    }
  );
};

const notifyPhraseLimitReached = async (userId) => {
  return await createNotification(
    userId,
    "phrase_limit_reached",
    "💬 Limit Ditor i Frazave",
    "Keni arritur limitin ditor prej 10 frazave. Provoni përsëri nesër në ora 00:01!",
    {
      icon: "message-circle",
      color: "warning",
      link: "/phrases",
    }
  );
};

const notifyDictionaryLimitReached = async (userId) => {
  return await createNotification(
    userId,
    "dictionary_limit_reached",
    "📖 Limit Ditor i Fjalorit",
    "Keni arritur limitin ditor prej 15 fjalëve. Provoni përsëri nesër në ora 00:01!",
    {
      icon: "book-open",
      color: "warning",
      link: "/dictionary",
    }
  );
};

// XP milestone notifications
const notifyXpMilestone = async (userId, xpAmount) => {
  const milestones = {
    100: { type: "xp_milestone_100", emoji: "🌟" },
    500: { type: "xp_milestone_500", emoji: "⭐" },
    1000: { type: "xp_milestone_1000", emoji: "💫" },
    2000: { type: "xp_milestone_2000", emoji: "✨" },
    5000: { type: "xp_milestone_5000", emoji: "🏆" },
    10000: { type: "xp_milestone_10000", emoji: "👑" },
  };

  const milestone = milestones[xpAmount];
  if (!milestone) return;

  return await createNotification(
    userId,
    milestone.type,
    `${milestone.emoji} ${xpAmount} XP Arritje!`,
    `Urime! Keni arritur ${xpAmount} XP. Vazhdoni punën e shkëlqyer!`,
    {
      icon: "trophy",
      color: "success",
      link: "/profile",
      metadata: { xpAmount },
    }
  );
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  createNotification,
  // Export trigger functions
  notifySubscriptionPurchased,
  notifySubscriptionCancelled,
  notifySubscriptionExpiring,
  notifySubscriptionExpired,
  notifyGrammarLimitReached,
  notifyPhraseLimitReached,
  notifyDictionaryLimitReached,
  notifyXpMilestone,
};