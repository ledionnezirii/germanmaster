const mongoose = require("mongoose")

const categorySchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      unique: true,
      maxlength: [100, "Category name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    level: {
      type: String,
      enum: ["A1", "A2", "B1", "B2", "C1", "C2"],
      default: "A1",
    },
    type: {
      type: String,
      default: "other",
      required: [true, "Category type is required"],
    },
    words: [
      {
        word: {
          type: String,
          required: [true, "Word is required"],
          trim: true,
        },
        translation: {
          type: String,
          required: [true, "Translation is required"],
          trim: true,
        },
        examples: [
          {
            type: String,
            required: true,
            trim: true,
          },
        ],
        pronunciation: {
          type: String,
          trim: true,
        },
      },
    ],
    icon: {
      type: String,
      default: "book",
    },
    color: {
      type: String,
      default: "#10B981",
    },
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

// Validate that words array is not empty
categorySchema.pre("save", function (next) {
  // Only validate words if this is not a new document or if words are being explicitly modified
  if (!this.isNew && this.isModified("words") && this.words.length === 0) {
    return next(new Error("Category must have at least one word when updating"))
  }
  next()
})

module.exports = mongoose.model("Category", categorySchema)
