const mongoose = require("mongoose")
const crypto = require("crypto")

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  xpReward: {
    type: Number,
    default: 50,
  },
  dueDate: {
    type: Date,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
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
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  // The assigned teacher for this group
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  // PIN code for teacher to unlock/access the group (6 digits)
  teacherPin: {
    type: String,
    required: true,
    unique: true,
  },
  // Code for students to join the group (6 chars)
  teacherCode: {
    type: String,
    required: true,
    unique: true,
  },
  // Whether teacher has unlocked the group with their PIN
  teacherUnlocked: {
    type: Boolean,
    default: false,
  },
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  tasks: [taskSchema],
  invitations: [
    {
      email: String,
      invitedAt: {
        type: Date,
        default: Date.now,
      },
      status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending",
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

const academySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Academy name is required"],
      trim: true,
    },
    description: {
      type: String,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    groups: [groupSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("Academy", academySchema)