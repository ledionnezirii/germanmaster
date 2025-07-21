const User = require("../models/User")
const { generateToken } = require("../utils/generateToken")
const { ApiError } = require("../utils/ApiError")
const { ApiResponse } = require("../utils/ApiResponse")
const { asyncHandler } = require("../utils/asyncHandler")

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
    // Generate token - NOW PASSING user.emri
    const token = generateToken(user._id, user.emri)
    try {
      // Update streak on first login (signup)
      await user.updateStreakOnLogin()
    } catch (error) {
      console.error("Error updating streak on signup:", error)
    }
    res.status(201).json(
      new ApiResponse(
        201,
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
            streakCount: user.streakCount || 0,
            // Profile picture might not be set on signup, so no need to include it here
          },
        },
        "User registered successfully",
      ),
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
  // Generate token - NOW PASSING user.emri
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
          profilePicture: fullProfilePictureUrl, // Send full URL on login
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

module.exports = {
  signup,
  login,
  getMe,
}
