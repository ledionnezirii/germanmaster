const mongoose = require("mongoose")

const exampleSchema = new mongoose.Schema({
  german: {
    type: String,
    required: true,
    trim: true,
  },
  english: {
    type: String,
    required: true,
    trim: true,
  },
  explanation: {
    type: String,
    trim: true,
  },
})

const exerciseSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true,
  },
  options: [
    {
      type: String,
      required: true,
      trim: true,
    },
  ],
  correctAnswer: {
    type: String,
    required: true,
    trim: true,
  },
  explanation: {
    type: String,
    trim: true,
  },
})

const grammarSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Grammar topic name is required"],
      trim: true,
      maxlength: [200, "Name cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    level: {
      type: String,
      required: [true, "Level is required"],
      enum: {
        values: ["A1", "A2", "B1", "B2", "C1", "C2"],
        message: "Level must be one of: A1, A2, B1, B2, C1, C2",
      },
    },
    content: {
      type: String,
      required: [true, "Content is required"],
      trim: true,
    },
    examples: [exampleSchema],
    exercises: [exerciseSchema],
    difficulty: {
      type: Number,
      min: 1,
      max: 5,
      default: 1,
    },
    tags: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
)

// Index for better performance
grammarSchema.index({ level: 1, isActive: 1 })
grammarSchema.index({ name: "text", description: "text" })

module.exports = mongoose.model("Grammar", grammarSchema)
