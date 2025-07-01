const User = require("../models/User")
const { generateToken } = require("../utils/generateToken");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const { asyncHandler } = require("../utils/asyncHandler");


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

  // Determine role (admin check)
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
    // Generate token
    const token = generateToken(user._id)

    // Update last login
    await user.updateLastLogin()

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
          },
        },
        "User registered successfully",
      ),
    )
  } else {
    throw new ApiError(400, "Invalid user data")
  }
})

// @desc    Authenticate user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  // Check for user and include password
  const user = await User.findOne({ email }).select("+password")

  if (!user) {
    throw new ApiError(401, "Invalid credentials")
  }

  // Check if account is locked
  if (user.isLocked) {
    throw new ApiError(423, "Account temporarily locked due to too many failed login attempts")
  }

  // Check password
  const isMatch = await user.comparePassword(password)

  if (!isMatch) {
    await user.incLoginAttempts()
    throw new ApiError(401, "Invalid credentials")
  }

  // Generate token
  const token = generateToken(user._id)

  // Update last login
  await user.updateLastLogin()

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
          profilePicture: user.profilePicture,
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
        profilePicture: user.profilePicture,
        studyHours: user.studyHours,
        completedTests: user.completedTests,
        achievements: user.achievements,
      },
    }),
  )
})

module.exports = {
  signup,
  login,
  getMe,
}
