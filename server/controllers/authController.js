const User = require("../models/User")
const Session = require("../models/Session")
const { generateToken } = require("../utils/generateToken")
const { ApiError } = require("../utils/ApiError")
const { ApiResponse } = require("../utils/ApiResponse")
const { asyncHandler } = require("../utils/asyncHandler")
const crypto = require("crypto")
const sendEmail = require("../utils/sendEmail")


// Add this helper function at the top of authController
const escapeHtml = (text) => {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// Helper function to calculate subscription status (FIXED VERSION)
const calculateSubscriptionStatus = (user) => {
  const nowDate = new Date()
  const expiresAt = user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt) : null
  
  // Check if expired
  const isExpired = !expiresAt || expiresAt <= nowDate
  
  // Calculate days remaining - ONLY if not expired
  let daysRemaining = 0
  if (!isExpired && expiresAt) {
    const diffMs = expiresAt - nowDate
    daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  }

  return {
    active: !isExpired && user.isPaid,
    type: user.subscriptionType || "free_trial",
    expiresAt: user.subscriptionExpiresAt,
    trialStartedAt: user.trialStartedAt,
    daysRemaining: daysRemaining,
    cancelled: user.subscriptionCancelled || false,
  }
}

// Helper function to detect device type from user agent
const detectDeviceType = (userAgent) => {
  if (!userAgent) return "unknown"

  const ua = userAgent.toLowerCase()

  if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
    return "mobile"
  } else if (ua.includes("tablet") || ua.includes("ipad")) {
    return "tablet"
  } else {
    return "desktop"
  }
}

// Helper function to extract device info
const extractDeviceInfo = (req) => {
  const userAgent = req.headers["user-agent"] || ""

  return {
    userAgent,
    browser: userAgent.split("/")[0] || "Unknown",
    os: userAgent.includes("Windows")
      ? "Windows"
      : userAgent.includes("Mac")
        ? "MacOS"
        : userAgent.includes("Linux")
          ? "Linux"
          : userAgent.includes("Android")
            ? "Android"
            : userAgent.includes("iOS")
              ? "iOS"
              : "Unknown",
    ip: req.ip || req.connection.remoteAddress || "Unknown",
  }
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

// In signup function - remove email verification sending, just create user
const signup = asyncHandler(async (req, res) => {
  const { emri, mbiemri, email, password, termsAccepted } = req.body

  if (!termsAccepted) {
    throw new ApiError(400, "Ju duhet të pranoni Kushtet dhe Afatet për t'u regjistruar")
  }

  const normalizedEmail = normalizeGmailAddress(email)

  const userExists = await User.findOne({ email: normalizedEmail })
  if (userExists) {
    throw new ApiError(400, "Përdoruesi ekziston tashmë me këtë email")
  }

  const role = normalizedEmail === process.env.ADMIN_EMAIL ? "admin" : "user"

  const now = new Date()
  const trialExpiry = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)

  const user = await User.create({
    emri,
    mbiemri,
    email: normalizedEmail,
    password,
    role,
    subscriptionType: "free_trial",
    trialStartedAt: now,
    subscriptionExpiresAt: trialExpiry,
    termsAccepted: true,
    termsAcceptedAt: now,
    isVerified: false, // User starts as not verified
  })

  if (user) {
    user.streakCount = 1
    user.lastLogin = new Date()
    await user.save({ validateBeforeSave: false })

    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          {},
          "Përdoruesi u regjistrua me sukses. Tani mund të hyni në llogarinë tuaj.",
        ),
      )
  } else {
    throw new ApiError(400, "Të dhënat e përdoruesit janë jo të vlefshme")
  }
})


const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  const normalizedEmail = normalizeGmailAddress(email)

  const user = await User.findOne({ email: normalizedEmail }).select("+password")
  if (!user) {
    throw new ApiError(401, "Kredenciale të pavlefshme")
  }

 

  const isMatch = await user.comparePassword(password)
  if (!isMatch) {
    throw new ApiError(401, "Kredenciale të pavlefshme")
  }

  // ... rest of login logic stays the same
  const activeSessionsCount = await Session.getActiveSessionsCount(user._id)

  if (activeSessionsCount >= 2) {
    await Session.invalidateAllSessions(user._id)
  }

  const now = new Date()
  const lastLogin = user.lastLogin

  if (!lastLogin) {
    user.streakCount = 1
    user.lastLogin = now
  } else {
    const lastLoginDate = new Date(lastLogin)
    const timeDiff = now - lastLoginDate
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24)

    if (daysDiff >= 1 && daysDiff < 2) {
      user.streakCount = (user.streakCount || 0) + 1
      user.lastLogin = now
    } else if (daysDiff >= 2) {
      user.streakCount = 1
      user.lastLogin = now
    }
  }

  await user.save({ validateBeforeSave: false })

  const token = generateToken(user._id, user.emri)

  const deviceType = detectDeviceType(req.headers["user-agent"])
  const deviceInfo = extractDeviceInfo(req)

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  await Session.create({
    userId: user._id,
    token,
    deviceType,
    deviceInfo,
    expiresAt,
    isActive: true,
  })

  const avatarUrl = user.avatarStyle
    ? `https://api.dicebear.com/7.x/${user.avatarStyle}/svg?seed=${user._id}`
    : `https://api.dicebear.com/7.x/adventurer/svg?seed=${user._id}`

  const subscriptionStatus = calculateSubscriptionStatus(user)

  res.json(
    new ApiResponse(
      200,
      {
        token,
        user: {
          id: user._id,
          firstName: user.emri,
          lastName: user.mbiemri,
          emri: user.emri,
          mbiemri: user.mbiemri,
          email: user.email,
          role: user.role,
          xp: user.xp,
          level: user.level,
          avatarUrl,
          avatarStyle: user.avatarStyle || "adventurer",
          streakCount: user.streakCount || 0,
          isPaid: user.isPaid,
          subscriptionType: user.subscriptionType,
          subscriptionExpiresAt: user.subscriptionExpiresAt,
          subscriptionCancelled: user.subscriptionCancelled || false,
          isVerified: user.isVerified, // Include verification status
          subscription: subscriptionStatus,
        },
      },
      "Hyrje me sukses",
    ),
  )
})
// Add new endpoint for requesting manual verification
const requestVerification = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)

  if (!user) {
    throw new ApiError(404, "User not found")
  }

  if (user.isVerified) {
    throw new ApiError(400, "Email-i juaj është tashmë i verifikuar")
  }

  // Send email to admin for manual verification
  const message = `
<html>
<body style="font-family:Arial,sans-serif;margin:0;padding:20px;background:#f4f4f4;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;">
    <div style="background:#007bff;padding:30px;text-align:center;">
      <h1 style="color:#fff;margin:0;">Kërkesë për Verifikim</h1>
    </div>
    <div style="padding:30px;">
      <p style="font-size:16px;color:#333;margin:0 0 20px;">Një përdorues ka kërkuar verifikimin e email-it:</p>
      <div style="background:#f8f9fa;padding:15px;border-radius:5px;margin-bottom:20px;">
        <p style="margin:5px 0;"><strong>Emri:</strong> ${user.emri} ${user.mbiemri}</p>
        <p style="margin:5px 0;"><strong>Email:</strong> ${user.email}</p>
        <p style="margin:5px 0;"><strong>ID:</strong> ${user._id}</p>
        <p style="margin:5px 0;"><strong>Data e regjistrimit:</strong> ${user.createdAt}</p>
      </div>
      <p style="font-size:14px;color:#666;">Ju lutem verifikoni këtë përdorues manualisht në panel.</p>
    </div>
  </div>
</body>
</html>
`

  await sendEmail({
    to: "info@gjuhagjemrane.com",
    subject: `Kërkesë për verifikim - ${user.email}`,
    htmlContent: message,
  })

  res.json(new ApiResponse(200, {}, "Kërkesa për verifikim u dërgua me sukses. Do t'ju njoftojmë kur të verifikohet."))
})


const logout = asyncHandler(async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "")

  if (!token) {
    throw new ApiError(400, "No token provided")
  }

  // Deactivate the session
  const session = await Session.findOne({ token, userId: req.user.id })

  if (session) {
    session.isActive = false
    await session.save()
  }

  res.json(new ApiResponse(200, {}, "Logged out successfully"))
})

// @desc    Get active sessions for current user
// @route   GET /api/auth/sessions
// @access  Private
const getActiveSessions = asyncHandler(async (req, res) => {
  const sessions = await Session.getActiveSessions(req.user.id)

  const formattedSessions = sessions.map((session) => ({
    id: session._id,
    deviceType: session.deviceType,
    deviceInfo: {
      browser: session.deviceInfo.browser,
      os: session.deviceInfo.os,
    },
    lastActivity: session.lastActivity,
    createdAt: session.createdAt,
    isCurrent: session.token === req.headers.authorization?.replace("Bearer ", ""),
  }))

  res.json(
    new ApiResponse(200, {
      sessions: formattedSessions,
      count: formattedSessions.length,
      limit: 2,
    }),
  )
})

// @desc    Logout from specific device/session
// @route   DELETE /api/auth/sessions/:sessionId
// @access  Private
const logoutFromDevice = asyncHandler(async (req, res) => {
  const { sessionId } = req.params

  const session = await Session.findOne({
    _id: sessionId,
    userId: req.user.id,
  })

  if (!session) {
    throw new ApiError(404, "Session not found")
  }

  session.isActive = false
  await session.save()

  res.json(new ApiResponse(200, {}, "Device logged out successfully"))
})

const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)

  if (!user) {
    throw new ApiError(404, "User not found")
  }

  // ============ CHECK AND UPDATE SUBSCRIPTION STATUS ============
  const now = new Date()
  const expiresAt = user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt) : null
  
  // If subscription expired, revoke access immediately
  if (expiresAt && expiresAt <= now && user.isPaid) {
    console.log(`[GetMe] User ${user._id} subscription expired, revoking access`)
    user.isPaid = false
    user.isActive = false
    user.subscriptionCancelled = false // Reset cancelled flag
    await user.save()
  }
  // ============ END OF CHECK ============

  const avatarUrl = user.avatarStyle
    ? `https://api.dicebear.com/7.x/${user.avatarStyle}/svg?seed=${user._id}`
    : `https://api.dicebear.com/7.x/adventurer/svg?seed=${user._id}`

  const subscriptionStatus = calculateSubscriptionStatus(user)

 res.json(
  new ApiResponse(200, {
    user: {
      id: user._id,
      firstName: user.emri,
      lastName: user.mbiemri,
      emri: user.emri,
      mbiemri: user.mbiemri,
      email: user.email,
      role: user.role,
      xp: user.xp,
      level: user.level,
      avatarUrl,
      avatarStyle: user.avatarStyle || "adventurer",
      studyHours: user.studyHours,
      completedTests: user.completedTests,
      achievements: user.achievements,
      streakCount: user.streakCount || 0,
      isPaid: user.isPaid,
      subscriptionType: user.subscriptionType,
      subscriptionExpiresAt: user.subscriptionExpiresAt,
      subscriptionCancelled: user.subscriptionCancelled || false,
      isVerified: user.isVerified || false, // Add this line
      subscription: subscriptionStatus,
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
    to: user.email,
    subject: "Kërkesa për rivendosjen e fjalëkalimit",
    htmlContent: message,
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

  await Session.updateMany({ userId: user._id }, { isActive: false })

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
  logout,
  getActiveSessions,
  logoutFromDevice,
  getMe,
  forgotPassword,
  resetPassword,
  verifyEmail,
  requestVerification
}