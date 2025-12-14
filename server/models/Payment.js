const mongoose = require("mongoose")

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    paddleSubscriptionId: {
      type: String,
      sparse: true,
    },
    paddleTransactionId: {
      type: String,
      required: true,
      unique: true,
    },
    paddleCustomerId: {
      type: String,
      required: true,
    },
    priceId: {
      type: String,
      required: true,
    },
    productId: {
      type: String,
      required: false,
    },
    subscriptionType: {
      type: String,
      enum: ["1_month", "3_months", "1_year"],
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
      required: true,
      default: "EUR",
    },
    billingCycle: {
      type: String,
      enum: ["monthly", "quarterly", "yearly"],
      required: true,
    },
    nextBillingDate: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    pausedAt: {
      type: Date,
    },
    resumedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
      required: true,
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
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  },
)

paymentSchema.index({ userId: 1, status: 1 })
paymentSchema.index({ paddleSubscriptionId: 1 })
paymentSchema.index({ paddleTransactionId: 1 })
paymentSchema.index({ expiresAt: 1 })

module.exports = mongoose.model("Payment", paymentSchema)
