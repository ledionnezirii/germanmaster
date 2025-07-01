const User = require("../models/User")
const { ApiError } = require("../utils/ApiError")
const { ApiResponse } = require("../utils/ApiResponse")
const { asyncHandler } = require("../utils/asyncHandler")
const multer = require("multer")
const path = require("path")
const fs = require("fs")

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/profiles"
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true })
    }
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, `profile-${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`)
  },
})

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)

    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new ApiError(400, "Only image files are allowed"))
    }
  },
})

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)
    .populate("listenTestsPassed", "title level")
    .populate("passedTranslatedTexts", "title level")

  if (!user) {
    throw new ApiError(404, "User not found")
  }

  res.json(
    new ApiResponse(200, {
      firstName: user.emri,
      lastName: user.mbiemri,
      email: user.email,
      profilePicture: user.profilePicture,
      xp: user.xp,
      level: user.level,
      studyHours: user.studyHours,
      completedTests: user.completedTests,
      achievements: user.achievements,
      listenTestsPassed: user.listenTestsPassed,
      passedTranslatedTexts: user.passedTranslatedTexts,
      isPaid: user.isPaid,
      lastLogin: user.lastLogin,
    }),
  )
})

// @desc    Get user XP
// @route   GET /api/users/xp
// @access  Private
const getUserXp = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("xp")

  if (!user) {
    throw new ApiError(404, "User not found")
  }

  res.json(new ApiResponse(200, { xp: user.xp }))
})

// @desc    Update study hours
// @route   PUT /api/users/study-hours
// @access  Private
const updateStudyHours = asyncHandler(async (req, res) => {
  const { hours } = req.body

  if (typeof hours !== "number" || hours <= 0) {
    throw new ApiError(400, "Hours must be a positive number")
  }

  const user = await User.findById(req.user.id)

  if (!user) {
    throw new ApiError(404, "User not found")
  }

  user.studyHours += hours
  await user.save()

  res.json(
    new ApiResponse(
      200,
      {
        studyHours: user.studyHours,
        level: user.level,
      },
      "Study hours updated successfully",
    ),
  )
})

// @desc    Upload profile picture
// @route   POST /api/users/profile-picture
// @access  Private
const uploadProfilePicture = [
  upload.single("profilePicture"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new ApiError(400, "Please upload an image file")
    }

    const user = await User.findById(req.user.id)

    if (!user) {
      throw new ApiError(404, "User not found")
    }

    // Delete old profile picture if exists
    if (user.profilePicture) {
      const oldImagePath = path.join(__dirname, "..", user.profilePicture)
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath)
      }
    }

    // Update user profile picture
    user.profilePicture = `/uploads/profiles/${req.file.filename}`
    await user.save()

    res.json(
      new ApiResponse(
        200,
        {
          profilePicture: user.profilePicture,
        },
        "Profile picture uploaded successfully",
      ),
    )
  }),
]

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const { emri, mbiemri } = req.body

  const user = await User.findById(req.user.id)

  if (!user) {
    throw new ApiError(404, "User not found")
  }

  if (emri) user.emri = emri
  if (mbiemri) user.mbiemri = mbiemri

  await user.save()

  res.json(
    new ApiResponse(
      200,
      {
        firstName: user.emri,
        lastName: user.mbiemri,
        email: user.email,
      },
      "Profile updated successfully",
    ),
  )
})

// @desc    Add XP to user
// @route   POST /api/users/add-xp
// @access  Private
const addXp = asyncHandler(async (req, res) => {
  const { xp, reason } = req.body

  if (typeof xp !== "number" || xp <= 0) {
    throw new ApiError(400, "XP must be a positive number")
  }

  const user = await User.findById(req.user.id)

  if (!user) {
    throw new ApiError(404, "User not found")
  }

  const oldLevel = user.level
  user.xp += xp
  await user.save()

  const leveledUp = oldLevel !== user.level

  res.json(
    new ApiResponse(
      200,
      {
        xp: user.xp,
        level: user.level,
        leveledUp,
        reason: reason || "XP added",
      },
      leveledUp ? "Congratulations! You leveled up!" : "XP added successfully",
    ),
  )
})

module.exports = {
  getProfile,
  getUserXp,
  updateStudyHours,
  uploadProfilePicture,
  updateProfile,
  addXp,
}
