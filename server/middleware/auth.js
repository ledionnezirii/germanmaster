const jwt = require("jsonwebtoken")
const { ApiError } = require("../utils/ApiError")
const { asyncHandler } = require("../utils/asyncHandler")
const User = require("../models/User")
const Session = require("../models/Session")

const protect = asyncHandler(async (req, res, next) => {
  let token

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1]
  }

  if (!token) {
    throw new ApiError(401, "Not authorized, no token")
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const session = await Session.findOne({
      token,
      userId: decoded.id,
      isActive: true,
    })

    if (!session) {
      throw new ApiError(401, "Session expired or invalid. Please login again.")
    }

    // Check if session is expired
    if (session.isExpired()) {
      session.isActive = false
      await session.save()
      throw new ApiError(401, "Session expired. Please login again.")
    }

    // Update last activity
    session.lastActivity = new Date()
    await session.save()

    // Get user from token
    req.user = await User.findById(decoded.id).select("-password")

    if (!req.user) {
      throw new ApiError(401, "User not found")
    }

    next()
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError(401, "Not authorized, token failed")
  }
})

module.exports = protect
