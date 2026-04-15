const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema(
  {
    // e.g. "A1 16:30" or "B2 Morning"
    name: {
      type: String,
      required: [true, "Group name is required"],
      trim: true,
    },
    level: {
      type: String,
      enum: ["A1", "A2", "B1", "B2", "C1", "C2"],
      required: [true, "Level is required"],
    },
    // Which academy this group belongs to
    academyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Academy",
      required: true,
    },
    joinCode: {
  type: String,
  unique: true,
  default: () => Math.random().toString(36).substring(2, 8).toUpperCase()
},
    // The academyAdmin/teacher managing this group
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Students enrolled in this group
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Group", groupSchema);