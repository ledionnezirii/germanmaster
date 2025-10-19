const mongoose = require("mongoose")

const puzzleSchema = new mongoose.Schema(
  {
    word: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      minlength: 5,
      maxlength: 5,
    },
    xpReward: {
      type: Number,
      required: true,
      default: 50,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    activeDate: {
      type: Date,
      required: true,
      unique: true,
    },
    hints: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      default: "general",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    completedBy: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        completedAt: {
          type: Date,
          default: Date.now,
        },
        attempts: {
          type: Number,
          default: 1,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
)

// Index for faster queries
puzzleSchema.index({ activeDate: 1 })
puzzleSchema.index({ isActive: 1 })

// Method to check if puzzle is for today
puzzleSchema.methods.isToday = function () {
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const puzzleDate = new Date(this.activeDate)
  puzzleDate.setUTCHours(0, 0, 0, 0)
  return today.getTime() === puzzleDate.getTime()
}

// Static method to get today's puzzle
puzzleSchema.statics.getTodaysPuzzle = async function () {
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)

  return await this.findOne({
    activeDate: { $gte: today, $lt: tomorrow },
    isActive: true,
  })
}

// Static method to check if user completed today's puzzle
puzzleSchema.statics.hasUserCompletedToday = async function (userId) {
  const todaysPuzzle = await this.getTodaysPuzzle()
  if (!todaysPuzzle) return false

  return todaysPuzzle.completedBy.some((completion) => completion.userId.toString() === userId.toString())
}

module.exports = mongoose.model("Puzzle", puzzleSchema)
