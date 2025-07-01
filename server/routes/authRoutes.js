const express = require("express")
const { signup, login, getMe } = require("../controllers/authController")
const  auth  = require("../middleware/auth")
const { validateSignup, validateLogin } = require("../middleware/validation")

const router = express.Router()


router.post("/signup", validateSignup, signup)
router.post("/login", validateLogin, login)
router.get("/me", auth, getMe)

module.exports = router
