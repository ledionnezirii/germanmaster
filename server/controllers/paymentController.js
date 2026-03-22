const Payment = require("../models/Payment")
const User = require("../models/User")
const crypto = require("crypto")

// Validate user for checkout
exports.createCheckoutSession = async (req, res) => {
  console.log("[v0] ==================== CREATE CHECKOUT SESSION ====================")
  console.log("[v0] Request body:", JSON.stringify(req.body, null, 2))

  try {
    const { userId, priceId } = req.body

    console.log("[v0] Extracted userId:", userId)
    console.log("[v0] Extracted priceId:", priceId)

    if (!userId || !priceId) {
      console.log("[v0] ❌ Missing required fields")
      return res.status(400).json({
        success: false,
        message: "User ID and Price ID are required",
      })
    }

    console.log("[v0] Searching for user in database...")
    const user = await User.findById(userId)

    if (!user) {
      console.log("[v0] ❌ User not found in database:", userId)
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    console.log("[v0] ✅ User found:", user.email)

    console.log("[v0] 🔍 Checking for existing active payment...")
    const existingPayment = await Payment.findOne({
      userId: userId,
      status: { $in: ["active", "trialing"] },
    }).sort({ createdAt: -1 })

    if (existingPayment) {
      const now = new Date()
      const expiresAt = new Date(existingPayment.expiresAt)
      const daysRemaining = Math.max(0, Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24)))

      console.log("[v0] ⚠️ User already has active payment:", existingPayment._id)
      console.log("[v0] ⚠️ Subscription type:", existingPayment.subscriptionType)
      console.log("[v0] ⚠️ Days remaining:", daysRemaining)

      return res.status(409).json({
        success: false,
        code: "ALREADY_SUBSCRIBED",
        message: "Ju tashmë keni një abonim aktiv",
        data: {
          subscriptionType: existingPayment.subscriptionType,
          expiresAt: existingPayment.expiresAt,
          daysRemaining: daysRemaining,
          status: existingPayment.status,
        },
      })
    }

    console.log("[v0] ✅ No active payment found, checkout can proceed")
    console.log("[v0] ✅ Checkout validated for user:", userId, "with priceId:", priceId)

    res.status(200).json({
      success: true,
      message: "Checkout validated, proceed with Paddle.js",
      data: {
        userId: userId,
        email: user.email,
      },
    })
  } catch (error) {
    console.error("[v0] ❌❌❌ Checkout validation error:", error)
    console.error("[v0] Error stack:", error.stack)
    res.status(500).json({
      success: false,
      message: "Failed to validate checkout",
      error: error.message,
    })
  }
}

// Handle Paddle webhooks
exports.handleWebhook = async (req, res) => {
  console.log("\n\n")
  console.log("=====================================================================")
  console.log("[v0] 🎯 PADDLE WEBHOOK RECEIVED AT:", new Date().toISOString())
  console.log("=====================================================================")

  try {
    const signature = req.headers["paddle-signature"]
    const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET

    console.log("[v0] 📋 Webhook Headers:", JSON.stringify(req.headers, null, 2))
    console.log("[v0] 🔑 Signature present:", !!signature)
    console.log("[v0] 🔑 Signature value:", signature)
    console.log("[v0] 🔐 Webhook secret present:", !!webhookSecret)
    console.log("[v0] 🔐 Webhook secret length:", webhookSecret ? webhookSecret.length : 0)

    if (!signature) {
      console.error("[v0] ❌ No signature header found")
      return res.status(401).json({ success: false, message: "No signature" })
    }

    if (!webhookSecret) {
      console.error("[v0] ❌ No webhook secret configured in environment")
      return res.status(500).json({ success: false, message: "Server config error" })
    }

    let rawBody
    let event

    console.log("[v0] 📦 req.body type:", typeof req.body)
    console.log("[v0] 📦 req.body is Buffer:", Buffer.isBuffer(req.body))

    if (Buffer.isBuffer(req.body)) {
      rawBody = req.body.toString("utf8")
      console.log("[v0] ✅ Raw body received as Buffer (correct!)")
    } else if (typeof req.body === "string") {
      rawBody = req.body
      console.log("[v0] ⚠️ Raw body received as string")
    } else {
      console.error("[v0] ❌ ERROR: req.body is not Buffer or string. Type:", typeof req.body)
      return res.status(400).json({ success: false, message: "Invalid body format" })
    }

    console.log("[v0] 📏 Raw body length:", rawBody.length)
    console.log("[v0] 📄 Raw body (first 500 chars):", rawBody.substring(0, 500))

    try {
      event = JSON.parse(rawBody)
      console.log("[v0] ✅ Successfully parsed webhook body")
      console.log("[v0] 📋 Event type:", event.event_type)
      console.log("[v0] 📋 Event ID:", event.event_id)
    } catch (parseError) {
      console.error("[v0] ❌ Failed to parse webhook body:", parseError.message)
      return res.status(400).json({ success: false, message: "Invalid JSON body" })
    }

    console.log("[v0] 🔍 Parsing signature...")
    const signatureParts = {}
    signature.split(";").forEach((part) => {
      const [key, ...valueParts] = part.split("=")
      signatureParts[key.trim()] = valueParts.join("=").trim()
    })

    const ts = signatureParts.ts
    const h1 = signatureParts.h1

    if (!ts || !h1) {
      console.error("[v0] ❌ Invalid signature format. Parts:", signatureParts)
      return res.status(401).json({ success: false, message: "Invalid signature format" })
    }

    const payload = ts + ":" + rawBody
    const expectedSignature = crypto.createHmac("sha256", webhookSecret).update(payload).digest("hex")

    const receivedBuffer = Buffer.from(h1, "utf8")
    const expectedBuffer = Buffer.from(expectedSignature, "utf8")

    let isValid = false
    if (receivedBuffer.length === expectedBuffer.length) {
      try {
        isValid = crypto.timingSafeEqual(receivedBuffer, expectedBuffer)
      } catch (compareError) {
        console.error("[v0] ❌ Signature comparison error:", compareError.message)
        isValid = false
      }
    } else {
      console.error("[v0] ❌ Signature length mismatch:", receivedBuffer.length, "vs", expectedBuffer.length)
    }

    if (!isValid) {
      console.error("[v0] ❌❌❌ Signature mismatch - webhook REJECTED")
      return res.status(401).json({ success: false, message: "Invalid signature" })
    }

    console.log("[v0] ✅✅✅ Webhook signature VERIFIED!")

    const eventType = event.event_type
    console.log(`[v0] 🎬 Processing event: ${eventType}`)
    console.log(`[v0] 📋 Full event data:`, JSON.stringify(event, null, 2))

    switch (eventType) {
      case "transaction.completed":
      case "transaction.paid":
        console.log("[v0] 💰 Handling transaction completed/paid event")
        await handleTransactionCompleted(event)
        break
      default:
        console.log(`[v0] ⚠️ Unhandled event type: ${eventType}`)
    }

    console.log("[v0] ✅ Webhook processing completed successfully")
    res.status(200).json({ success: true, received: true })
  } catch (error) {
    console.error("[v0] ❌❌❌ Webhook handler error:", error)
    res.status(500).json({
      success: false,
      message: "Webhook handler failed",
      error: error.message,
    })
  }
}

const handleTransactionCompleted = async (event) => {
  console.log("\n[v0] ===================== TRANSACTION COMPLETED =====================")

  try {
    const data = event.data
    const customData = data.custom_data || {}
    let userId = customData.userId

    console.log("[v0] 📋 Custom data:", JSON.stringify(customData, null, 2))
    console.log("[v0] 👤 UserId from customData:", userId)

    if (!userId && data.customer_id) {
      const customerEmail = data.customer?.email || data.billing_details?.email
      if (customerEmail) {
        const user = await User.findOne({ email: customerEmail })
        if (user) {
          userId = user._id.toString()
          console.log(`[v0] ✅ Found user by email: ${userId}`)
        }
      }
    }

    if (!userId) {
      console.error("[v0] ❌❌❌ No userId in transaction - cannot process")
      return
    }

    const user = await User.findById(userId)
    if (!user) {
      console.error(`[v0] ❌ User not found: ${userId}`)
      return
    }

    const transactionStatus = data.status
    if (transactionStatus !== "completed" && transactionStatus !== "paid") {
      console.error("[v0] ❌ Transaction not completed/paid. Status:", transactionStatus)
      return
    }

    const amount = data.details?.totals?.total ? Number.parseInt(data.details.totals.total) / 100 : 0
    const currency = data.currency_code || "EUR"
    const priceId = data.items?.[0]?.price?.id || data.items?.[0]?.price_id

    console.log("[v0] 🏷️ Price ID:", priceId)

    let subscriptionType = "1_month"
    let billingCycle = "monthly"
    let durationDays = 30
    let matched = false

    const PRICE_DAILY = process.env.PADDLE_PRICE_DAILY
    const PRICE_MONTHLY = process.env.PADDLE_PRICE_MONTHLY
    const PRICE_QUARTERLY = process.env.PADDLE_PRICE_QUARTERLY
    const PRICE_YEARLY = process.env.PADDLE_PRICE_YEARLY

    if (priceId === PRICE_DAILY) {
      subscriptionType = "1_day"; billingCycle = "daily"; durationDays = 1; matched = true
    } else if (priceId === PRICE_QUARTERLY) {
      subscriptionType = "3_months"; billingCycle = "quarterly"; durationDays = 90; matched = true
    } else if (priceId === PRICE_YEARLY) {
      subscriptionType = "1_year"; billingCycle = "yearly"; durationDays = 365; matched = true
    } else if (priceId === PRICE_MONTHLY) {
      subscriptionType = "1_month"; billingCycle = "monthly"; durationDays = 30; matched = true
    }

    if (!matched) {
      if (priceId?.includes("daily")) { subscriptionType = "1_day"; billingCycle = "daily"; durationDays = 1 }
      else if (priceId?.includes("quarterly") || priceId?.includes("3_month")) { subscriptionType = "3_months"; billingCycle = "quarterly"; durationDays = 90 }
      else if (priceId?.includes("year") || priceId?.includes("annual")) { subscriptionType = "1_year"; billingCycle = "yearly"; durationDays = 365 }
      else { subscriptionType = "1_month"; billingCycle = "monthly"; durationDays = 30 }
    }

    const now = new Date()
    const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000)

    // Duplicate check
    const existingPayment = await Payment.findOne({ paddleTransactionId: data.id })
    if (existingPayment) {
      console.log("[v0] ⚠️ Payment already processed for transaction:", data.id)
      if (!user.isPaid) {
        user.isPaid = true
        user.subscriptionType = subscriptionType
        user.subscriptionExpiresAt = expiresAt
        user.subscriptionCancelled = false
        user.isActive = true
        await user.save()
      }
      return
    }

    let payment
    try {
      payment = await Payment.create({
        userId,
        source: "paddle",            // ← explicit source
        paddleTransactionId: data.id,
        paddleCustomerId: data.customer_id,
        priceId,
        productId: data.items?.[0]?.price?.product_id,
        subscriptionType,
        status: "active",
        amount,
        currency,
        billingCycle,
        platform: "web",
        expiresAt,
        webhookEvents: [
          {
            eventType: event.event_type,
            eventId: event.event_id,
            data: event.data,
          },
        ],
      })
      console.log("[v0] ✅ Payment record created:", payment._id)
    } catch (paymentError) {
      console.error("[v0] ❌ Error creating payment record:", paymentError.message)
      throw new Error(`Failed to create payment record: ${paymentError.message}`)
    }

    try {
      user.isPaid = true
      user.subscriptionType = subscriptionType
      user.subscriptionExpiresAt = expiresAt
      user.subscriptionCancelled = false
      user.isActive = true
      await user.save()
      console.log(`[v0] 🎉 Access granted to ${userId} until ${expiresAt.toISOString()}`)
    } catch (userError) {
      console.error("[v0] ❌ Error updating user:", userError.message)
      await Payment.deleteOne({ _id: payment._id })
      throw new Error(`Failed to update user: ${userError.message}`)
    }
  } catch (error) {
    console.error("[v0] ❌❌❌ Error in handleTransactionCompleted:", error)
    throw error
  }
}

exports.getUserSubscription = async (req, res) => {
  console.log("\n[v0] ==================== GET USER SUBSCRIPTION ====================")

  try {
    const { userId } = req.params

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" })
    }

    const payment = await Payment.findOne({
      userId,
      status: { $in: ["active", "trialing"] },
    }).sort({ createdAt: -1 })

    if (!payment) {
      const user = await User.findById(userId)
      if (user && user.subscriptionType === "free_trial") {
        const now = new Date()
        const isTrialActive = user.subscriptionExpiresAt && user.subscriptionExpiresAt > now
        return res.status(200).json({
          success: true,
          data: {
            subscriptionType: "free_trial",
            status: isTrialActive ? "active" : "expired",
            expiresAt: user.subscriptionExpiresAt,
            trialStartedAt: user.trialStartedAt,
          },
        })
      }
      return res.status(404).json({ success: false, message: "No active subscription found" })
    }

    res.status(200).json({
      success: true,
      data: {
        subscriptionType: payment.subscriptionType,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        expiresAt: payment.expiresAt,
        source: payment.source,
        platform: payment.platform,
      },
    })
  } catch (error) {
    console.error("[v0] ❌ Get subscription error:", error)
    res.status(500).json({ success: false, message: "Failed to fetch subscription", error: error.message })
  }
}

exports.getUserPayments = async (req, res) => {
  console.log("\n[v0] ==================== GET USER PAYMENTS ====================")

  try {
    const { userId } = req.params

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" })
    }

    const payments = await Payment.find({ userId }).sort({ createdAt: -1 })

    res.status(200).json({ success: true, data: payments })
  } catch (error) {
    console.error("[v0] ❌ Get payments error:", error)
    res.status(500).json({ success: false, message: "Failed to fetch payments", error: error.message })
  }
}