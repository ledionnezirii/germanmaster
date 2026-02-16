const mongoose = require("mongoose");

const pollSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    options: [
      {
        text: { type: String, required: true },
        votes: { type: Number, default: 0 },
      },
    ],
    voters: [
      {
        visitorId: { type: String, required: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        userEmail: { type: String, default: null },
        userName: { type: String, default: null },
        optionIndex: { type: Number, required: true },
        votedAt: { type: Date, default: Date.now },
      },
    ],
    maxVotesPerUser: {
      type: Number,
      default: 1,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

pollSchema.methods.getTotalVotes = function () {
  return this.options.reduce((sum, opt) => sum + opt.votes, 0);
};

module.exports = mongoose.model("Poll", pollSchema);