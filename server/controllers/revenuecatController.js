const Payment = require("../models/Payment")
const User = require("../models/User")

// ─── Map RevenueCat product IDs → subscription types ─────────────────────────
const PRODUCT_MAP = {
  gjuha_daily:             { subscriptionType: "1_day",    billingCycle: "daily",     durationDays: 1   },
  gjuha_monthly:           { subscriptionType: "1_month",  billingCycle: "monthly",   durationDays: 30  },
  gjuha_quarterly:         { subscriptionType: "3_months", billingCycle: "quarterly", durationDays: 90  },
  gjuha_yearly:            { subscriptionType: "1_year",   billingCycle: "yearly",    durationDays: 365 },
  gjuha_daily_android:     { subscriptionType: "1_day",    billingCycle: "daily",     durationDays: 1   },
  gjuha_monthly_android:   { subscriptionType: "1_month",  billingCycle: "monthly",   durationDays: 30  },
  gjuha_quarterly_android: { subscriptionType: "3_months", billingCycle: "quarterly", durationDays: 90  },
  gjuha_yearly_android:    { subscriptionType: "1_year",   billingCycle: "yearly",    durationDays: 365 },
  // RC Test Store product identifiers
  monthly:                 { subscriptionType: "1_month",  billingCycle: "monthly",   durationDays: 30  },
  quarterly:               { subscriptionType: "3_months", billingCycle: "quarterly", durationDays: 90  },
  annual:                  { subscriptionType: "1_year",   billingCycle: "yearly",    durationDays: 365 },
  weekly:                  { subscriptionType: "1_day",    billingCycle: "daily",     durationDays: 7   },
}

function resolveProduct(productId) {
  if (!productId) {
    return { subscriptionType: "1_month", billingCycle: "monthly", durationDays: 30 }
  }
  const exact = PRODUCT_MAP[productId]
  if (exact) return exact

  const lower = PRODUCT_MAP[productId.toLowerCase()]
  if (lower) return lower

  const id = productId.toLowerCase()
  if (id.includes("annual") || id.includes("year"))    return { subscriptionType: "1_year",   billingCycle: "yearly",    durationDays: 365 }
  if (id.includes("quarter") || id.includes("3month")) return { subscriptionType: "3_months", billingCycle: "quarterly", durationDays: 90  }
  if (id.includes("week"))                              return { subscriptionType: "1_day",    billingCycle: "daily",     durationDays: 7   }
  if (id.includes("month"))                             return { subscriptionType: "1_month",  billingCycle: "monthly",   durationDays: 30  }

  console.warn(`[rc] ⚠️ Unknown productId "${productId}", defaulting to 1_month`)
  return { subscriptionType: "1_month", billingCycle: "monthly", durationDays: 30 }
}

// ─── Webhook handler ──────────────────────────────────────────────────────────
exports.handleWebhook = async (req, res) => {
  console.log("\n=====================================================================")
  console.log("[rc] 🎯 REVENUECAT WEBHOOK RECEIVED AT:", new Date().toISOString())
  console.log("=====================================================================")

  try {
    const authHeader = req.headers["authorization"]
    const webhookSecret = process.env.REVENUECAT_WEBHOOK_SECRET

    if (!webhookSecret) {
      console.error("[rc] ❌ REVENUECAT_WEBHOOK_SECRET not set in environment")
      return res.status(500).json({ success: false, message: "Server config error" })
    }

    if (!authHeader || authHeader !== webhookSecret) {
      console.error("[rc] ❌ Invalid or missing Authorization header")
      return res.status(401).json({ success: false, message: "Unauthorized" })
    }

    const event = req.body
    const eventType = event?.event?.type

    console.log("[rc] 📋 Event type:", eventType)

    switch (eventType) {
      case "INITIAL_PURCHASE":
        await handlePurchase(event.event)
        break
      case "RENEWAL":
        await handlePurchase(event.event)
        break
      case "PRODUCT_CHANGE":
        await handlePurchase(event.event)
        break
      case "CANCELLATION":
        await handleCancellation(event.event)
        break
      case "EXPIRATION":
        await handleExpiration(event.event)
        break
      case "BILLING_ISSUE":
        console.log("[rc] ⚠️ BILLING_ISSUE — not revoking access yet")
        break
      default:
        console.log(`[rc] ℹ️ Unhandled event type: ${eventType}`)
    }

    console.log("[rc] ✅ Webhook processing complete")
    res.status(200).json({ success: true, received: true })
  } catch (error) {
    console.error("[rc] ❌ Webhook handler error:", error.message)
    res.status(500).json({ success: false, message: "Webhook handler failed", error: error.message })
  }
}

// ─── Manual grant ─────────────────────────────────────────────────────────────
// Called from mobile app after a successful RevenueCat purchase
// Used for Test Store (no webhook) and as a fallback
exports.manualGrant = async (req, res) => {
  console.log("\n[rc] ─── manualGrant ───")
  try {
    const { userId, productId, expirationAtMs } = req.body

    if (!userId) {
      return res.status(400).json({ success: false, message: "userId required" })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" })
    }

    const { subscriptionType, billingCycle, durationDays } = resolveProduct(productId)

    const expiresAt = expirationAtMs
      ? new Date(expirationAtMs)
      : new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)

    user.isPaid = true
    user.subscriptionType = subscriptionType
    user.subscriptionExpiresAt = expiresAt
    user.subscriptionCancelled = false
    user.isActive = true
    await user.save()

    console.log(`[rc] ✅ Manual grant for ${userId} — ${subscriptionType} until ${expiresAt.toISOString()}`)

    res.status(200).json({
      success: true,
      data: {
        subscriptionType,
        expiresAt,
        isPaid: true,
      },
    })
  } catch (error) {
    console.error("[rc] ❌ manualGrant error:", error.message)
    res.status(500).json({ success: false, message: error.message })
  }
}

// ─── INITIAL_PURCHASE / RENEWAL / PRODUCT_CHANGE ─────────────────────────────
async function handlePurchase(event) {
  console.log("\n[rc] ─── handlePurchase ───")

  const userId = event.app_user_id
  const transactionId = event.transaction_id
  const originalTransactionId = event.original_transaction_id
  const productId = event.product_id
  const expirationAtMs = event.expiration_at_ms
  const store = event.store

  console.log("[rc] 👤 userId:", userId)
  console.log("[rc] 🧾 transactionId:", transactionId)
  console.log("[rc] 🏷️ productId:", productId)

  if (!userId) { console.error("[rc] ❌ No app_user_id"); return }
  if (!transactionId) { console.error("[rc] ❌ No transaction_id"); return }

  const user = await User.findById(userId)
  if (!user) { console.error(`[rc] ❌ User not found: ${userId}`); return }

  const platform = store === "APP_STORE" ? "ios" : store === "PLAY_STORE" ? "android" : null
  const { subscriptionType, billingCycle, durationDays } = resolveProduct(productId)

  const expiresAt = expirationAtMs
    ? new Date(expirationAtMs)
    : new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)

  const amount = event.price != null ? Math.round(event.price * 100) / 100 : 0
  const currency = event.currency || "EUR"

  const existingPayment = await Payment.findOne({ revenuecatTransactionId: transactionId })
  if (existingPayment) {
    console.log("[rc] ⚠️ Transaction already processed:", transactionId)
    if (!user.isPaid || user.subscriptionExpiresAt < expiresAt) {
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
      source: "revenuecat",
      revenuecatTransactionId: transactionId,
      revenuecatOriginalTransactionId: originalTransactionId,
      revenuecatAppUserId: userId,
      priceId: productId,
      productId,
      subscriptionType,
      status: "active",
      amount,
      currency,
      billingCycle,
      platform,
      expiresAt,
      webhookEvents: [{ eventType: event.type, eventId: transactionId, data: event }],
    })
    console.log("[rc] ✅ Payment record created:", payment._id)
  } catch (paymentError) {
    console.error("[rc] ❌ Error creating payment record:", paymentError.message)
    throw new Error(`Failed to create payment record: ${paymentError.message}`)
  }

  try {
    user.isPaid = true
    user.subscriptionType = subscriptionType
    user.subscriptionExpiresAt = expiresAt
    user.subscriptionCancelled = false
    user.isActive = true
    await user.save()
    console.log(`[rc] 🎉 Access granted to ${userId} until ${expiresAt.toISOString()}`)
  } catch (userError) {
    console.error("[rc] ❌ Error updating user:", userError.message)
    await Payment.deleteOne({ _id: payment._id })
    throw new Error(`Failed to update user: ${userError.message}`)
  }
}

// ─── CANCELLATION ─────────────────────────────────────────────────────────────
async function handleCancellation(event) {
  console.log("\n[rc] ─── handleCancellation ───")
  const userId = event.app_user_id
  if (!userId) { console.error("[rc] ❌ No app_user_id"); return }

  const expiresAt = event.expiration_at_ms ? new Date(event.expiration_at_ms) : null
  const user = await User.findById(userId)
  if (!user) { console.error(`[rc] ❌ User not found: ${userId}`); return }

  user.subscriptionCancelled = true
  if (expiresAt) user.subscriptionExpiresAt = expiresAt
  await user.save()

  await Payment.findOneAndUpdate(
    { userId, source: "revenuecat", status: "active" },
    { status: "cancelled", cancelledAt: new Date(), cancelledBy: "revenuecat" },
    { sort: { createdAt: -1 } }
  )
  console.log(`[rc] ✅ Cancellation recorded for ${userId}`)
}

// ─── EXPIRATION ───────────────────────────────────────────────────────────────
async function handleExpiration(event) {
  console.log("\n[rc] ─── handleExpiration ───")
  const userId = event.app_user_id
  if (!userId) { console.error("[rc] ❌ No app_user_id"); return }

  const user = await User.findById(userId)
  if (!user) { console.error(`[rc] ❌ User not found: ${userId}`); return }

  user.isPaid = false
  user.subscriptionCancelled = true
  await user.save()

  await Payment.findOneAndUpdate(
    { userId, source: "revenuecat", status: { $in: ["active", "cancelled"] } },
    { status: "completed" },
    { sort: { createdAt: -1 } }
  )
  console.log(`[rc] ✅ Access expired and revoked for user: ${userId}`)
}