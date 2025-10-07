const User = require("../models/User")
const { ApiError } = require("../utils/ApiError")
const { ApiResponse } = require("../utils/ApiResponse")
const { asyncHandler } = require("../utils/asyncHandler")
const multer = require("multer")
const path = require("path")
const fs = require("fs")
const cloudinary = require("../utils/cloudinary");
const streamifier = require("streamifier");




const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) return cb(null, true);
    cb(new ApiError(400, "Only image files are allowed"));
  },
});



const getBaseUrl = (req) => {
  // In a production environment, you should use a fixed environment variable
  // like process.env.BACKEND_URL. For development, we can construct it.
  // Assuming your backend runs on the port defined in process.env.PORT
  const protocol = req.protocol || "http"
  const host = req.get("host") || `localhost:${process.env.PORT || 5000}` // Fallback to localhost:5000
  return `${protocol}://${host}`
}


const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)
    .populate("listenTestsPassed", "title level")
    .populate("passedTranslatedTexts", "title level");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Fix for profile picture URL
  let fullProfilePictureUrl = null;
  if (user.profilePicture) {
    // If the picture is already a full URL (Cloudinary), use it directly
    if (user.profilePicture.startsWith("http")) {
      fullProfilePictureUrl = user.profilePicture;
    } else {
      // Otherwise, it's a local file; prefix with backend URL
      fullProfilePictureUrl = `${getBaseUrl(req)}${user.profilePicture}`;
    }
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
      newAchievements: user.newAchievements || [],
      listenTestsPassed: user.listenTestsPassed,
      passedTranslatedTexts: user.passedTranslatedTexts,
      isPaid: user.isPaid,
      lastLogin: user.lastLogin,
      streakCount: user.streakCount,
    })
  );
});



const getUserXp = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("xp")
  if (!user) {
    throw new ApiError(404, "User not found")
  }
  res.json(new ApiResponse(200, { xp: user.xp }))
})


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


const uploadProfilePicture = [
  upload.single("profilePicture"),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new ApiError(400, "Please upload an image");

    const user = await User.findById(req.user.id);
    if (!user) throw new ApiError(404, "User not found");

    // Upload to Cloudinary
    const streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "profiles", public_id: `profile-${user._id}-${Date.now()}` },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
    };

    const result = await streamUpload(req);

    // Save URL in database
    user.profilePicture = result.secure_url;
    await user.save();

    res.json(
      new ApiResponse(
        200,
        { profilePicture: user.profilePicture },
        "Profile picture uploaded successfully"
      )
    );
  }),
];



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
