const mongoose = require("mongoose")

const raceRoomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
    },
    roomName: {
      type: String,
      required: true,
    },
    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    level: {
      type: String,
      enum: ["A1", "A2", "B1", "B2", "C1", "C2"],
      required: true,
    },
    maxPlayers: {
      type: Number,
      default: 10,
    },
    players: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        username: String,
        score: {
          type: Number,
          default: 0,
        },
        correctAnswers: {
          type: Number,
          default: 0,
        },
        answers: [
          {
            questionIndex: Number,
            answer: Number,
            isCorrect: Boolean,
            timeSpent: Number,
          },
        ],
        isReady: {
          type: Boolean,
          default: false,
        },
      },
    ],
    // REFERENCE to RaceQuestion IDs
    questions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "RaceQuestion"  // ← CHANGED THIS
    }],
    status: {
      type: String,
      enum: ["waiting", "starting", "in-progress", "finished"],
      default: "waiting",
    },
    currentQuestionIndex: {
      type: Number,
      default: 0,
    },
    gameMode: {
      type: String,
      enum: ["multiplayer", "vs-computer"],
      default: "multiplayer",
    },
    questionsCount: {
      type: Number,
      default: 10,
    },
    startedAt: Date,
    finishedAt: Date,
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.models.Race || mongoose.model("Race", raceRoomSchema)