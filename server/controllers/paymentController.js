const Payment = require("../models/Payment");
const User = require("../models/User");
const crypto = require("crypto");

const PROJECT_ID = "test_project";
const PASSWORD = "test_secret";

// Subscription prices and durations (in days)
const SUBSCRIPTIONS = {
  "1_month": { price: 10, days: 30 },
  "3_months": { price: 20, days: 90 },
  "1_year": { price: 100, days: 365 },
};

// @desc Create payment
exports.createPayment = async (req, res) => {
  try {
    const { orderId, userId, subscriptionType } = req.body;

    if (!SUBSCRIPTIONS.hasOwnProperty(subscriptionType)) {
      return res.status(400).json({ error: "Invalid subscription type" });
    }

    const amount = SUBSCRIPTIONS[subscriptionType].price;

    // Ideally, generate orderId server-side if not provided
    const paymentOrderId = orderId || crypto.randomUUID();

    // Save payment in DB
    const payment = await Payment.create({
      user: userId,
      orderId: paymentOrderId,
      amount,
      subscriptionType,
    });

    // Dummy payment URL (replace with real Paysera URL later)
    const paymentUrl = `https://paysera.test/pay?projectid=${PROJECT_ID}&orderid=${paymentOrderId}&amount=${amount}`;

    res.json({ message: "Payment created", url: paymentUrl, payment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// @desc Callback from Paysera
exports.handleCallback = async (req, res) => {
  try {
    const { orderId, status, userId } = req.body;

    const payment = await Payment.findOneAndUpdate(
      { orderId },
      { status: status || "success" },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    // If payment successful, update user subscription info
    if (status === "success") {
      const user = await User.findById(userId);
      if (!user) throw new Error("User not found");

      const now = new Date();
      // Calculate new expiry date
      const baseDate = user.subscriptionExpiresAt && user.subscriptionExpiresAt > now
        ? user.subscriptionExpiresAt
        : now;

      const daysToAdd = SUBSCRIPTIONS[payment.subscriptionType].days;
      const newExpiry = new Date(baseDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

      await User.findByIdAndUpdate(userId, {
        isPaid: true,
        subscriptionType: payment.subscriptionType,
        subscriptionExpiresAt: newExpiry,
        trialStartedAt: undefined,
      });
    }

    res.json({ message: "Callback handled", payment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// @desc Success page
exports.successPage = (req, res) => {
  res.send("Payment successful!");
};

// @desc Cancel page
exports.cancelPage = (req, res) => {
  res.send("Payment cancelled.");
};
