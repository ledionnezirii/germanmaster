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

    // ============ CRITICAL FIX: CHECK SUBSCRIPTION EXPIRATION ============
    const now = new Date()
    const expiresAt = req.user.subscriptionExpiresAt ? new Date(req.user.subscriptionExpiresAt) : null

    // If subscription expired and user still has paid status, revoke access
    if (expiresAt && expiresAt <= now && req.user.isPaid) {
      console.log(`[Auth] User ${req.user._id} subscription expired at ${expiresAt}, revoking access`)
      req.user.isPaid = false
      req.user.isActive = false
      req.user.subscriptionCancelled = false // Reset cancelled flag after expiration
      await req.user.save()
      
      // Update the req.user object to reflect changes
      req.user = await User.findById(decoded.id).select("-password")
    }
    // ============ END OF FIX ============

    next()
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError(401, "Not authorized, token failed")
  }
})

module.exports = protect