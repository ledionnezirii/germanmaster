const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    timeSpent: {
      type: Number, // in minutes
      default: 0,
    },
    sessions: [
      {
        startTime: {
          type: Date,
          required: true,
        },
        endTime: {
          type: Date,
        },
        duration: {
          type: Number, // in minutes
          default: 0,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
activitySchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Activity", activitySchema);