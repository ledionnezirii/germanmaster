const Payment = require("../models/Payment");
const User = require("../models/User");
const crypto = require("crypto");

// Paddle SDK for subscription management
let paddleClient = null;
try {
  const { Paddle, Environment } = require("@paddle/paddle-node-sdk");
  paddleClient = new Paddle(process.env.PADDLE_API_KEY, {
    environment: Environment.sandbox,
  });
  console.log("[v0] Paddle Client initialized for subscription management");
} catch (err) {
  console.log("[v0] Paddle SDK not available, cancellation via API disabled");
}

// Validate user for checkout
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

    console.log(
      `[v0] Checkout validated for user: ${userId} with priceId: ${priceId}`
    );

    res.status(200).json({
      success: true,
      message: "Checkout validated, proceed with Paddle.js",
      data: {
        userId: userId,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("[v0] Checkout validation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to validate checkout",
      error: error.message,
    });
  }
};

// Handle Paddle webhooks
exports.handleWebhook = async (req, res) => {
  try {
    const signature = req.headers["paddle-signature"];
    const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET;

    console.log("[v0] Webhook received");
    console.log("[v0] Signature present:", !!signature);
    console.log("[v0] Webhook secret present:", !!webhookSecret);

    if (!signature) {
      console.error("[v0] No signature header");
      return res.status(401).json({ success: false, message: "No signature" });
    }

    if (!webhookSecret) {
      console.error("[v0] No webhook secret configured");
      return res
        .status(500)
        .json({ success: false, message: "Server config error" });
    }

    // Get raw body
    let rawBody;
    let event;

    if (Buffer.isBuffer(req.body)) {
      rawBody = req.body.toString("utf8");
      console.log("[v0] ✅ Raw body received as Buffer (correct!)");
    } else if (typeof req.body === "string") {
      rawBody = req.body;
      console.log("[v0] ⚠️ Raw body received as string");
    } else {
      console.error(
        "[v0] ❌ ERROR: req.body is not Buffer or string. Type:",
        typeof req.body
      );
      return res
        .status(400)
        .json({ success: false, message: "Invalid body format" });
    }

    console.log("[v0] Raw body length:", rawBody.length);

    try {
      event = JSON.parse(rawBody);
    } catch (parseError) {
      console.error("[v0] Failed to parse webhook body:", parseError.message);
      return res
        .status(400)
        .json({ success: false, message: "Invalid JSON body" });
    }

    // Parse signature: ts=xxx;h1=xxx
    const signatureParts = {};
    signature.split(";").forEach((part) => {
      const [key, ...valueParts] = part.split("=");
      signatureParts[key.trim()] = valueParts.join("=").trim();
    });

    const ts = signatureParts.ts;
    const h1 = signatureParts.h1;

    if (!ts || !h1) {
      console.error("[v0] Invalid signature format. Parts:", signatureParts);
      return res
        .status(401)
        .json({ success: false, message: "Invalid signature format" });
    }

    // Build signed payload and verify
    const payload = ts + ":" + rawBody;
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(payload)
      .digest("hex");

    console.log("[v0] Signature verification:");
    console.log("[v0] - Timestamp:", ts);
    console.log("[v0] - Received h1:", h1.substring(0, 20) + "...");
    console.log("[v0] - Expected:", expectedSignature.substring(0, 20) + "...");

    // Compare signatures using timing-safe comparison
    const receivedBuffer = Buffer.from(h1, "utf8");
    const expectedBuffer = Buffer.from(expectedSignature, "utf8");

    let isValid = false;
    if (receivedBuffer.length === expectedBuffer.length) {
      try {
        isValid = crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
      } catch (compareError) {
        console.error("[v0] Signature comparison error:", compareError.message);
        isValid = false;
      }
    } else {
      console.error(
        "[v0] Signature length mismatch:",
        receivedBuffer.length,
        "vs",
        expectedBuffer.length
      );
    }

    if (!isValid) {
      console.error("[v0] ❌ Signature mismatch - webhook rejected");
      return res
        .status(401)
        .json({ success: false, message: "Invalid signature" });
    }

    console.log("[v0] ✅ Webhook signature verified!");

    const eventType = event.event_type;
    console.log(`[v0] Processing event: ${eventType}`);

    switch (eventType) {
      case "transaction.completed":
      case "transaction.paid":
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
        console.log(`[v0] Unhandled event type: ${eventType}`);
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

const handleTransactionCompleted = async (event) => {
  try {
    const data = event.data;
    const customData = data.custom_data || {};
    let userId = customData.userId;

    console.log("[v0] Transaction data:", JSON.stringify(data, null, 2));
    console.log("[v0] Custom data:", JSON.stringify(customData, null, 2));

    // Try to get userId from customer email if not in customData
    if (!userId && data.customer_id) {
      console.log(
        "[v0] No userId in customData, trying to find user by customer email"
      );
      const customerEmail = data.customer?.email || data.billing_details?.email;

      if (customerEmail) {
        const user = await User.findOne({ email: customerEmail });
        if (user) {
          userId = user._id.toString();
          console.log(`[v0] Found user by email: ${userId}`);
        }
      }
    }

    if (!userId) {
      console.error("[v0] No userId in transaction - cannot process");
      console.log("[v0] Full event data:", JSON.stringify(event, null, 2));
      return;
    }

    console.log(`[v0] Processing transaction for user: ${userId}`);

    const user = await User.findById(userId);
    if (!user) {
      console.error(`[v0] User not found: ${userId}`);
      return;
    }

    const subscriptionId = data.subscription_id || null;
    const amount = data.details?.totals?.total
      ? Number.parseInt(data.details.totals.total) / 100
      : 0;
    const currency = data.currency_code || "EUR";

    const priceId = data.items?.[0]?.price_id;
    let subscriptionType = "1_month";
    let billingCycle = "monthly";
    let durationDays = 30;

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

const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
    const nextBillingDate = new Date(
      Date.now() + durationDays * 24 * 60 * 60 * 1000
    );

    const existingPayment = await Payment.findOne({
      paddleTransactionId: data.id,
    });

    if (existingPayment) {
      console.log("[v0] Payment already processed for transaction:", data.id);
      // Still update user status in case it wasn't updated before
      if (!user.isPaid) {
        user.isPaid = true;
        user.subscriptionType = subscriptionType;
        user.subscriptionExpiresAt = expiresAt; // This should be 30 days from NOW
        user.subscriptionCancelled = false; // Reset cancelled flag
        user.isActive = true;
        await user.save();
        console.log(`[v0] ✅ User access granted - isPaid: true`);
      }
      return;
    }

    let payment;
    try {
      payment = await Payment.create({
        userId: userId,
        paddleTransactionId: data.id,
        paddleCustomerId: data.customer_id,
        paddleSubscriptionId: subscriptionId, // Can be null for one-time payments
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

      console.log("[v0] ✅ Payment record created:", payment._id);
    } catch (paymentError) {
      console.error("[v0] Error creating payment record:", paymentError);
      throw new Error(
        `Failed to create payment record: ${paymentError.message}`
      );
    }

    try {
      user.isPaid = true;
      user.subscriptionType = subscriptionType;
      user.subscriptionExpiresAt = expiresAt;
      user.isActive = true;
      await user.save();

      console.log(
        `[v0] ✅ User updated successfully - isPaid: true, subscriptionType: ${subscriptionType}`
      );
      console.log(
        `[v0] ✅ Payment completed for user ${userId} - Subscription: ${subscriptionType}`
      );
    } catch (userError) {
      console.error("[v0] Error updating user:", userError);
      await Payment.deleteOne({ _id: payment._id });
      console.error(
        "[v0] ❌ Payment record deleted due to user update failure"
      );
      throw new Error(`Failed to grant user access: ${userError.message}`);
    }
  } catch (error) {
    console.error("[v0] Error in handleTransactionCompleted:", error);
    console.error("[v0] Error stack:", error.stack);
    throw error;
  }
};

const handleSubscriptionCreated = async (event) => {
  const data = event.data;
  const customData = data.custom_data || {};
  const userId = customData.userId;

  if (!userId) {
    console.error("[v0] No userId in subscription data");
    return;
  }

  console.log(`[v0] ✅ Subscription created: ${data.id} for user: ${userId}`);
};

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

  console.log(`[v0] ✅ Subscription updated: ${data.id}`);
};

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

  console.log(`[v0] ✅ Subscription cancelled: ${data.id}`);
};

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

  console.log(`[v0] ✅ Subscription paused: ${data.id}`);
};

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

  console.log(`[v0] ✅ Subscription resumed: ${data.id}`);
};

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
      const user = await User.findById(userId);
      if (user && user.subscriptionType === "free_trial") {
        const now = new Date();
        const isTrialActive =
          user.subscriptionExpiresAt && user.subscriptionExpiresAt > now;

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

exports.getUserPayments = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const payments = await Payment.find({ userId: userId }).sort({
      createdAt: -1,
    });

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

    if (payment.paddleSubscriptionId && paddleClient) {
      try {
        await paddleClient.subscriptions.cancel(payment.paddleSubscriptionId, {
          effectiveFrom: "next_billing_period",
        });
        console.log(
          `[v0] Paddle subscription cancelled: ${payment.paddleSubscriptionId}`
        );
      } catch (paddleError) {
        console.error("[v0] Paddle API error:", paddleError);
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
