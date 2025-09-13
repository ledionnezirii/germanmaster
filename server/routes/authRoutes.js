const express = require("express")
const {
  signup,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  verifyEmail
} = require("../controllers/authController")
const auth = require("../middleware/auth")
const { validateSignup, validateLogin } = require("../middleware/validation")

const router = express.Router()

router.post("/signup", validateSignup, signup)
router.post("/login", validateLogin, login)
router.get("/me", auth, getMe)

// Password reset routes
router.post("/forgot-password", forgotPassword)
router.post("/reset-password/:token", resetPassword)

// Email verification route
router.get("/verify/:token", verifyEmail)

module.exports = router
