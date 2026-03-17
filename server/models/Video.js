const mongoose = require("mongoose");

const subtitleSchema = new mongoose.Schema({
  start: { type: Number, required: true },
  end: { type: Number, required: true },
  german: { type: String, required: true },
  albanian: { type: String, required: true },
});

const videoSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    youtubeVideoId: { type: String, required: true },
    level: {
      type: String,
      enum: ["A1", "A2", "B1", "B2", "C1", "C2"],
      required: true,
    },
    description: { type: String },
    subtitles: [subtitleSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Video", videoSchema);