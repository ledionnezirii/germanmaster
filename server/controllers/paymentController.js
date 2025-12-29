const Payment = require("../models/Payment")
const User = require("../models/User")
const crypto = require("crypto")
const logger = require("../utils/logger")

// Paddle SDK for subscription management
let paddleClient = null
try {
  const { Paddle, Environment } = require("@paddle/paddle-node-sdk")
  paddleClient = new Paddle(process.env.PADDLE_API_KEY_TEST, {
    environment: Environment.sandbox,
  })
  logger.info("Paddle Client initialized for subscription management")
} catch (err) {
  logger.warn("Paddle SDK not available, cancellation via API disabled:", err.message)
}

// Validate user for checkout
exports.createCheckoutSession = async (req, res) => {
  logger.debug("==================== CREATE CHECKOUT SESSION ====================")
  logger.debug("Request body:", JSON.stringify(req.body, null, 2))

  try {
    const { userId, priceId } = req.body

    logger.debug("Extracted userId:", userId)
    logger.debug("Extracted priceId:", priceId)

    if (!userId || !priceId) {
      logger.warn("Missing required fields for checkout")
      return res.status(400).json({
        success: false,
        message: "User ID and Price ID are required",
      })
    }

    logger.debug("Searching for user in database...")
    const user = await User.findById(userId)

    if (!user) {
      logger.warn("User not found in database:", userId)
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    logger.debug("User found:", user.email)
    logger.info("Checkout validated for user:", userId)

    res.status(200).json({
      success: true,
      message: "Checkout validated, proceed with Paddle.js",
      data: {
        userId: userId,
        email: user.email,
      },
    })
  } catch (error) {
    logger.error("Checkout validation error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to validate checkout",
      error: error.message,
    })
  }
}

// Handle Paddle webhooks
exports.handleWebhook = async (req, res) => {
  logger.info("WEBHOOK RECEIVED AT:", new Date().toISOString())

  try {
    const signature = req.headers["paddle-signature"]
    const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET_TEST

    logger.debug("Webhook Headers:", JSON.stringify(req.headers, null, 2))
    logger.debug("Signature present:", !!signature)

    if (!signature) {
      logger.error("No signature header found")
      return res.status(401).json({ success: false, message: "No signature" })
    }

    if (!webhookSecret) {
      logger.error("No webhook secret configured in environment")
      return res.status(500).json({ success: false, message: "Server config error" })
    }

    let rawBody
    let event

    if (Buffer.isBuffer(req.body)) {
      rawBody = req.body.toString("utf8")
      logger.debug("Raw body received as Buffer")
    } else if (typeof req.body === "string") {
      rawBody = req.body
      logger.debug("Raw body received as string")
    } else {
      logger.error("Invalid body format. Type:", typeof req.body)
      return res.status(400).json({ success: false, message: "Invalid body format" })
    }

    logger.debug("Raw body length:", rawBody.length)

    try {
      event = JSON.parse(rawBody)
      logger.debug("Successfully parsed webhook body")
      logger.info("Event type:", event.event_type, "Event ID:", event.event_id)
    } catch (parseError) {
      logger.error("Failed to parse webhook body:", parseError.message)
      return res.status(400).json({ success: false, message: "Invalid JSON body" })
    }

    // Parse signature: ts=xxx;h1=xxx
    logger.debug("Parsing signature...")
    const signatureParts = {}
    signature.split(";").forEach((part) => {
      const [key, ...valueParts] = part.split("=")
      signatureParts[key.trim()] = valueParts.join("=").trim()
    })

    const ts = signatureParts.ts
    const h1 = signatureParts.h1

    if (!ts || !h1) {
      logger.error("Invalid signature format")
      return res.status(401).json({ success: false, message: "Invalid signature format" })
    }

    // Build signed payload and verify
    const payload = ts + ":" + rawBody
    const expectedSignature = crypto.createHmac("sha256", webhookSecret).update(payload).digest("hex")

    logger.debug("Signature verification in progress")

    // Compare signatures using timing-safe comparison
    const receivedBuffer = Buffer.from(h1, "utf8")
    const expectedBuffer = Buffer.from(expectedSignature, "utf8")

    let isValid = false
    if (receivedBuffer.length === expectedBuffer.length) {
      try {
        isValid = crypto.timingSafeEqual(receivedBuffer, expectedBuffer)
      } catch (compareError) {
        logger.error("Signature comparison error:", compareError.message)
        isValid = false
      }
    } else {
      logger.error("Signature length mismatch")
    }

    if (!isValid) {
      logger.error("Signature mismatch - webhook REJECTED")
      return res.status(401).json({ success: false, message: "Invalid signature" })
    }

    logger.info("Webhook signature VERIFIED for event:", event.event_type)

    const eventType = event.event_type

    switch (eventType) {
      case "transaction.completed":
      case "transaction.paid":
        logger.info("Handling transaction completed/paid event")
        await handleTransactionCompleted(event)
        break
      case "subscription.created":
        logger.info("Handling subscription created event")
        await handleSubscriptionCreated(event)
        break
      case "subscription.updated":
        logger.info("Handling subscription updated event")
        await handleSubscriptionUpdated(event)
        break
      case "subscription.cancelled":
        logger.info("Handling subscription cancelled event")
        await handleSubscriptionCancelled(event)
        break
      case "subscription.paused":
        logger.info("Handling subscription paused event")
        await handleSubscriptionPaused(event)
        break
      case "subscription.resumed":
        logger.info("Handling subscription resumed event")
        await handleSubscriptionResumed(event)
        break
      default:
        logger.warn("Unhandled event type:", eventType)
    }

    logger.info("Webhook processing completed successfully")
    res.status(200).json({ success: true, received: true })
  } catch (error) {
    logger.error("Webhook handler error:", error.message, error.stack)
    res.status(500).json({
      success: false,
      message: "Webhook handler failed",
      error: error.message,
    })
  }
}

const handleTransactionCompleted = async (event) => {
  logger.info("===================== TRANSACTION COMPLETED =====================")

  try {
    const data = event.data
    const customData = data.custom_data || {}
    let userId = customData.userId

    logger.debug("Transaction data:", JSON.stringify(data, null, 2))
    logger.debug("Custom data:", JSON.stringify(customData, null, 2))

    // Try to get userId from customer email if not in customData
    if (!userId && data.customer_id) {
      logger.debug("No userId in customData, trying to find user by customer email")
      const customerEmail = data.customer?.email || data.billing_details?.email

      if (customerEmail) {
        const user = await User.findOne({ email: customerEmail })
        if (user) {
          userId = user._id.toString()
          logger.info("Found user by email:", userId)
        } else {
          logger.warn("No user found with email:", customerEmail)
        }
      }
    }

    if (!userId) {
      logger.error("No userId in transaction - cannot process")
      return
    }

    logger.info("Processing transaction for user:", userId)

    const user = await User.findById(userId)

    if (!user) {
      logger.error("User not found in database:", userId)
      return
    }

    logger.debug("User found:", user.email)

    const subscriptionId = data.subscription_id || null
    const amount = data.details?.totals?.total ? Number.parseInt(data.details.totals.total) / 100 : 0
    const currency = data.currency_code || "EUR"

    logger.debug("Transaction amount:", amount, currency)
    logger.debug("Subscription ID:", subscriptionId)

    const priceId = data.items?.[0]?.price_id
    logger.debug("Price ID:", priceId)

    let subscriptionType = "1_month"
    let billingCycle = "monthly"
    let durationDays = 30

    if (priceId?.includes("month") || priceId?.includes("monthly")) {
      subscriptionType = "1_month"
      billingCycle = "monthly"
      durationDays = 30
    } else if (priceId?.includes("3_month") || priceId?.includes("quarterly")) {
      subscriptionType = "3_months"
      billingCycle = "quarterly"
      durationDays = 90
    } else if (priceId?.includes("year") || priceId?.includes("annual")) {
      subscriptionType = "1_year"
      billingCycle = "yearly"
      durationDays = 365
    }

    logger.debug("Subscription details:", { type: subscriptionType, cycle: billingCycle })

    const now = new Date()
    const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000)
    const nextBillingDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000)

    const existingPayment = await Payment.findOne({
      paddleTransactionId: data.id,
    })

    if (existingPayment) {
      logger.warn("Payment already processed for transaction:", data.id)

      if (!user.isPaid) {
        logger.info("Updating user status (was not paid before)")
        user.isPaid = true
        user.subscriptionType = subscriptionType
        user.subscriptionExpiresAt = expiresAt
        user.subscriptionCancelled = false
        user.isActive = true
        await user.save()
        logger.info("User access granted")
      }
      return
    }

    logger.debug("Creating new payment record...")
    let payment
    try {
      payment = await Payment.create({
        userId: userId,
        paddleTransactionId: data.id,
        paddleCustomerId: data.customer_id,
        paddleSubscriptionId: subscriptionId,
        priceId: priceId,
        productId: data.items?.[0]?.product_id,
        subscriptionType: subscriptionType,
        status: "active",
        amount: amount,
        currency: currency,
        billingCycle: billingCycle,
        expiresAt: expiresAt,
        nextBillingDate: nextBillingDate,
        webhookEvents: [
          {
            eventType: event.event_type,
            eventId: event.event_id,
            data: event.data,
          },
        ],
      })

      logger.info("Payment record created successfully. ID:", payment._id)
    } catch (paymentError) {
      logger.error("Error creating payment record:", paymentError.message)
      throw new Error(`Failed to create payment record: ${paymentError.message}`)
    }

    logger.debug("Updating user subscription status...")
    try {
      user.isPaid = true
      user.subscriptionType = subscriptionType
      user.subscriptionExpiresAt = expiresAt
      user.subscriptionCancelled = false
      user.isActive = true

      await user.save()

      logger.info("Payment completed for user:", userId, "- Subscription:", subscriptionType)
    } catch (userError) {
      logger.error("Error updating user:", userError.message)

      await Payment.deleteOne({ _id: payment._id })
      logger.warn("Payment record deleted due to user update failure")
      throw new Error(`Failed to grant user access: ${userError.message}`)
    }
  } catch (error) {
    logger.error("Error in handleTransactionCompleted:", error.message, error.stack)
    throw error
  }
}

const handleSubscriptionCreated = async (event) => {
  logger.info("===================== SUBSCRIPTION CREATED =====================")

  const data = event.data
  const customData = data.custom_data || {}
  const userId = customData.userId

  logger.debug("Subscription data:", JSON.stringify(data, null, 2))

  if (!userId) {
    logger.error("No userId in subscription data")
    return
  }

  logger.info("Subscription created:", data.id, "for user:", userId)
}

const handleSubscriptionUpdated = async (event) => {
  logger.info("===================== SUBSCRIPTION UPDATED =====================")

  const data = event.data
  logger.debug("Subscription data:", JSON.stringify(data, null, 2))

  const payment = await Payment.findOne({
    paddleSubscriptionId: data.id,
  })

  if (!payment) {
    logger.error("Payment not found for subscription:", data.id)
    return
  }

  logger.debug("Payment record found:", payment._id)

  payment.status = data.status
  payment.nextBillingDate = data.next_billed_at ? new Date(data.next_billed_at) : payment.nextBillingDate
  payment.webhookEvents.push({
    eventType: event.event_type,
    eventId: event.event_id,
    data: event.data,
  })

  await payment.save()
  logger.info("Payment record updated")

  const user = await User.findById(payment.userId)
  if (user) {
    user.isPaid = data.status === "active"
    user.isActive = data.status === "active"
    await user.save()
    logger.info("User updated - isPaid:", user.isPaid)
  } else {
    logger.error("User not found:", payment.userId)
  }

  logger.info("Subscription updated:", data.id)
}

const handleSubscriptionCancelled = async (event) => {
  logger.info("===================== SUBSCRIPTION CANCELLED =====================")

  const data = event.data

  const payment = await Payment.findOne({
    paddleSubscriptionId: data.id,
  })

  if (!payment) {
    logger.error("Payment not found for subscription:", data.id)
    return
  }

  payment.status = "cancelled"
  payment.cancelledAt = new Date()
  payment.webhookEvents.push({
    eventType: event.event_type,
    eventId: event.event_id,
    data: event.data,
  })

  await payment.save()
  logger.info("Payment record updated to cancelled")

  const user = await User.findById(payment.userId)
  if (user) {
    user.subscriptionCancelled = true
    user.isActive = false
    await user.save()
    logger.info("User subscription marked as cancelled")
  }

  logger.info("Subscription cancelled:", data.id)
}

const handleSubscriptionPaused = async (event) => {
  logger.info("===================== SUBSCRIPTION PAUSED =====================")

  const data = event.data

  const payment = await Payment.findOne({
    paddleSubscriptionId: data.id,
  })

  if (!payment) {
    logger.error("Payment not found for subscription:", data.id)
    return
  }

  payment.status = "paused"
  payment.webhookEvents.push({
    eventType: event.event_type,
    eventId: event.event_id,
    data: event.data,
  })

  await payment.save()

  const user = await User.findById(payment.userId)
  if (user) {
    user.isActive = false
    await user.save()
  }

  logger.info("Subscription paused:", data.id)
}

const handleSubscriptionResumed = async (event) => {
  logger.info("===================== SUBSCRIPTION RESUMED =====================")

  const data = event.data

  const payment = await Payment.findOne({
    paddleSubscriptionId: data.id,
  })

  if (!payment) {
    logger.error("Payment not found for subscription:", data.id)
    return
  }

  payment.status = "active"
  payment.webhookEvents.push({
    eventType: event.event_type,
    eventId: event.event_id,
    data: event.data,
  })

  await payment.save()

  const user = await User.findById(payment.userId)
  if (user) {
    user.isActive = true
    await user.save()
  }

  logger.info("Subscription resumed:", data.id)
}
