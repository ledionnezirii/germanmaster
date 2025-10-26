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
    xp: {
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
    streakCount: {
      type: Number,
      default: 0,
    },
    lastLoginDate: {
      type: Date,
      default: null,
    },
    achievements: [String],
    newAchievements: {
      type: [String],
      default: [],
    },
    learnedWords: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Word",
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
    completedPronunciationPackages: [{ type: mongoose.Schema.Types.ObjectId, ref: "PronunciationPackage" }],
    completedWords: {
      type: [String],
      default: [],
    },
    finishedQuizzes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Quiz",
      },
    ],
    grammarFinished: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Grammar",
      },
    ],
    categoryFinished: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    puzzleCompleted: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Puzzle",
      },
    ],
    phrasesFinished: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Phrase",
      },
    ],
    practiceCompleted: [
      {
        practiceId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Practice",
        },
        completedAt: {
          type: Date,
          default: Date.now,
        },
        score: {
          type: Number,
        },
        answers: [
          {
            questionIndex: Number,
            userAnswer: mongoose.Schema.Types.Mixed,
            isCorrect: Boolean,
          },
        ],
      },
    ],
    certificates: [
      {
        level: String,
        filePath: String,
        issuedAt: Date,
      },
    ],
    currentLeague: {
      type: String,
      default: "Bronze",
    },
    highestLeagueRank: {
      type: Number,
      default: null,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    subscriptionType: {
      type: String,
      enum: ["free_trial", "1_month", "3_months", "1_year", null],
      default: "free_trial",
    },
    subscriptionExpiresAt: {
      type: Date,
    },
    trialStartedAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpires: {
      type: Date,
    },
    lastLogin: Date,
    quizStats: {
      totalQuizzes: { type: Number, default: 0 },
      wins: { type: Number, default: 0 },
      correctAnswers: { type: Number, default: 0 },
    },
    wordRaceStats: {
      totalRaces: { type: Number, default: 0 },
      wins: { type: Number, default: 0 },
      correctWords: { type: Number, default: 0 },
    },
    quizCycle: {
      type: [String],
      default: [],
    },
    quizCycleIndex: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
)

userSchema.methods.updateStreakOnLogin = async function () {
  const now = new Date()
  let shouldUpdateLastLoginDate = false

  if (this.lastLoginDate) {
    const diffTime = now.getTime() - this.lastLoginDate.getTime()
    const diffHours = diffTime / (1000 * 60 * 60)

    if (diffHours >= 24 && diffHours < 48) {
      this.streakCount = (this.streakCount || 0) + 1
      shouldUpdateLastLoginDate = true
    } else if (diffHours >= 48) {
      this.streakCount = 1
      shouldUpdateLastLoginDate = true
    }
  } else {
    this.streakCount = 1
    shouldUpdateLastLoginDate = true
  }

  if (shouldUpdateLastLoginDate) {
    this.lastLoginDate = now
  }

  this.lastLogin = now
  await this.save()
}

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()
  const salt = await bcrypt.genSalt(12)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

module.exports = mongoose.model("User", userSchema)
