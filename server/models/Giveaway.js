const mongoose = require("mongoose");

const giveawaySchema = new mongoose.Schema(
  {
    title:           { type: String, required: true, trim: true },
    description:     { type: String, required: true },
    imageUrl:        { type: String, default: "" },
    endTime:         { type: Date, required: true },
    maxWinners:      { type: Number, required: true, min: 1 },
    maxParticipants: { type: Number, default: null },
    minXp:           { type: Number, default: 0 },

    status: {
      type: String,
      enum: ["active", "ended", "cancelled"],
      default: "active",
    },

    winners: [
      {
        userId:           { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        emri:             String,
        mbiemri:          String,
        email:            String,
        avatarStyle:      String,
        subscriptionType: String,
      },
    ],

    participants: [
      {
        userId:           { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        emri:             String,
        mbiemri:          String,
        email:            String,
        avatarStyle:      String,
        subscriptionType: { type: String, default: null }, // null = free, "1_month", "3_months", "1_year"
        joinedAt:         { type: Date, default: Date.now },
      },
    ],

    auditLog: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Giveaway", giveawaySchema);