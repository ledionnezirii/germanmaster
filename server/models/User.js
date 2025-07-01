const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

const userSchema = new mongoose.Schema(
  {
    emri: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    mbiemri: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please provide a valid email"],
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
    xp: {
      type: Number,
      default: 0,
      min: [0, "XP cannot be negative"],
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
      min: [0, "Study hours cannot be negative"],
    },
    completedTests: {
      type: Number,
      default: 0,
      min: [0, "Completed tests cannot be negative"],
    },
    achievements: [
      {
        type: String,
      },
    ],
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
    paidAt: Date,
    paidUntil: Date,
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: Date,
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: Date,
  },
  {
    timestamps: true,
  },
)

// Calculate level based on XP
userSchema.methods.calculateLevel = function () {
  const xpScore = this.xp * 0.7
  const studyHoursScore = this.studyHours * 0.3
  const totalScore = xpScore + studyHoursScore

  if (totalScore < 200) return "A1"
  if (totalScore < 500) return "A2"
  if (totalScore < 900) return "B1"
  if (totalScore < 1400) return "B2"
  if (totalScore < 2000) return "C1"
  return "C2"
}

// Check if account is locked
userSchema.virtual("isLocked").get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now())
})

// Increment login attempts
userSchema.methods.incLoginAttempts = function () {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1, loginAttempts: 1 },
    })
  }

  const updates = { $inc: { loginAttempts: 1 } }

  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = {
      lockUntil: Date.now() + 2 * 60 * 60 * 1000, // 2 hours
    }
  }

  return this.updateOne(updates)
}

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()

  const salt = await bcrypt.genSalt(12)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

// Update level before saving
userSchema.pre("save", function (next) {
  if (this.isModified("xp") || this.isModified("studyHours")) {
    this.level = this.calculateLevel()
  }
  next()
})

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

// Update last login
userSchema.methods.updateLastLogin = function () {
  this.lastLogin = new Date()
  this.loginAttempts = 0
  this.lockUntil = undefined
  return this.save()
}

module.exports = mongoose.model("User", userSchema)
