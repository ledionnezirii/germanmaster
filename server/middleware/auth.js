const jwt = require("jsonwebtoken")
const { ApiError } = require("../utils/ApiError") // Assuming ApiError is defined
const { asyncHandler } = require("../utils/asyncHandler") // Assuming asyncHandler is defined
const User = require("../models/User") // Assuming User model is defined

const auth = asyncHandler(async (req, res, next) => {
  // If it's an OPTIONS request (preflight), just pass it to the next middleware.
  // The 'cors' middleware will handle the OPTIONS response.
  if (req.method === "OPTIONS") {
    return next()
  }

  let token

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1]

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET)

      // Attach user from the token
      req.user = await User.findById(decoded.id).select("-password")

      next()
    } catch (error) {
      console.error("Authentication error:", error.message)
      throw new ApiError(401, "Not authorized, token failed")
    }
  }

  if (!token) {
    throw new ApiError(401, "Not authorized, no token")
  }
})

module.exports = auth
