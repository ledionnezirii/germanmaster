const express = require("express")
const {
  signup,
  login,
  logout,
  getActiveSessions,
  logoutFromDevice,
  getMe,
  forgotPassword,
  resetPassword,
  verifyEmail,
} = require("../controllers/authController")
const protect = require("../middleware/auth")

const router = express.Router()

router.post("/signup", signup)
router.post("/login", login)
router.post("/logout", protect, logout) // Added logout route
router.get("/sessions", protect, getActiveSessions) // Added get sessions route
router.delete("/sessions/:sessionId", protect, logoutFromDevice) // Added logout from device route
router.get("/me", protect, getMe)
router.post("/forgot-password", forgotPassword)
router.post("/reset-password/:token", resetPassword)
router.get("/verify/:token", verifyEmail)

// Additional routes can be added here if necessary

module.exports = router