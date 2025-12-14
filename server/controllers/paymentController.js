const User = require("../models/User")
const Payment = require("../models/Payment")
const { asyncHandler } = require("../utils/asyncHandler")
const { ApiError } = require("../utils/ApiError")
const { ApiResponse } = require("../utils/ApiResponse")

// Helper function to map Paddle subscription intervals to our database enum
const mapBillingCycle = (interval) => {
  switch (interval) {
    case "month":
      return "monthly"
    case "quarter":
      return "quarterly"
    case "year":
      return "yearly"
    default:
      return "monthly"
  }
}

// Helper function to map price IDs to subscription types
const mapPriceIdToSubscriptionType = (priceId) => {
  const priceMap = {
    pri_01kaeqvvk2kdc02p39zrb8gne3: "1_month", // Test plan (1 euro)
    pri_01kcc0xq5n2zkh5926cfcnyakr: "1_month", // 1 month
    pri_01kcc0z1n998kjm07xxn5kph81: "3_months", // 3 months
    pri_01kcc103vzc3xm5th0w3e3wrfx: "1_year", // 1 year
  }
  return priceMap[priceId] || "1_month"
}

// Helper function to calculate expiry date based on subscription type
const calculateExpiryDate = (subscriptionType) => {
  const now = new Date()
  switch (subscriptionType) {
    case "1_month":
      return new Date(now.setMonth(now.getMonth() + 1))
    case "3_months":
      return new Date(now.setMonth(now.getMonth() + 3))
    case "1_year":
      return new Date(now.setFullYear(now.getFullYear() + 1))
    default:
      return new Date(now.setMonth(now.getMonth() + 1))
  }
}

// @desc    Create checkout session (not needed for Paddle Overlay, but kept for API consistency)
// @route   POST /api/payments/checkout/create
// @access  Private
const createCheckoutSession = asyncHandler(async (req, res) => {
  const { userId, priceId } = req.body

  if (!userId || !priceId) {
    throw new ApiError(400, "userId and priceId are required")
  }

  // Verify user exists
  const user = await User.findById(userId)
  if (!user) {
    throw new ApiError(404, "User not found")
  }

  // Return success - actual checkout is handled by Paddle.js on frontend
  res.json(
    new ApiResponse(200, {
      message: "Ready for checkout",
      userId,
      priceId,
      email: user.email,
    }),
  )
})

// @desc    Get user subscription details
// @route   GET /api/payments/subscription/:userId
// @access  Private
const getUserSubscription = asyncHandler(async (req, res) => {
  const { userId } = req.params

  // Get the most recent active payment for this user
  const payment = await Payment.findOne({
    userId,
    status: { $in: ["active", "trialing"] },
  }).sort({ createdAt: -1 })

  const user = await User.findById(userId)

  if (!user) {
    throw new ApiError(404, "User not found")
  }

  const now = new Date()
  const subscriptionActive = user.subscriptionExpiresAt && user.subscriptionExpiresAt > now

  res.json(
    new ApiResponse(200, {
      subscription: {
        active: subscriptionActive,
        type: user.subscriptionType,
        expiresAt: user.subscriptionExpiresAt,
        trialStartedAt: user.trialStartedAt,
        isPaid: user.isPaid,
      },
      payment: payment || null,
    }),
  )
})

// @desc    Get user payment history
// @route   GET /api/payments/:userId
// @access  Private
const getUserPayments = asyncHandler(async (req, res) => {
  const { userId } = req.params

  const payments = await Payment.find({ userId }).sort({ createdAt: -1 })

  res.json(
    new ApiResponse(200, {
      payments,
      count: payments.length,
    }),
  )
})

// @desc    Cancel subscription
// @route   POST /api/payments/subscription/cancel
// @access  Private
const cancelSubscription = asyncHandler(async (req, res) => {
  const { userId } = req.body

  if (!userId) {
    throw new ApiError(400, "userId is required")
  }

  const user = await User.findById(userId)
  if (!user) {
    throw new ApiError(404, "User not found")
  }

  // Find active payment/subscription
  const payment = await Payment.findOne({
    userId,
    status: { $in: ["active", "trialing"] },
  }).sort({ createdAt: -1 })

  if (!payment) {
    throw new ApiError(404, "No active subscription found")
  }

  // Update payment status
  payment.status = "cancelled"
  payment.cancelledAt = new Date()
  await payment.save()

  // Note: In production, you should also cancel via Paddle API
  // const Paddle = require("@paddle/paddle-node-sdk");
  // const paddle = new Paddle(process.env.PADDLE_API_KEY);
  // await paddle.subscriptions.cancel(payment.paddleSubscriptionId);

  res.json(
    new ApiResponse(200, {
      message: "Subscription cancelled successfully",
    }),
  )
})

// @desc    Handle Paddle webhook events
// @route   POST /api/payments/webhook
// @access  Public (but verified via Paddle signature)
const handleWebhook = asyncHandler(async (req, res) => {
  const event = req.body

  console.log("📥 Paddle Webhook Received:", event.event_type)
  console.log("Webhook Data:", JSON.stringify(event, null, 2))

  try {
    switch (event.event_type) {
      case "transaction.completed":
        await handleTransactionCompleted(event)
        break

      case "subscription.created":
        await handleSubscriptionCreated(event)
        break

      case "subscription.updated":
        await handleSubscriptionUpdated(event)
        break

      case "subscription.canceled":
        await handleSubscriptionCanceled(event)
        break

      case "subscription.paused":
        await handleSubscriptionPaused(event)
        break

      case "subscription.resumed":
        await handleSubscriptionResumed(event)
        break

      default:
        console.log(`Unhandled webhook event: ${event.event_type}`)
    }

    // Always respond with 200 to acknowledge receipt
    res.status(200).json({ received: true })
  } catch (error) {
    console.error("Webhook processing error:", error)
    // Still respond with 200 to prevent Paddle from retrying
    res.status(200).json({ received: true, error: error.message })
  }
})

// Handle transaction completed event
async function handleTransactionCompleted(event) {
  const data = event.data
  const customData = data.custom_data || {}
  const userId = customData.userId

  if (!userId) {
    console.error("No userId in custom_data")
    return
  }

  const user = await User.findById(userId)
  if (!user) {
    console.error(`User not found: ${userId}`)
    return
  }

  // Get the first item from the transaction (we only sell one item at a time)
  const item = data.items && data.items[0]
  if (!item) {
    console.error("No items in transaction")
    return
  }

  const priceId = item.price.id
  const subscriptionType = mapPriceIdToSubscriptionType(priceId)
  const expiryDate = calculateExpiryDate(subscriptionType)

  // Update user subscription
  user.isPaid = true
  user.subscriptionType = subscriptionType
  user.subscriptionExpiresAt = expiryDate
  await user.save()

  // Create or update payment record
  const existingPayment = await Payment.findOne({
    paddleTransactionId: data.id,
  })

  if (!existingPayment) {
    await Payment.create({
      userId: user._id,
      paddleTransactionId: data.id,
      paddleCustomerId: data.customer_id,
      paddleSubscriptionId: data.subscription_id || null,
      priceId: priceId,
      productId: item.price.product_id,
      subscriptionType: subscriptionType,
      status: data.subscription_id ? "active" : "completed",
      amount: Number.parseFloat(data.details.totals.total) / 100, // Paddle sends in cents
      currency: data.currency_code,
      billingCycle: mapBillingCycle(item.price.billing_cycle?.interval || "month"),
      expiresAt: expiryDate,
      nextBillingDate: data.subscription_id ? expiryDate : null,
      webhookEvents: [
        {
          eventType: "transaction.completed",
          eventId: event.event_id,
          receivedAt: new Date(),
          data: event,
        },
      ],
    })
  }

  console.log(`✅ Transaction completed for user ${user.email} - ${subscriptionType}`)
}

// Handle subscription created event
async function handleSubscriptionCreated(event) {
  const data = event.data
  const customData = data.custom_data || {}
  const userId = customData.userId

  if (!userId) {
    console.error("No userId in custom_data")
    return
  }

  // Find existing payment by subscription ID and update it
  const payment = await Payment.findOne({
    paddleSubscriptionId: data.id,
  })

  if (payment) {
    payment.status = data.status === "trialing" ? "trialing" : "active"
    payment.webhookEvents.push({
      eventType: "subscription.created",
      eventId: event.event_id,
      receivedAt: new Date(),
      data: event,
    })
    await payment.save()
  }

  console.log(`✅ Subscription created: ${data.id}`)
}

// Handle subscription updated event
async function handleSubscriptionUpdated(event) {
  const data = event.data

  const payment = await Payment.findOne({
    paddleSubscriptionId: data.id,
  })

  if (payment) {
    payment.status = data.status
    if (data.next_billed_at) {
      payment.nextBillingDate = new Date(data.next_billed_at)
    }
    payment.webhookEvents.push({
      eventType: "subscription.updated",
      eventId: event.event_id,
      receivedAt: new Date(),
      data: event,
    })
    await payment.save()

    // Update user expiry date
    const user = await User.findById(payment.userId)
    if (user && payment.expiresAt) {
      user.subscriptionExpiresAt = payment.expiresAt
      await user.save()
    }
  }

  console.log(`✅ Subscription updated: ${data.id}`)
}

// Handle subscription canceled event
async function handleSubscriptionCanceled(event) {
  const data = event.data

  const payment = await Payment.findOne({
    paddleSubscriptionId: data.id,
  })

  if (payment) {
    payment.status = "cancelled"
    payment.cancelledAt = new Date()
    payment.webhookEvents.push({
      eventType: "subscription.canceled",
      eventId: event.event_id,
      receivedAt: new Date(),
      data: event,
    })
    await payment.save()

    // Note: Don't immediately disable user access - let them use until expiry
    console.log(`✅ Subscription canceled: ${data.id}`)
  }
}

// Handle subscription paused event
async function handleSubscriptionPaused(event) {
  const data = event.data

  const payment = await Payment.findOne({
    paddleSubscriptionId: data.id,
  })

  if (payment) {
    payment.status = "paused"
    payment.pausedAt = new Date()
    payment.webhookEvents.push({
      eventType: "subscription.paused",
      eventId: event.event_id,
      receivedAt: new Date(),
      data: event,
    })
    await payment.save()
  }

  console.log(`✅ Subscription paused: ${data.id}`)
}

// Handle subscription resumed event
async function handleSubscriptionResumed(event) {
  const data = event.data

  const payment = await Payment.findOne({
    paddleSubscriptionId: data.id,
  })

  if (payment) {
    payment.status = "active"
    payment.resumedAt = new Date()
    payment.webhookEvents.push({
      eventType: "subscription.resumed",
      eventId: event.event_id,
      receivedAt: new Date(),
      data: event,
    })
    await payment.save()
  }

  console.log(`✅ Subscription resumed: ${data.id}`)
}

module.exports = {
  createCheckoutSession,
  getUserSubscription,
  getUserPayments,
  cancelSubscription,
  handleWebhook,
}
