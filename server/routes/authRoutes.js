const express = require("express")
const { signup, login, getMe, forgotPassword, resetPassword, verifyEmail } = require("../controllers/authController")
const  protect  = require("../middleware/auth")

const router = express.Router()

router.post("/signup", signup)
router.post("/login", login)
router.get("/me", protect, getMe)
router.post("/forgot-password", forgotPassword)
router.post("/reset-password/:token", resetPassword)
router.get("/verify/:token", verifyEmail)

module.exports = router
