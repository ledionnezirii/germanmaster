const mongoose = require("mongoose")

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    deviceType: {
      type: String,
      enum: ["desktop", "mobile", "tablet", "unknown"],
      default: "unknown",
    },
    deviceInfo: {
      userAgent: String,
      browser: String,
      os: String,
      ip: String,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
)

// Index for efficient queries
sessionSchema.index({ userId: 1, isActive: 1 })
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

// Method to check if session is expired
sessionSchema.methods.isExpired = function () {
  return this.expiresAt < new Date()
}

// Static method to get active sessions count for a user
sessionSchema.statics.getActiveSessionsCount = async function (userId) {
  return await this.countDocuments({
    userId,
    isActive: true,
    expiresAt: { $gt: new Date() },
  })
}

// Static method to get active sessions for a user
sessionSchema.statics.getActiveSessions = async function (userId) {
  return await this.find({
    userId,
    isActive: true,
    expiresAt: { $gt: new Date() },
  }).sort({ lastActivity: -1 })
}

// Static method to invalidate all active sessions for a user
sessionSchema.statics.invalidateAllSessions = async function (userId) {
  return await this.updateMany(
    {
      userId,
      isActive: true,
    },
    {
      $set: { isActive: false },
    },
  )
}
// </CHANGE>

// Static method to clean up expired sessions
sessionSchema.statics.cleanupExpiredSessions = async function () {
  return await this.deleteMany({
    expiresAt: { $lt: new Date() },
  })
}

module.exports = mongoose.model("Session", sessionSchema)
