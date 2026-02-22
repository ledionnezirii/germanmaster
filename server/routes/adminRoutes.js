

const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getPaidUsers,
  getOnlineUsers,
  getDashboardStats,
  updateUserRole,
  deleteUser,
  toggleUserStatus,
  updateAdminStatus
} = require("../controllers/adminController");
const protect = require("../middleware/auth");
const isAdmin = require('../middleware/isAdmin');      // Middleware për kontrollin e adminit


// Admin middleware
const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admin only." });
  }
  next();
};

// All routes require authentication + admin role
router.use(protect, adminOnly);

router.put('/updateAdmin/:userId', isAdmin, updateAdminStatus);


router.get("/stats", getDashboardStats);
router.get("/users", getAllUsers);
router.get("/users/paid", getPaidUsers);
router.get("/users/online", getOnlineUsers);
router.put("/users/:userId/role", updateUserRole);
router.put("/users/:userId/toggle-status", toggleUserStatus);
router.delete("/users/:userId", deleteUser);

module.exports = router;
