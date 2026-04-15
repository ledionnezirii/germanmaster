const mongoose = require("mongoose");

const userWordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    german: {
      type: String,
      required: [true, "German word is required"],
      trim: true,
    },
    translation: {
      type: String,
      required: [true, "Translation is required"],
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserWord", userWordSchema);
