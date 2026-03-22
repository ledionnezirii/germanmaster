const mongoose = require("mongoose")

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ─── Source ───────────────────────────────────────────────────────────────
    source: {
      type: String,
      enum: ["paddle", "revenuecat"],
      default: "paddle",
    },

    // ─── Paddle fields (web) ──────────────────────────────────────────────────
    paddleSubscriptionId: {
      type: String,
    },
    paddleTransactionId: {
      type: String,
      // Not required — RevenueCat payments don't have this
    },
    paddleCustomerId: {
      type: String,
      // Not required — RevenueCat payments don't have this
    },

    // ─── RevenueCat fields (mobile) ───────────────────────────────────────────
    revenuecatTransactionId: {
      type: String,
    },
    revenuecatOriginalTransactionId: {
      type: String,
    },
    revenuecatAppUserId: {
      type: String,
    },
    platform: {
      type: String,
      enum: ["ios", "android", "web", null],
      default: null,
    },

    // ─── Shared fields ────────────────────────────────────────────────────────
    priceId: {
      type: String,
      required: true,
    },
    productId: {
      type: String,
    },
    subscriptionType: {
      type: String,
      enum: ["1_day", "1_month", "3_months", "1_year"],
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "past_due", "paused", "cancelled", "trialing", "completed"],
      default: "active",
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "EUR",
    },
    billingCycle: {
      type: String,
      enum: ["monthly", "quarterly", "yearly", "daily"],
      required: true,
    },
    nextBillingDate: Date,
    cancelledAt: Date,
    pausedAt: Date,
    resumedAt: Date,
    expiresAt: {
      type: Date,
      required: true,
    },
    cancelledBy: {
      type: String,
      enum: ["user", "admin", "paddle", "revenuecat", "payment_failed"],
    },
    scheduledCancellationDate: {
      type: Date,
    },
    webhookEvents: [
      {
        eventType: String,
        eventId: String,
        receivedAt: {
          type: Date,
          default: Date.now,
        },
        data: mongoose.Schema.Types.Mixed,
      },
    ],
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
)

// ─── Indexes ─────────────────────────────────────────────────────────────────
paymentSchema.index({ userId: 1, status: 1 })
paymentSchema.index({ paddleTransactionId: 1 }, { unique: true, sparse: true })
paymentSchema.index({ paddleSubscriptionId: 1 }, { unique: true, sparse: true })
paymentSchema.index({ revenuecatTransactionId: 1 }, { unique: true, sparse: true })
paymentSchema.index({ expiresAt: 1 })
paymentSchema.index({ status: 1 })
paymentSchema.index({ source: 1 })
paymentSchema.index({ scheduledCancellationDate: 1 })

module.exports = mongoose.model("Payment", paymentSchema)