const mongoose = require("mongoose");
const createWordSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    level: {
      type: String,
      enum: ["A1", "A2", "B1", "B2", "C1", "C2"],
      required: [true, "Level is required"],
    },
    xp: {
      type: Number,
      default: 50,
    },
    words: [
      {
        german: {
          type: String,
          required: [true, "German word is required"],
        },
        albanian: {
          type: String,
          required: [true, "Albanian translation is required"],
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("CreateWord", createWordSchema);