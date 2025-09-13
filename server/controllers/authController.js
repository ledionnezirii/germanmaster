const User = require("../models/User")
const { generateToken } = require("../utils/generateToken")
const { ApiError } = require("../utils/ApiError")
const { ApiResponse } = require("../utils/ApiResponse")
const { asyncHandler } = require("../utils/asyncHandler")
const crypto = require("crypto")
const sendEmail = require("../utils/sendEmail")

// Helper function to construct the base URL for images
// This needs to be available in authController as well
const getBaseUrl = (req) => {
  const protocol = req.protocol || "http"
  const host = req.get("host") || `localhost:${process.env.PORT || 5000}` // Fallback to localhost:5000
  return `${protocol}://${host}`
}

// @desc    Register user
// @route   POST /api/auth/signup
// @access  Public
const signup = asyncHandler(async (req, res) => {
  const { emri, mbiemri, email, password } = req.body

  // Check if user exists
  const userExists = await User.findOne({ email })
  if (userExists) {
    throw new ApiError(400, "User already exists with this email")
  }

  // Set role (admin or user)
  const role = email === process.env.ADMIN_EMAIL ? "admin" : "user"

  // Create user
  const user = await User.create({
    emri,
    mbiemri,
    email,
    password,
    role,
  })

  if (user) {
    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString("hex")
    user.verificationToken = verificationToken
    user.verificationTokenExpires = Date.now() + 60 * 60 * 1000 // 1 hour
    await user.save({ validateBeforeSave: false })

    // Send verification email
    const verificationUrl = `${req.protocol}://${req.get("host")}/api/auth/verify/${verificationToken}`
    const message = `
      <h1>Email Verification</h1>
      <p>Hello ${user.emri},</p>
      <p>Please verify your email by clicking the link below:</p>
      <a href="${verificationUrl}" target="_blank">Verify Email</a>
    `
    await sendEmail({
      email: user.email,
      subject: "Verify your email",
      message,
    })

    // Optionally update streak on signup
    try {
      await user.updateStreakOnLogin()
    } catch (error) {
      console.error("Error updating streak on signup:", error)
    }

    // Respond without token yet, user must verify first
    res.status(201).json(
      new ApiResponse(
        201,
        {},
        "User registered successfully. Please check your email to verify your account."
      )
    )
  } else {
    throw new ApiError(400, "Invalid user data")
  }
})

// @desc    Authenticate user (Login)
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  // Find user and include password
  const user = await User.findOne({ email }).select("+password")
  if (!user) {
    throw new ApiError(401, "Invalid credentials")
  }

  // Check if user verified email
  if (!user.isVerified) {
    throw new ApiError(401, "Please verify your email before logging in")
  }

  // Check password
  const isMatch = await user.comparePassword(password)
  if (!isMatch) {
    throw new ApiError(401, "Invalid credentials")
  }

  try {
    // Update streak on login
    await user.updateStreakOnLogin()
  } catch (error) {
    console.error("Error updating streak on login:", error)
  }

  // Generate token
  const token = generateToken(user._id, user.emri)

  // Construct full profile picture URL for login response
  let fullProfilePictureUrl = null
  if (user.profilePicture) {
    fullProfilePictureUrl = `${getBaseUrl(req)}${user.profilePicture}`
  }

  res.json(
    new ApiResponse(
      200,
      {
        token,
        user: {
          id: user._id,
          emri: user.emri,
          mbiemri: user.mbiemri,
          email: user.email,
          role: user.role,
          xp: user.xp,
          level: user.level,
          profilePicture: fullProfilePictureUrl,
          streakCount: user.streakCount || 0,
        },
      },
      "Login successful",
    ),
  )
})

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)

  // Construct full profile picture URL for getMe response
  let fullProfilePictureUrl = null
  if (user.profilePicture) {
    fullProfilePictureUrl = `${getBaseUrl(req)}${user.profilePicture}`
  }

  res.json(
    new ApiResponse(200, {
      user: {
        id: user._id,
        emri: user.emri,
        mbiemri: user.mbiemri,
        email: user.email,
        role: user.role,
        xp: user.xp,
        level: user.level,
        profilePicture: fullProfilePictureUrl, // Send full URL here
        studyHours: user.studyHours,
        completedTests: user.completedTests,
        achievements: user.achievements,
        streakCount: user.streakCount || 0,
      },
    }),
  )
})
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body
  const user = await User.findOne({ email })

  if (!user) throw new ApiError(404, "User not found")

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString("hex")
  user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex")
  user.resetPasswordExpires = Date.now() + 60 * 60 * 1000 // 1 hour
  await user.save({ validateBeforeSave: false })

  // Send reset email
  const resetUrl = `${req.protocol}://${req.get("host")}/api/auth/reset-password/${resetToken}`
  const message = `
    <h1>Password Reset</h1>
    <p>Hello ${user.emri},</p>
    <p>You requested a password reset. Click the link below to set a new password:</p>
    <a href="${resetUrl}" target="_blank">Reset Password</a>
  `

  await sendEmail({
    email: user.email,
    subject: "Password Reset Request",
    message,
  })

  res.json(new ApiResponse(200, {}, "Password reset email sent"))
})
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params
  const { newPassword } = req.body

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex")

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  })

  if (!user) throw new ApiError(400, "Invalid or expired reset token")

  user.password = newPassword
  user.resetPasswordToken = undefined
  user.resetPasswordExpires = undefined
  await user.save()

  res.json(new ApiResponse(200, {}, "Password reset successfully"))
})
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params

  const user = await User.findOne({ verificationToken: token })
  if (!user) throw new ApiError(400, "Invalid or expired verification token")

  user.isVerified = true
  user.verificationToken = undefined
  await user.save()

  res.json(new ApiResponse(200, {}, "Email verified successfully"))
})




module.exports = {
  signup,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  verifyEmail
}
