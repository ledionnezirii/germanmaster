
const Payment = require("../models/Payment");
const User = require("../models/User");
const crypto = require("crypto");
const { Paddle, Environment } = require("@paddle/paddle-node-sdk")

// Initialize Paddle client properly
// paymentController.js

// Initialize Paddle client properly
const paddleClient = new Paddle(process.env.PADDLE_API_KEY, {
  environment: Environment.production, // KY DUHET TË JETË I DREJTI PËR ÇELËSIN LIVE
})

console.log("[v0] Paddle Client initialized successfully for live payments")
// ...
// Verify webhook signature from Paddle
const verifyPaddleWebhook = (req) => {
  const signature = req.headers["paddle-signature"];
  const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    console.error("[v0] Missing signature or webhook secret");
    return false;
  }

  try {
    const [ts, h1] = signature.split(";").map((part) => part.split("=")[1]);
    const payload = ts + ":" + JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(payload)
      .digest("hex");

    return crypto.timingSafeEqual(Buffer.from(h1), Buffer.from(expectedSignature));
  } catch (error) {
    console.error("[v0] Webhook verification error:", error);
    return false;
  }
};

// Create a checkout session
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

    // Check if trial expired
    const now = new Date();
    if (user.subscriptionExpiresAt && user.subscriptionExpiresAt < now) {
      console.log(`[v0] User ${userId} trial has expired, proceeding with checkout`);
    }

    console.log(`[v0] Creating checkout for user: ${userId} with priceId: ${priceId}`);

    const checkout = await paddleClient.checkouts.create({
      items: [
        {
          priceId: priceId,
          quantity: 1,
        },
      ],
      customData: {
        userId: userId,
      },
      customer: {
        email: user.email,
      },
      returnUrl: `${process.env.FRONTEND_URL}/payments?status=success`,
    });

    console.log(`[v0] Checkout created:`, checkout.id);

    res.status(200).json({
      success: true,
      data: {
        checkoutId: checkout.id,
        checkoutUrl: checkout.urls?.checkout,
      },
    });
  } catch (error) {
    console.error("[v0] Checkout creation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create checkout",
      error: error.message,
    });
  }
};

// Handle Paddle webhooks
exports.handleWebhook = async (req, res) => {
  try {
    // Verify webhook signature
    if (!verifyPaddleWebhook(req)) {
      console.error("[v0] Invalid webhook signature");
      return res.status(401).json({ success: false, message: "Invalid signature" });
    }

    const event = req.body;
    const eventType = event.event_type;

    console.log(`[v0] Webhook received - Event Type: ${eventType}`);

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
      default:
        console.log(`[v0] Unhandled webhook event: ${eventType}`);
    }

    res.status(200).json({ success: true, received: true });
  } catch (error) {
    console.error("[v0] Webhook handler error:", error);
    res.status(500).json({
      success: false,
      message: "Webhook handler failed",
      error: error.message,
    });
  }
};

// Handle transaction.completed webhook
const handleTransactionCompleted = async (event) => {
  const data = event.data;
  const customData = data.custom_data || {};
  const userId = customData.userId;

  if (!userId) {
    console.error("[v0] No userId in transaction data");
    return;
  }

  console.log(`[v0] Processing transaction for user: ${userId}`);

  const user = await User.findById(userId);
  if (!user) {
    console.error(`[v0] User not found: ${userId}`);
    return;
  }

  const subscriptionId = data.subscription_id || null;
  const amount = data.details?.totals?.total ? parseInt(data.details.totals.total) / 100 : 0;
  const currency = data.currency_code || "USD";
  
  // Determine subscription type and duration from price
  const priceId = data.items?.[0]?.price_id;
  let subscriptionType = "1_month";
  let billingCycle = "monthly";
  let durationDays = 30;

  // Map price IDs to subscription types (adjust based on your Paddle prices)
  if (priceId?.includes("month") || priceId?.includes("monthly")) {
    subscriptionType = "1_month";
    billingCycle = "monthly";
    durationDays = 30;
  } else if (priceId?.includes("3_month") || priceId?.includes("quarterly")) {
    subscriptionType = "3_months";
    billingCycle = "quarterly";
    durationDays = 90;
  } else if (priceId?.includes("year") || priceId?.includes("annual")) {
    subscriptionType = "1_year";
    billingCycle = "yearly";
    durationDays = 365;
  }

  const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
  const nextBillingDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

  // Create payment record
  const payment = await Payment.create({
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
  });

  // Update user subscription
  user.isPaid = true;
  user.subscriptionType = subscriptionType;
  user.subscriptionExpiresAt = expiresAt;
  user.isActive = true;
  await user.save();

  console.log(`[v0] Payment completed for user ${userId} - Subscription: ${subscriptionType}`);
};

// Handle subscription.created webhook
const handleSubscriptionCreated = async (event) => {
  const data = event.data;
  const customData = data.custom_data || {};
  const userId = customData.userId;

  if (!userId) {
    console.error("[v0] No userId in subscription data");
    return;
  }

  console.log(`[v0] Subscription created: ${data.id} for user: ${userId}`);
};

// Handle subscription.updated webhook
const handleSubscriptionUpdated = async (event) => {
  const data = event.data;
  
  const payment = await Payment.findOne({
    paddleSubscriptionId: data.id,
  });

  if (!payment) {
    console.error(`[v0] Payment not found for subscription: ${data.id}`);
    return;
  }

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

  const user = await User.findById(payment.userId);
  if (user) {
    user.isPaid = data.status === "active";
    user.isActive = data.status === "active";
    await user.save();
  }

  console.log(`[v0] Subscription updated: ${data.id}`);
};

// Handle subscription.cancelled webhook
const handleSubscriptionCancelled = async (event) => {
  const data = event.data;
  
  const payment = await Payment.findOne({
    paddleSubscriptionId: data.id,
  });

  if (!payment) {
    console.error(`[v0] Payment not found for subscription: ${data.id}`);
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

  const user = await User.findById(payment.userId);
  if (user) {
    user.isPaid = false;
    user.subscriptionType = null;
    await user.save();
  }

  console.log(`[v0] Subscription cancelled: ${data.id}`);
};

// Handle subscription.paused webhook
const handleSubscriptionPaused = async (event) => {
  const data = event.data;
  
  const payment = await Payment.findOne({
    paddleSubscriptionId: data.id,
  });

  if (!payment) {
    console.error(`[v0] Payment not found for subscription: ${data.id}`);
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

  console.log(`[v0] Subscription paused: ${data.id}`);
};

// Handle subscription.resumed webhook
const handleSubscriptionResumed = async (event) => {
  const data = event.data;
  
  const payment = await Payment.findOne({
    paddleSubscriptionId: data.id,
  });

  if (!payment) {
    console.error(`[v0] Payment not found for subscription: ${data.id}`);
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

  const user = await User.findById(payment.userId);
  if (user) {
    user.isPaid = true;
    user.isActive = true;
    await user.save();
  }

  console.log(`[v0] Subscription resumed: ${data.id}`);
};

// Get user's active subscription
exports.getUserSubscription = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const payment = await Payment.findOne({
      userId: userId,
      status: { $in: ["active", "trialing"] },
    }).sort({ createdAt: -1 });

    if (!payment) {
      // Check if user is on free trial
      const user = await User.findById(userId);
      if (user && user.subscriptionType === "free_trial") {
        const now = new Date();
        const isTrialActive = user.subscriptionExpiresAt && user.subscriptionExpiresAt > now;
        
        return res.status(200).json({
          success: true,
          data: {
            subscriptionType: "free_trial",
            status: isTrialActive ? "active" : "expired",
            expiresAt: user.subscriptionExpiresAt,
            trialStartedAt: user.trialStartedAt,
          },
        });
      }

      return res.status(404).json({
        success: false,
        message: "No active subscription found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        paddleSubscriptionId: payment.paddleSubscriptionId,
        subscriptionType: payment.subscriptionType,
        status: payment.status,
        nextBillingDate: payment.nextBillingDate,
        amount: payment.amount,
        currency: payment.currency,
        expiresAt: payment.expiresAt,
      },
    });
  } catch (error) {
    console.error("[v0] Get subscription error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch subscription",
      error: error.message,
    });
  }
};

// Get all user payments
exports.getUserPayments = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const payments = await Payment.find({ userId: userId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: payments,
    });
  } catch (error) {
    console.error("[v0] Get payments error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payments",
      error: error.message,
    });
  }
};

// Cancel subscription
exports.cancelSubscription = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

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

    if (payment.paddleSubscriptionId) {
      try {
        await paddleClient.subscriptions.cancel(
          payment.paddleSubscriptionId,
          { effectiveFrom: "next_billing_period" }
        );
        console.log(`[v0] Paddle subscription cancelled: ${payment.paddleSubscriptionId}`);
      } catch (paddleError) {
        console.error("[v0] Paddle API error:", paddleError);
        return res.status(400).json({
          success: false,
          message: "Failed to cancel subscription in Paddle",
          error: paddleError.message,
        });
      }
    }

    payment.status = "cancelled";
    payment.cancelledAt = new Date();
    await payment.save();

    const user = await User.findById(userId);
    if (user) {
      user.isPaid = false;
      user.subscriptionType = null;
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: "Subscription cancelled successfully",
      data: {
        paddleSubscriptionId: payment.paddleSubscriptionId,
      },
    });
  } catch (error) {
    console.error("[v0] Cancel subscription error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel subscription",
      error: error.message,
    });
  }
};