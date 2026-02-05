const User = require("../models/User")
const Session = require("../models/Session")
const { generateToken } = require("../utils/generateToken")
const { ApiError } = require("../utils/ApiError")
const { ApiResponse } = require("../utils/ApiResponse")
const { asyncHandler } = require("../utils/asyncHandler")
const crypto = require("crypto")
const sendEmail = require("../utils/sendEmail")
const { getEmailTemplate, getPlainTextVersion, getVerificationCodeTemplate, getVerificationCodeTextVersion } = require("../utils/emailTemplates");

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

// @desc    Register user with 2-day free trial
// @route   POST /api/auth/signup
// @access  Public
const signup = asyncHandler(async (req, res) => {
  const { emri, mbiemri, email, password, termsAccepted } = req.body

  if (!termsAccepted) {
    throw new ApiError(400, "Ju duhet të pranoni Kushtet dhe Afatet për t'u regjistruar")
  }

  const normalizedEmail = normalizeGmailAddress(email)

  // Check if user exists with normalized email
  const userExists = await User.findOne({ email: normalizedEmail })
  if (userExists) {
    throw new ApiError(400, "Përdoruesi ekziston tashmë me këtë email")
  }

  // Set role (admin or user)
  const role = normalizedEmail === process.env.ADMIN_EMAIL ? "admin" : "user"

  // Set free trial start and expiry (2 days from now)
  const now = new Date()
  const trialExpiry = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000) // 2 days later

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
  })

  if (user) {
    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationCode = verificationCode;
    user.verificationCodeExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    user.streakCount = 1
    user.lastLogin = new Date()
    await user.save({ validateBeforeSave: false })

const emailContent = {
  title: "Verifikimi i Email-it",
  userName: user.emri,
  message: "Ju lutem shkruani kodin e mëposhtëm për të verifikuar email-in tuaj.",
  verificationCode: verificationCode,
};

const htmlContent = getVerificationCodeTemplate(emailContent);
const textContent = getVerificationCodeTextVersion(emailContent);

await sendEmail({
  to: user.email,
  subject: "Verifikoni email-in tuaj",
  htmlContent,
  textContent,
});

    // Respond without token yet, user must verify first
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          {},
          "Përdoruesi u regjistrua me sukses. Ju lutem kontrolloni email-in për të verifikuar llogarinë tuaj.",
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

  if (!user.isVerified) {
    throw new ApiError(401, "Ju lutem verifikoni email-in tuaj para se të hyni")
  }

  const isMatch = await user.comparePassword(password)
  if (!isMatch) {
    throw new ApiError(401, "Kredenciale të pavlefshme")
  }

  // Check active sessions count
  const activeSessionsCount = await Session.getActiveSessionsCount(user._id)

  // If user has 2 or more active sessions, invalidate ALL sessions
  if (activeSessionsCount >= 2) {
    console.log(`[AUTH] User ${user.email} has ${activeSessionsCount} active sessions. Invalidating all sessions.`)
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

  // Create new session for this device
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
          firstName: user.emri,  // Add firstName alias
          lastName: user.mbiemri, // Add lastName alias
          emri: user.emri,
          mbiemri: user.mbiemri,
          email: user.email,
          role: user.role,
          xp: user.xp,
          level: user.level,
          avatarUrl,
          avatarStyle: user.avatarStyle || "adventurer",
          streakCount: user.streakCount || 0,
          // Add these fields that frontend needs
          isPaid: user.isPaid,
          subscriptionType: user.subscriptionType,
          subscriptionExpiresAt: user.subscriptionExpiresAt,
          subscriptionCancelled: user.subscriptionCancelled || false,
          // Computed subscription object
          subscription: subscriptionStatus,
        },
      },
      "Hyrje me sukses",
    ),
  )
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
        firstName: user.emri,  // Add firstName alias
        lastName: user.mbiemri, // Add lastName alias
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
        // Add these fields that frontend needs
        isPaid: user.isPaid,
        subscriptionType: user.subscriptionType,
        subscriptionExpiresAt: user.subscriptionExpiresAt,
        subscriptionCancelled: user.subscriptionCancelled || false,
        // Computed subscription object
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

  // Generate 6-digit reset code
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  user.resetPasswordCode = resetCode;
  user.resetPasswordCodeExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
  await user.save({ validateBeforeSave: false })

  console.log("RESET CODE:", resetCode)

  // Send reset email with code
const emailContent = {
  title: "Rivendosja e Fjalëkalimit",
  userName: user.emri,
  message: "Keni kërkuar rivendosjen e fjalëkalimit. Shkruani kodin e mëposhtëm për të vendosur një fjalëkalim të ri.",
  verificationCode: resetCode,
};

const htmlContent = getVerificationCodeTemplate(emailContent);
const textContent = getVerificationCodeTextVersion(emailContent);

await sendEmail({
  to: user.email,
  subject: "Kërkesa për rivendosjen e fjalëkalimit",
  htmlContent,
  textContent,
});

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

const resetPasswordWithCode = asyncHandler(async (req, res) => {
  const { code, newPassword } = req.body

  const user = await User.findOne({
    resetPasswordCode: code,
    resetPasswordCodeExpires: { $gt: Date.now() },
  })

  if (!user) throw new ApiError(400, "Kodi i rivendosjes së fjalëkalimit është i pavlefshëm ose ka skaduar")

  user.password = newPassword
  user.resetPasswordCode = undefined
  user.resetPasswordCodeExpires = undefined
  await user.save()

  await Session.updateMany({ userId: user._id }, { isActive: false })

  res.json(new ApiResponse(200, {}, "Fjalëkalimi u rivendos me sukses"))
})

const verifyEmail = asyncHandler(async (req, res) => {
  // Support both POST (code) and GET (token) methods
  const { code } = req.body;
  const { token } = req.params;

  let user;

  if (code) {
    // New method: POST with code
    user = await User.findOne({
      verificationCode: code,
      verificationCodeExpires: { $gt: Date.now() },
    });
    
    if (!user) {
      throw new ApiError(400, "Kodi verifikimi i pavlefshëm ose ka skaduar");
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
  } else if (token) {
    // Old method: GET with token (for backward compatibility)
    user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() },
    });
    
    if (!user) {
      throw new ApiError(400, "Token verifikimi i pavlefshëm ose ka skaduar");
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
  } else {
    throw new ApiError(400, "Kodi ose token verifikimi i nevojshëm");
  }

  await user.save();
  res.json(new ApiResponse(200, {}, "Email-i u verifikua me sukses"));
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
  resetPasswordWithCode,
  verifyEmail,
}
