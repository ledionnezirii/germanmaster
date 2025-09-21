const User = require("../models/User")
const { generateToken } = require("../utils/generateToken")
const { ApiError } = require("../utils/ApiError")
const { ApiResponse } = require("../utils/ApiResponse")
const { asyncHandler } = require("../utils/asyncHandler")
const crypto = require("crypto")
const sendEmail = require("../utils/sendEmail")

// Helper function to construct the base URL for images
const getBaseUrl = (req) => {
  const protocol = req.protocol || "http"
  const host = req.get("host") || `localhost:${process.env.PORT || 5000}`
  return `${protocol}://${host}`
}

const normalizeGmailAddress = (email) => {
  if (!email) return email

  const [localPart, domain] = email.toLowerCase().split("@")

  // For Gmail addresses, remove dots from local part
  if (domain === "gmail.com") {
    return localPart.replace(/\./g, "") + "@" + domain
  }

  return email.toLowerCase()
}

// @desc    Register user
// @route   POST /api/auth/signup
// @access  Public
const signup = asyncHandler(async (req, res) => {
  const { emri, mbiemri, email, password } = req.body

  const normalizedEmail = normalizeGmailAddress(email)

  // Check if user exists with normalized email
  const userExists = await User.findOne({ email: normalizedEmail })
  if (userExists) {
    throw new ApiError(400, "Përdoruesi ekziston tashmë me këtë email")
  }

  // Set role (admin or user)
  const role = normalizedEmail === process.env.ADMIN_EMAIL ? "admin" : "user"

  const user = await User.create({
    emri,
    mbiemri,
    email: normalizedEmail,
    password,
    role,
  })

  if (user) {
    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString("hex")
    user.verificationToken = verificationToken
    user.verificationTokenExpires = Date.now() + 60 * 60 * 1000 // 1 hour
    await user.save({ validateBeforeSave: false })

    // Send verification email
    const verificationUrl = `${req.protocol}://${req.get("host")}/api/auth/verify/${verificationToken}`
    const message = `
      <h1>Verifikimi i Email-it</h1>
      <p>Përshëndetje ${user.emri},</p>
      <p>Ju lutem verifikoni email-in tuaj duke klikuar në lidhjen më poshtë:</p>
      <a href="${verificationUrl}" target="_blank">Verifiko Email-in</a>
    `
    await sendEmail({
      email: user.email,
      subject: "Verifikoni email-in tuaj",
      message,
    })

    // Optionally update streak on signup
    try {
      await user.updateStreakOnLogin()
    } catch (error) {
      console.error("Gabim gjatë përditësimit të streak në regjistrim:", error)
    }

    // Respond without token yet, user must verify first
    res
      .status(201)
      .json(new ApiResponse(201, {}, "Përdoruesi u regjistrua me sukses. Ju lutem kontrolloni email-in për të verifikuar llogarinë tuaj."))
  } else {
    throw new ApiError(400, "Të dhënat e përdoruesit janë jo të vlefshme")
  }
})

// @desc    Authenticate user (Login)
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  const normalizedEmail = normalizeGmailAddress(email)

  // Find user with normalized email and include password
  const user = await User.findOne({ email: normalizedEmail }).select("+password")
  if (!user) {
    throw new ApiError(401, "Kredenciale të pavlefshme")
  }

  // Check if user verified email
  if (!user.isVerified) {
    throw new ApiError(401, "Ju lutem verifikoni email-in tuaj para se të hyni")
  }

  // Check password
  const isMatch = await user.comparePassword(password)
  if (!isMatch) {
    throw new ApiError(401, "Kredenciale të pavlefshme")
  }

  try {
    // Update streak on login
    await user.updateStreakOnLogin()
  } catch (error) {
    console.error("Gabim gjatë përditësimit të streak në hyrje:", error)
  }

  // Generate token
  const token = generateToken(user._id, user.emri)

  // Construct full profile picture URL for login response
  let fullProfilePictureUrl = null
  if (user.profilePicture) {
    fullProfilePictureUrl = `${getBaseUrl(req)}${user.profilePicture}`
  }

  res.json(
    new ApiResponse(
      200,
      {
        token,
        user: {
          id: user._id,
          emri: user.emri,
          mbiemri: user.mbiemri,
          email: user.email,
          role: user.role,
          xp: user.xp,
          level: user.level,
          profilePicture: fullProfilePictureUrl,
          streakCount: user.streakCount || 0,
        },
      },
      "Hyrje me sukses",
    ),
  )
})

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)

  // Construct full profile picture URL for getMe response
  let fullProfilePictureUrl = null
  if (user.profilePicture) {
    fullProfilePictureUrl = `${getBaseUrl(req)}${user.profilePicture}`
  }

  res.json(
    new ApiResponse(200, {
      user: {
        id: user._id,
        emri: user.emri,
        mbiemri: user.mbiemri,
        email: user.email,
        role: user.role,
        xp: user.xp,
        level: user.level,
        profilePicture: fullProfilePictureUrl,
        studyHours: user.studyHours,
        completedTests: user.completedTests,
        achievements: user.achievements,
        streakCount: user.streakCount || 0,
      },
    }),
  )
})

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body

  const normalizedEmail = normalizeGmailAddress(email)

  const user = await User.findOne({ email: normalizedEmail })

  if (!user) throw new ApiError(404, "Përdoruesi nuk u gjet")

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString("hex")
  user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex")
  user.resetPasswordExpires = Date.now() + 60 * 60 * 1000 // 1 hour
  await user.save({ validateBeforeSave: false })

  console.log("RESET TOKEN:", resetToken)

  // Send reset email
const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`
  const message = `
    <h1>Rivendosja e Fjalëkalimit</h1>
    <p>Përshëndetje ${user.emri},</p>
    <p>Keni kërkuar rivendosjen e fjalëkalimit. Klikoni në lidhjen më poshtë për të vendosur një fjalëkalim të ri:</p>
    <a href="${resetUrl}" target="_blank">Rivendos Fjalëkalimin</a>
  `

  await sendEmail({
    email: user.email,
    subject: "Kërkesa për rivendosjen e fjalëkalimit",
    message,
  })

  res.json(new ApiResponse(200, {}, "Email për rivendosjen e fjalëkalimit dërguar"))
})

const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params
  const { newPassword } = req.body

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex")

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  })

  if (!user) throw new ApiError(400, "Token i pavlefshëm ose ka skaduar")

  user.password = newPassword
  user.resetPasswordToken = undefined
  user.resetPasswordExpires = undefined
  await user.save()

  res.json(new ApiResponse(200, {}, "Fjalëkalimi u rivendos me sukses"))
})

const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params

  const user = await User.findOne({ verificationToken: token })
  if (!user) throw new ApiError(400, "Token verifikimi i pavlefshëm ose ka skaduar")

  user.isVerified = true
  user.verificationToken = undefined
  await user.save()

  res.json(new ApiResponse(200, {}, "Email-i u verifikua me sukses"))
})

module.exports = {
  signup,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  verifyEmail,
}
