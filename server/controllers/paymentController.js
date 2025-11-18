const Payment = require("../models/Payment");
const User = require("../models/User");
const crypto = require("crypto");

// Paddle webhook signature verification
const verifyPaddleWebhook = (req) => {
  const signature = req.headers["paddle-signature"];
  const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return false;
  }

  try {
    // Extract timestamp and signature hash from header
    const [ts, h1] = signature.split(";").map((part) => part.split("=")[1]);

    // Create signature payload
    const payload = ts + ":" + JSON.stringify(req.body);

    // Generate HMAC
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(payload)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(h1),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error("Webhook verification error:", error);
    return false;
  }
};

// Get subscription duration based on subscription type
const getSubscriptionDuration = (subscriptionType) => {
  const durations = {
    "1_month": 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
    "3_months": 90 * 24 * 60 * 60 * 1000, // 90 days
    "1_year": 365 * 24 * 60 * 60 * 1000, // 365 days
  };
  return durations[subscriptionType] || durations["1_month"];
};

// Map subscription type from billing cycle
const mapSubscriptionType = (billingCycle) => {
  const mapping = {
    month: "1_month",
    quarterly: "3_months",
    year: "1_year",
  };
  return mapping[billingCycle] || "1_month";
};

// Create a new checkout session
exports.createCheckoutSession = async (req, res) => {
  try {
    const { userId, priceId } = req.body;

    if (!userId || !priceId) {
      return res.status(400).json({
        success: false,
        message: "User ID and Price ID are required",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // You can return the Paddle checkout URL or price ID
    // The actual checkout is handled on the frontend
    res.status(200).json({
      success: true,
      data: {
        priceId: priceId,
        customerEmail: user.email,
        customData: {
          userId: userId.toString(),
        },
      },
    });
  } catch (error) {
    console.error("Create checkout session error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create checkout session",
      error: error.message,
    });
  }
};

// Handle Paddle webhook events
exports.handleWebhook = async (req, res) => {
  try {
    // Verify webhook signature
    if (!verifyPaddleWebhook(req)) {
      return res.status(401).json({
        success: false,
        message: "Invalid webhook signature",
      });
    }

    const event = req.body;
    const eventType = event.event_type;

    console.log(`Received Paddle webhook: ${eventType}`);

    switch (eventType) {
      case "transaction.completed":
        await handleTransactionCompleted(event);
        break;

      case "subscription.created":
        await handleSubscriptionCreated(event);
        break;

      case "subscription.updated":
        await handleSubscriptionUpdated(event);
        break;

      case "subscription.cancelled":
        await handleSubscriptionCancelled(event);
        break;

      case "subscription.paused":
        await handleSubscriptionPaused(event);
        break;

      case "subscription.resumed":
        await handleSubscriptionResumed(event);
        break;

      case "transaction.payment_failed":
        await handlePaymentFailed(event);
        break;

      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    res.status(200).json({ success: true, received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    res.status(500).json({
      success: false,
      message: "Webhook handler failed",
      error: error.message,
    });
  }
};

// Transaction completed handler
const handleTransactionCompleted = async (event) => {
  const data = event.data;
  const userId = data.custom_data?.userId;

  if (!userId) {
    console.error("No userId found in transaction data");
    return;
  }

  const user = await User.findById(userId);
  if (!user) {
    console.error(`User not found: ${userId}`);
    return;
  }

  // Determine subscription type
  const billingCycle = data.billing_period?.interval || "month";
  const subscriptionType = mapSubscriptionType(billingCycle);
  const duration = getSubscriptionDuration(subscriptionType);
  const expiresAt = new Date(Date.now() + duration);

  // Create payment record
  const payment = await Payment.create({
    userId: userId,
    paddleTransactionId: data.id,
    paddleCustomerId: data.customer_id,
    paddleSubscriptionId: data.subscription_id || null,
    priceId: data.items[0]?.price_id,
    productId: data.items[0]?.product_id,
    subscriptionType: subscriptionType,
    status: data.status,
    amount: parseInt(data.details.totals.total) / 100, // Convert from cents
    currency: data.currency_code,
    billingCycle: billingCycle,
    expiresAt: expiresAt,
    nextBillingDate: data.billing_period?.ends_at
      ? new Date(data.billing_period.ends_at)
      : expiresAt,
    webhookEvents: [
      {
        eventType: event.event_type,
        eventId: event.event_id,
        data: event.data,
      },
    ],
  });

  // Update user subscription
  user.isPaid = true;
  user.subscriptionType = subscriptionType;
  user.subscriptionExpiresAt = expiresAt;
  user.isActive = true;
  await user.save();

  console.log(`Payment completed for user ${userId}`);
};

// Subscription created handler
const handleSubscriptionCreated = async (event) => {
  const data = event.data;
  const userId = data.custom_data?.userId;

  if (!userId) {
    console.error("No userId found in subscription data");
    return;
  }

  // Find existing payment or create new one
  let payment = await Payment.findOne({
    paddleSubscriptionId: data.id,
  });

  if (payment) {
    // Update existing payment with webhook event
    payment.webhookEvents.push({
      eventType: event.event_type,
      eventId: event.event_id,
      data: event.data,
    });
    await payment.save();
  }

  console.log(`Subscription created: ${data.id}`);
};

// Subscription updated handler
const handleSubscriptionUpdated = async (event) => {
  const data = event.data;

  const payment = await Payment.findOne({
    paddleSubscriptionId: data.id,
  });

  if (!payment) {
    console.error(`Payment not found for subscription: ${data.id}`);
    return;
  }

  // Update payment status
  payment.status = data.status;
  payment.nextBillingDate = data.next_billed_at
    ? new Date(data.next_billed_at)
    : payment.nextBillingDate;
  payment.webhookEvents.push({
    eventType: event.event_type,
    eventId: event.event_id,
    data: event.data,
  });
  await payment.save();

  // Update user if subscription is active
  const user = await User.findById(payment.userId);
  if (user) {
    user.isPaid = data.status === "active";
    user.isActive = data.status === "active";
    await user.save();
  }

  console.log(`Subscription updated: ${data.id}`);
};

// Subscription cancelled handler
const handleSubscriptionCancelled = async (event) => {
  const data = event.data;

  const payment = await Payment.findOne({
    paddleSubscriptionId: data.id,
  });

  if (!payment) {
    console.error(`Payment not found for subscription: ${data.id}`);
    return;
  }

  payment.status = "cancelled";
  payment.cancelledAt = new Date();
  payment.webhookEvents.push({
    eventType: event.event_type,
    eventId: event.event_id,
    data: event.data,
  });
  await payment.save();

  // Update user subscription status
  const user = await User.findById(payment.userId);
  if (user) {
    user.isPaid = false;
    user.subscriptionType = null;
    await user.save();
  }

  console.log(`Subscription cancelled: ${data.id}`);
};

// Subscription paused handler
const handleSubscriptionPaused = async (event) => {
  const data = event.data;

  const payment = await Payment.findOne({
    paddleSubscriptionId: data.id,
  });

  if (!payment) {
    console.error(`Payment not found for subscription: ${data.id}`);
    return;
  }

  payment.status = "paused";
  payment.pausedAt = new Date();
  payment.webhookEvents.push({
    eventType: event.event_type,
    eventId: event.event_id,
    data: event.data,
  });
  await payment.save();

  console.log(`Subscription paused: ${data.id}`);
};

// Subscription resumed handler
const handleSubscriptionResumed = async (event) => {
  const data = event.data;

  const payment = await Payment.findOne({
    paddleSubscriptionId: data.id,
  });

  if (!payment) {
    console.error(`Payment not found for subscription: ${data.id}`);
    return;
  }

  payment.status = "active";
  payment.resumedAt = new Date();
  payment.webhookEvents.push({
    eventType: event.event_type,
    eventId: event.event_id,
    data: event.data,
  });
  await payment.save();

  // Reactivate user subscription
  const user = await User.findById(payment.userId);
  if (user) {
    user.isPaid = true;
    user.isActive = true;
    await user.save();
  }

  console.log(`Subscription resumed: ${data.id}`);
};

// Payment failed handler
const handlePaymentFailed = async (event) => {
  const data = event.data;

  const payment = await Payment.findOne({
    paddleSubscriptionId: data.subscription_id,
  });

  if (!payment) {
    console.error(`Payment not found for subscription: ${data.subscription_id}`);
    return;
  }

  payment.status = "past_due";
  payment.webhookEvents.push({
    eventType: event.event_type,
    eventId: event.event_id,
    data: event.data,
  });
  await payment.save();

  console.log(`Payment failed for subscription: ${data.subscription_id}`);
};

// Get user's active subscription
exports.getUserSubscription = async (req, res) => {
  try {
    const { userId } = req.params;

    const payment = await Payment.findOne({
      userId: userId,
      status: { $in: ["active", "trialing"] },
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "No active subscription found",
      });
    }

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error("Get user subscription error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get subscription",
      error: error.message,
    });
  }
};

// Get all user payments
exports.getUserPayments = async (req, res) => {
  try {
    const { userId } = req.params;

    const payments = await Payment.find({ userId: userId }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      data: payments,
    });
  } catch (error) {
    console.error("Get user payments error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get payments",
      error: error.message,
    });
  }
};

// Cancel subscription
exports.cancelSubscription = async (req, res) => {
  try {
    const { userId } = req.body;

    const payment = await Payment.findOne({
      userId: userId,
      status: "active",
    }).sort({ createdAt: -1 });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "No active subscription found",
      });
    }

    // Note: You need to call Paddle API to actually cancel the subscription
    // This is just updating the local database
    // You should use Paddle SDK to cancel: paddle.subscriptions.cancel(subscriptionId)

    res.status(200).json({
      success: true,
      message: "Subscription cancellation initiated",
      data: {
        paddleSubscriptionId: payment.paddleSubscriptionId,
      },
    });
  } catch (error) {
    console.error("Cancel subscription error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel subscription",
      error: error.message,
    });
  }
};
