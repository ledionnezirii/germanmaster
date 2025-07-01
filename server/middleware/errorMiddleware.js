const { ApiError } = require("../utils/ApiError")

const notFound = (req, res, next) => {
  const error = new ApiError(404, `Not found - ${req.originalUrl}`)
  next(error)
}

const errorHandler = (err, req, res, next) => {
  let error = { ...err }
  error.message = err.message

  // Log error
  console.error("Error:", err)

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    const message = "Resource not found"
    error = new ApiError(404, message)
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = "Duplicate field value entered"
    error = new ApiError(400, message)
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ")
    error = new ApiError(400, message)
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    const message = "Invalid token"
    error = new ApiError(401, message)
  }

  if (err.name === "TokenExpiredError") {
    const message = "Token expired"
    error = new ApiError(401, message)
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || "Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  })
}

module.exports = { errorHandler, notFound }
