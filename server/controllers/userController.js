const User = require("../models/User")
const { ApiError } = require("../utils/ApiError")
const { ApiResponse } = require("../utils/ApiResponse")
const { asyncHandler } = require("../utils/asyncHandler")
const achievementsService = require("../services/achievementService");
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

// Helper function to construct the base URL for images
const getBaseUrl = (req) => {
  // In a production environment, you should use a fixed environment variable
  // like process.env.BACKEND_URL. For development, we can construct it.
  // Assuming your backend runs on the port defined in process.env.PORT
  const protocol = req.protocol || "http"
  const host = req.get("host") || `localhost:${process.env.PORT || 5000}` // Fallback to localhost:5000
  return `${protocol}://${host}`
}

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

  // Construct the full URL for the profile picture
  let fullProfilePictureUrl = null
  if (user.profilePicture) {
    // IMPORTANT: Ensure user.profilePicture from the DB is a relative path (e.g., /uploads/profiles/filename.jpg)
    // If it's already an absolute URL in the DB, this will double-prefix it.
    // Based on your logs, it seems to be stored as a relative path, which is correct for this logic.
    fullProfilePictureUrl = `${getBaseUrl(req)}${user.profilePicture}`
  }

  res.json(
  new ApiResponse(200, {
    id: user._id,
    firstName: user.emri,
    lastName: user.mbiemri,
    email: user.email,
    profilePicture: fullProfilePictureUrl,
    xp: user.xp,
    level: user.level,
    studyHours: user.studyHours,
    completedTests: user.completedTests,
    achievements: user.achievements,
    newAchievements: user.newAchievements || [], // Add this line
    listenTestsPassed: user.listenTestsPassed,
    passedTranslatedTexts: user.passedTranslatedTexts,
    isPaid: user.isPaid,
    lastLogin: user.lastLogin,
    streakCount: user.streakCount,
  })
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
      // Ensure the path is relative to the project root for fs.unlinkSync
      // user.profilePicture already stores the relative path like /uploads/profiles/filename.jpg
      const oldImagePath = path.join(__dirname, "..", user.profilePicture)
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath)
      }
    }
    // Update user profile picture with the relative path in the database
    user.profilePicture = `/uploads/profiles/${req.file.filename}`
    await user.save()
    // Construct the full URL to send back to the client
    const fullProfilePictureUrl = `${getBaseUrl(req)}${user.profilePicture}`
    res.json(
      new ApiResponse(
        200,
        {
          profilePicture: fullProfilePictureUrl, // Send the full URL
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

const addXp = asyncHandler(async (req, res) => {
  const { xp, reason } = req.body;
  if (typeof xp !== "number" || xp <= 0) {
    throw new ApiError(400, "XP must be a positive number");
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Use service to evaluate milestones and add achievements
  const newAchievements = await achievementsService.evaluateXpMilestones(user, xp);

  res.json(
    new ApiResponse(
      200,
      {
        xp: user.xp,
        level: user.level,
        achievements: user.achievements,
        newAchievements,
        reason: reason || "XP added",
      },
     newAchievements.length
  ? `Congratulations! You earned new achievements: ${newAchievements.map(a => a.name).join(", ")}`
  : "XP added successfully"

    )
  );
});
const handleAddXp = async () => {
  try {
    const apiResponse = await authService.addXp({ xp: 150, reason: "Complete lesson 1" });
    // Update React user state with latest achievements and XP
    updateUser(prevUser => ({
      ...prevUser,
      xp: apiResponse.data.xp,
      level: apiResponse.data.level,
      achievements: apiResponse.data.achievements,
      newAchievements: apiResponse.data.newAchievements,
    }));
  } catch (error) {
    console.error("Failed to add XP:", error);
  }
}


module.exports = {
  getProfile,
  getUserXp,
  updateStudyHours,
  uploadProfilePicture,
  updateProfile,
  addXp,
  handleAddXp
}
