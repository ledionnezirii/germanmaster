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
  resetPasswordWithCode,
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
router.post("/reset-password/:token", resetPassword) // Old method with token
router.post("/reset-password", resetPasswordWithCode) // New method with code
router.get("/verify/:token", verifyEmail) // Old method with token
router.post("/verify", verifyEmail) // New method with code

// Additional routes can be added here if necessary

module.exports = router
