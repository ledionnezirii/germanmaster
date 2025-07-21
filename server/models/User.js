const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

const userSchema = new mongoose.Schema(
  {
    emri: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    mbiemri: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    xp: { // This is the general XP field
      type: Number,
      default: 0,
    },
    level: {
      type: String,
      enum: ["A1", "A2", "B1", "B2", "C1", "C2"],
      default: "A1",
    },
    profilePicture: {
      type: String,
      default: "",
    },
    studyHours: {
      type: Number,
      default: 0,
    },
    completedTests: {
      type: Number,
      default: 0,
    },
    // Streak fields
    streakCount: {
      type: Number,
      default: 0,
    },
    lastLoginDate: {
      type: Date,
      default: null,
    },
    // Other existing fields
    achievements: [String],
    listenTestsPassed: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Listen",
      },
    ],
    passedTranslatedTexts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Translate",
      },
    ],
    completedQuizzes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Quiz",
      },
    ],
    isPaid: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: Date,
    // NEW: Quiz specific stats (already present, but ensure structure)
    quizStats: {
      totalQuizzes: { type: Number, default: 0 },
      wins: { type: Number, default: 0 },
      correctAnswers: { type: Number, default: 0 },
    },
    // NEW: Word Race specific stats
    wordRaceStats: {
      totalRaces: { type: Number, default: 0 },
      wins: { type: Number, default: 0 },
      correctWords: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  },
)

// 24-hour streak update method
userSchema.methods.updateStreakOnLogin = async function () {
  const now = new Date()
  if (this.lastLoginDate) {
    // Calculate hours difference
    const diffTime = now.getTime() - this.lastLoginDate.getTime()
    const diffHours = diffTime / (1000 * 60 * 60) // Convert to hours
    if (diffHours >= 24 && diffHours < 48) {
      // Between 24-48 hours - increment streak
      this.streakCount = (this.streakCount || 0) + 1
    } else if (diffHours >= 48) {
      // More than 48 hours - reset streak
      this.streakCount = 1
    } else if (diffHours < 24) {
      // Less than 24 hours - no change (same session)
      // Don't update streak count
    }
  } else {
    // First login ever
    this.streakCount = 1
  }
  this.lastLoginDate = now
  this.lastLogin = now
  await this.save()
}

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()
  const salt = await bcrypt.genSalt(12)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

module.exports = mongoose.model("User", userSchema)
