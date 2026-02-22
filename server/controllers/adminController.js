

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

// Get admin dashboard stats
const getDashboardStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const todayStart = new Date(now.setHours(0, 0, 0, 0));

  const [
    totalUsers,
    paidUsers,
    freeUsers,
    newUsersToday,
    activeSubscriptions,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isPaid: true }),
    User.countDocuments({ isPaid: false }),
    User.countDocuments({ createdAt: { $gte: todayStart } }),
    User.countDocuments({
      isPaid: true,
      subscriptionExpiresAt: { $gt: new Date() },
    }),
  ]);

  // Online count from socket
  const onlineUserIds = req.app.get("onlineUsers") || new Map();
  const onlineCount = onlineUserIds.size;

  // Subscription type breakdown
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

module.exports = {
  getAllUsers,
  getPaidUsers,
  getOnlineUsers,
  getDashboardStats,
  updateUserRole,
  deleteUser,
  toggleUserStatus,
  updateAdminStatus
};

