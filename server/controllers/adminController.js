

const User = require("../models/User");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const { asyncHandler } = require("../utils/asyncHandler");

// Funksioni për përditësimin e statusit të adminit
const updateAdminStatus = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId, // ID-ja e përdoruesit që do të bëhet admin
      { role: 'admin' }, // Përditësojmë rolin në admin
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'Përdoruesi nuk u gjet.' });
    }

    res.status(200).json({ message: 'Përdoruesi është bërë admin', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ka ndodhur një gabim.' });
  }
};

// Get all users with pagination
const getAllUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const search = req.query.search || "";
  const skip = (page - 1) * limit;

  const query = search
    ? {
        $or: [
          { emri: { $regex: search, $options: "i" } },
          { mbiemri: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(query),
  ]);

  res.json(
    new ApiResponse(200, {
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  );
});

// Get paid/subscribed users
const getPaidUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const query = { isPaid: true };

  const [users, total] = await Promise.all([
    User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(query),
  ]);

  res.json(
    new ApiResponse(200, {
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  );
});

// Get online users (requires socket.io tracking - see notes below)
const getOnlineUsers = asyncHandler(async (req, res) => {
  // This requires access to your socket.io instance
  // You'll need to pass the io instance or use a shared store
  const io = req.app.get("io");
  const onlineUserIds = req.app.get("onlineUsers") || new Map();

  const userIds = Array.from(onlineUserIds.keys());

  const users = await User.find({ _id: { $in: userIds } }).select("-password");

  res.json(
    new ApiResponse(200, {
      users,
      count: users.length,
    })
  );
});
const getDashboardStats = asyncHandler(async (req, res) => {
  const Payment = require("../models/Payment");

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const revenueMatch = { status: { $in: ["active", "completed", "past_due"] } };

  const [
    totalUsers,
    paidUsers,
    freeUsers,
    newUsersToday,
    activeSubscriptions,
    revenueThisMonth,
    revenuePrevMonth,
    revenueTotal,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isPaid: true }),
    User.countDocuments({ isPaid: false }),
    User.countDocuments({ createdAt: { $gte: todayStart } }),
    User.countDocuments({ isPaid: true, subscriptionExpiresAt: { $gt: new Date() } }),

    Payment.aggregate([
      { $match: { ...revenueMatch, createdAt: { $gte: thisMonthStart } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),

    Payment.aggregate([
      { $match: { ...revenueMatch, createdAt: { $gte: prevMonthStart, $lte: prevMonthEnd } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),

    Payment.aggregate([
      { $match: revenueMatch },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);

  const onlineUserIds = req.app.get("onlineUsers") || new Map();
  const onlineCount = onlineUserIds.size;

  const subscriptionBreakdown = await User.aggregate([
    { $match: { isPaid: true } },
    { $group: { _id: "$subscriptionType", count: { $sum: 1 } } },
  ]);

  res.json(
    new ApiResponse(200, {
      totalUsers,
      paidUsers,
      freeUsers,
      newUsersToday,
      activeSubscriptions,
      onlineCount,
      subscriptionBreakdown,
      revenue: {
        thisMonth: revenueThisMonth[0]?.total || 0,
        prevMonth: revenuePrevMonth[0]?.total || 0,
        total:     revenueTotal[0]?.total     || 0,
      },
    })
  );
});
// Update user role
const updateUserRole = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;

  if (!["user", "admin", "academyAdmin"].includes(role)) {
    throw new ApiError(400, "Invalid role");
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { role },
    { new: true }
  ).select("-password");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  res.json(new ApiResponse(200, { user, message: "Role updated successfully" }));
});

// Delete user
const deleteUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findByIdAndDelete(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  res.json(new ApiResponse(200, { message: "User deleted successfully" }));
});

// Toggle user active status
const toggleUserStatus = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.isActive = !user.isActive;
  await user.save();

  res.json(
    new ApiResponse(200, {
      isActive: user.isActive,
      message: `User ${user.isActive ? "activated" : "deactivated"} successfully`,
    })
  );
});

// Daily visitor stats — counts unique users who logged in / created a session each day
const getVisitorStats = asyncHandler(async (req, res) => {
  const Session = require("../models/Session");
  const days = Math.min(parseInt(req.query.days) || 30, 90);

  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  since.setHours(0, 0, 0, 0);

  // Group sessions by calendar day, count distinct users per day
  const raw = await Session.aggregate([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: {
          year:  { $year:       "$createdAt" },
          month: { $month:      "$createdAt" },
          day:   { $dayOfMonth: "$createdAt" },
          userId: "$userId",           // one entry per user per day
        },
      },
    },
    {
      $group: {
        _id: { year: "$_id.year", month: "$_id.month", day: "$_id.day" },
        visitors: { $sum: 1 },         // count unique users
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
  ]);

  // Fill in missing days with 0 so the chart always has `days` points
  const map = {};
  for (const r of raw) {
    const key = `${r._id.year}-${String(r._id.month).padStart(2,"0")}-${String(r._id.day).padStart(2,"0")}`;
    map[key] = r.visitors;
  }

  const result = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    result.push({ date: key, visitors: map[key] || 0 });
  }

  const total  = result.reduce((s, r) => s + r.visitors, 0);
  const today  = result[result.length - 1]?.visitors || 0;

  res.json(new ApiResponse(200, { data: result, total, today }));
});

// Users who visited on a specific date
const getVisitorsByDate = asyncHandler(async (req, res) => {
  const Session = require("../models/Session");
  const { date } = req.query; // YYYY-MM-DD
  if (!date) return res.status(400).json(new ApiResponse(400, null, "date param required"));

  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  // Unique userIds who had a session that day
  const rows = await Session.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end } } },
    { $group: { _id: "$userId" } },
  ]);

  const userIds = rows.map((r) => r._id);
  const users = await User.find({ _id: { $in: userIds } })
    .select("emri mbiemri email isPaid xp avatarStyle")
    .lean();

  res.json(new ApiResponse(200, { users, count: users.length }));
});

module.exports = {
  getAllUsers,
  getPaidUsers,
  getOnlineUsers,
  getDashboardStats,
  getVisitorStats,
  getVisitorsByDate,
  updateUserRole,
  deleteUser,
  toggleUserStatus,
  updateAdminStatus
};

