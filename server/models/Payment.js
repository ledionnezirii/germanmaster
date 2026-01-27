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
      enum: ["monthly", "quarterly", "yearly","daily"],
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

paymentSchema.index({ userId: 1, status: 1 })
paymentSchema.index(
  { paddleSubscriptionId: 1 },
  { unique: true, sparse: true }
)
paymentSchema.index({ expiresAt: 1 })

module.exports = mongoose.model("Payment", paymentSchema)
