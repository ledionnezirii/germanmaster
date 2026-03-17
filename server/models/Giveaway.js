const mongoose = require("mongoose");

const giveawaySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    imageUrl: { type: String, default: "" },
    endTime: { type: Date, required: true },
    maxWinners: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ["active", "ended", "cancelled"],
      default: "active",
    },
    winners: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        emri: String,
        mbiemri: String,
        email: String,
      },
    ],
    participants: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        emri: String,
        mbiemri: String,
        email: String,
        joinedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Giveaway", giveawaySchema);