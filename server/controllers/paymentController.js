const Payment = require("../models/Payment");
const User = require("../models/User");
const crypto = require("crypto");

// Paddle SDK for subscription management
let paddleClient = null;
try {
  const { Paddle, Environment } = require("@paddle/paddle-node-sdk");
  paddleClient = new Paddle(process.env.PADDLE_API_KEY_TEST, {
    environment: Environment.sandbox,
  });
  console.log("[v0] ✅ Paddle Client initialized for subscription management");
} catch (err) {
  console.log("[v0] ⚠️ Paddle SDK not available, cancellation via API disabled:", err.message);
}

// Validate user for checkout
exports.createCheckoutSession = async (req, res) => {
  console.log("[v0] ==================== CREATE CHECKOUT SESSION ====================");
  console.log("[v0] Request body:", JSON.stringify(req.body, null, 2));
  console.log("[v0] Request headers:", JSON.stringify(req.headers, null, 2));
  
  try {
    const { userId, priceId } = req.body;

    console.log("[v0] Extracted userId:", userId);
    console.log("[v0] Extracted priceId:", priceId);

    if (!userId || !priceId) {
      console.log("[v0] ❌ Missing required fields");
      return res.status(400).json({
        success: false,
        message: "User ID and Price ID are required",
      });
    }

    console.log("[v0] Searching for user in database...");
    const user = await User.findById(userId);
    
    if (!user) {
      console.log("[v0] ❌ User not found in database:", userId);
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    console.log("[v0] ✅ User found:", user.email);
    console.log("[v0] User data:", JSON.stringify({
      id: user._id,
      email: user.email,
      isPaid: user.isPaid,
      subscriptionType: user.subscriptionType,
    }, null, 2));

    console.log("[v0] ✅ Checkout validated for user:", userId, "with priceId:", priceId);

    res.status(200).json({
      success: true,
      message: "Checkout validated, proceed with Paddle.js",
      data: {
        userId: userId,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("[v0] ❌❌❌ Checkout validation error:", error);
    console.error("[v0] Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Failed to validate checkout",
      error: error.message,
    });
  }
};

// Handle Paddle webhooks
exports.handleWebhook = async (req, res) => {
  console.log("\n\n");
  console.log("=====================================================================");
  console.log("[v0] 🎯 WEBHOOK RECEIVED AT:", new Date().toISOString());
  console.log("=====================================================================");
  
  try {
    const signature = req.headers["paddle-signature"];
    const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET_TEST;

    console.log("[v0] 📋 Webhook Headers:", JSON.stringify(req.headers, null, 2));
    console.log("[v0] 🔑 Signature present:", !!signature);
    console.log("[v0] 🔑 Signature value:", signature);
    console.log("[v0] 🔐 Webhook secret present:", !!webhookSecret);
    console.log("[v0] 🔐 Webhook secret length:", webhookSecret ? webhookSecret.length : 0);

    if (!signature) {
      console.error("[v0] ❌ No signature header found");
      return res.status(401).json({ success: false, message: "No signature" });
    }

    if (!webhookSecret) {
      console.error("[v0] ❌ No webhook secret configured in environment");
      return res.status(500).json({ success: false, message: "Server config error" });
    }

    // Get raw body
    let rawBody;
    let event;

    console.log("[v0] 📦 req.body type:", typeof req.body);
    console.log("[v0] 📦 req.body is Buffer:", Buffer.isBuffer(req.body));

    if (Buffer.isBuffer(req.body)) {
      rawBody = req.body.toString("utf8");
      console.log("[v0] ✅ Raw body received as Buffer (correct!)");
    } else if (typeof req.body === "string") {
      rawBody = req.body;
      console.log("[v0] ⚠️ Raw body received as string");
    } else {
      console.error("[v0] ❌ ERROR: req.body is not Buffer or string. Type:", typeof req.body);
      console.error("[v0] ❌ req.body content:", req.body);
      return res.status(400).json({ success: false, message: "Invalid body format" });
    }

    console.log("[v0] 📏 Raw body length:", rawBody.length);
    console.log("[v0] 📄 Raw body (first 500 chars):", rawBody.substring(0, 500));

    try {
      event = JSON.parse(rawBody);
      console.log("[v0] ✅ Successfully parsed webhook body");
      console.log("[v0] 📋 Event type:", event.event_type);
      console.log("[v0] 📋 Event ID:", event.event_id);
    } catch (parseError) {
      console.error("[v0] ❌ Failed to parse webhook body:", parseError.message);
      console.error("[v0] ❌ Parse error stack:", parseError.stack);
      return res.status(400).json({ success: false, message: "Invalid JSON body" });
    }

    // Parse signature: ts=xxx;h1=xxx
    console.log("[v0] 🔍 Parsing signature...");
    const signatureParts = {};
    signature.split(";").forEach((part) => {
      const [key, ...valueParts] = part.split("=");
      signatureParts[key.trim()] = valueParts.join("=").trim();
    });

    console.log("[v0] 🔍 Signature parts:", JSON.stringify(signatureParts, null, 2));

    const ts = signatureParts.ts;
    const h1 = signatureParts.h1;

    if (!ts || !h1) {
      console.error("[v0] ❌ Invalid signature format. Parts:", signatureParts);
      return res.status(401).json({ success: false, message: "Invalid signature format" });
    }

    console.log("[v0] ⏰ Timestamp:", ts);
    console.log("[v0] 🔑 h1 (first 30 chars):", h1.substring(0, 30) + "...");

    // Build signed payload and verify
    const payload = ts + ":" + rawBody;
    console.log("[v0] 📝 Building signed payload...");
    console.log("[v0] 📝 Payload format: ts + ':' + rawBody");
    
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(payload)
      .digest("hex");

    console.log("[v0] 🔐 Signature verification:");
    console.log("[v0] 🔐 - Timestamp:", ts);
    console.log("[v0] 🔐 - Received h1 (first 30):", h1.substring(0, 30) + "...");
    console.log("[v0] 🔐 - Expected (first 30):", expectedSignature.substring(0, 30) + "...");
    console.log("[v0] 🔐 - Received length:", h1.length);
    console.log("[v0] 🔐 - Expected length:", expectedSignature.length);

    // Compare signatures using timing-safe comparison
    const receivedBuffer = Buffer.from(h1, "utf8");
    const expectedBuffer = Buffer.from(expectedSignature, "utf8");

    let isValid = false;
    if (receivedBuffer.length === expectedBuffer.length) {
      try {
        isValid = crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
        console.log("[v0] ✅ Signature comparison completed");
      } catch (compareError) {
        console.error("[v0] ❌ Signature comparison error:", compareError.message);
        isValid = false;
      }
    } else {
      console.error("[v0] ❌ Signature length mismatch:", receivedBuffer.length, "vs", expectedBuffer.length);
    }

    if (!isValid) {
      console.error("[v0] ❌❌❌ Signature mismatch - webhook REJECTED");
      return res.status(401).json({ success: false, message: "Invalid signature" });
    }

    console.log("[v0] ✅✅✅ Webhook signature VERIFIED!");

    const eventType = event.event_type;
    console.log(`[v0] 🎬 Processing event: ${eventType}`);
    console.log(`[v0] 📋 Full event data:`, JSON.stringify(event, null, 2));

    switch (eventType) {
      case "transaction.completed":
      case "transaction.paid":
        console.log("[v0] 💰 Handling transaction completed/paid event");
        await handleTransactionCompleted(event);
        break;
      case "subscription.created":
        console.log("[v0] 📝 Handling subscription created event");
        await handleSubscriptionCreated(event);
        break;
      case "subscription.updated":
        console.log("[v0] 🔄 Handling subscription updated event");
        await handleSubscriptionUpdated(event);
        break;
      case "subscription.cancelled":
        console.log("[v0] ❌ Handling subscription cancelled event");
        await handleSubscriptionCancelled(event);
        break;
      case "subscription.paused":
        console.log("[v0] ⏸️ Handling subscription paused event");
        await handleSubscriptionPaused(event);
        break;
      case "subscription.resumed":
        console.log("[v0] ▶️ Handling subscription resumed event");
        await handleSubscriptionResumed(event);
        break;
      default:
        console.log(`[v0] ⚠️ Unhandled event type: ${eventType}`);
    }

    console.log("[v0] ✅ Webhook processing completed successfully");
    res.status(200).json({ success: true, received: true });
  } catch (error) {
    console.error("[v0] ❌❌❌ Webhook handler error:", error);
    console.error("[v0] Error message:", error.message);
    console.error("[v0] Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Webhook handler failed",
      error: error.message,
    });
  }
};

const handleTransactionCompleted = async (event) => {
  console.log("\n[v0] ===================== TRANSACTION COMPLETED =====================");
  
  try {
    const data = event.data;
    const customData = data.custom_data || {};
    let userId = customData.userId;

    console.log("[v0] 📋 Transaction data:", JSON.stringify(data, null, 2));
    console.log("[v0] 📋 Custom data:", JSON.stringify(customData, null, 2));
    console.log("[v0] 👤 UserId from customData:", userId);

    // Try to get userId from customer email if not in customData
    if (!userId && data.customer_id) {
      console.log("[v0] 🔍 No userId in customData, trying to find user by customer email");
      const customerEmail = data.customer?.email || data.billing_details?.email;
      console.log("[v0] 📧 Customer email:", customerEmail);

      if (customerEmail) {
        console.log("[v0] 🔍 Searching for user with email:", customerEmail);
        const user = await User.findOne({ email: customerEmail });
        if (user) {
          userId = user._id.toString();
          console.log(`[v0] ✅ Found user by email: ${userId}`);
        } else {
          console.log(`[v0] ❌ No user found with email: ${customerEmail}`);
        }
      }
    }

    if (!userId) {
      console.error("[v0] ❌❌❌ No userId in transaction - cannot process");
      console.log("[v0] 📋 Full event data:", JSON.stringify(event, null, 2));
      return;
    }

    console.log(`[v0] 💰 Processing transaction for user: ${userId}`);

    console.log("[v0] 🔍 Looking up user in database...");
    const user = await User.findById(userId);
    
    if (!user) {
      console.error(`[v0] ❌ User not found in database: ${userId}`);
      return;
    }

    console.log(`[v0] ✅ User found:`, {
      id: user._id,
      email: user.email,
      isPaid: user.isPaid,
      subscriptionType: user.subscriptionType,
      subscriptionExpiresAt: user.subscriptionExpiresAt,
    });

    const subscriptionId = data.subscription_id || null;
    const amount = data.details?.totals?.total
      ? Number.parseInt(data.details.totals.total) / 100
      : 0;
    const currency = data.currency_code || "EUR";

    console.log("[v0] 💵 Transaction amount:", amount, currency);
    console.log("[v0] 🔗 Subscription ID:", subscriptionId);

    const priceId = data.items?.[0]?.price_id;
    console.log("[v0] 🏷️ Price ID:", priceId);

    let subscriptionType = "1_month";
    let billingCycle = "monthly";
    let durationDays = 30;

    console.log("[v0] 🔍 Determining subscription type from price ID...");
    if (priceId?.includes("month") || priceId?.includes("monthly")) {
      subscriptionType = "1_month";
      billingCycle = "monthly";
      durationDays = 30;
      console.log("[v0] ✅ Detected: Monthly subscription");
    } else if (priceId?.includes("3_month") || priceId?.includes("quarterly")) {
      subscriptionType = "3_months";
      billingCycle = "quarterly";
      durationDays = 90;
      console.log("[v0] ✅ Detected: Quarterly subscription");
    } else if (priceId?.includes("year") || priceId?.includes("annual")) {
      subscriptionType = "1_year";
      billingCycle = "yearly";
      durationDays = 365;
      console.log("[v0] ✅ Detected: Yearly subscription");
    }

    console.log("[v0] 📅 Subscription details:", {
      type: subscriptionType,
      cycle: billingCycle,
      duration: durationDays + " days",
    });

    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
    const nextBillingDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    console.log("[v0] ⏰ Current time:", now.toISOString());
    console.log("[v0] ⏰ Expires at:", expiresAt.toISOString());
    console.log("[v0] ⏰ Next billing date:", nextBillingDate.toISOString());

    console.log("[v0] 🔍 Checking for existing payment record...");
    const existingPayment = await Payment.findOne({
      paddleTransactionId: data.id,
    });

    if (existingPayment) {
      console.log("[v0] ⚠️ Payment already processed for transaction:", data.id);
      console.log("[v0] 📋 Existing payment:", JSON.stringify(existingPayment, null, 2));
      
      // Still update user status in case it wasn't updated before
      if (!user.isPaid) {
        console.log("[v0] 🔄 Updating user status (was not paid before)");
        user.isPaid = true;
        user.subscriptionType = subscriptionType;
        user.subscriptionExpiresAt = expiresAt;
        user.subscriptionCancelled = false;
        user.isActive = true;
        await user.save();
        console.log(`[v0] ✅ User access granted - isPaid: true`);
      } else {
        console.log("[v0] ℹ️ User already has paid status, no update needed");
      }
      return;
    }

    console.log("[v0] 💾 Creating new payment record...");
    let payment;
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
      });

      console.log("[v0] ✅✅✅ Payment record created successfully!");
      console.log("[v0] 📋 Payment ID:", payment._id);
      console.log("[v0] 📋 Payment details:", JSON.stringify({
        id: payment._id,
        userId: payment.userId,
        status: payment.status,
        amount: payment.amount,
        subscriptionType: payment.subscriptionType,
        expiresAt: payment.expiresAt,
      }, null, 2));
    } catch (paymentError) {
      console.error("[v0] ❌❌❌ Error creating payment record:", paymentError);
      console.error("[v0] Error message:", paymentError.message);
      console.error("[v0] Error stack:", paymentError.stack);
      throw new Error(`Failed to create payment record: ${paymentError.message}`);
    }

    console.log("[v0] 🔄 Updating user subscription status...");
    try {
      user.isPaid = true;
      user.subscriptionType = subscriptionType;
      user.subscriptionExpiresAt = expiresAt;
      user.subscriptionCancelled = false;
      user.isActive = true;
      
      console.log("[v0] 💾 Saving user with new subscription data...");
      await user.save();

      console.log("[v0] ✅✅✅ User updated successfully!");
      console.log("[v0] 📋 Updated user data:", {
        id: user._id,
        email: user.email,
        isPaid: user.isPaid,
        subscriptionType: user.subscriptionType,
        subscriptionExpiresAt: user.subscriptionExpiresAt,
        isActive: user.isActive,
      });
      console.log(`[v0] 🎉🎉🎉 Payment completed for user ${userId} - Subscription: ${subscriptionType}`);
    } catch (userError) {
      console.error("[v0] ❌❌❌ Error updating user:", userError);
      console.error("[v0] Error message:", userError.message);
      console.error("[v0] Error stack:", userError.stack);
      
      console.log("[v0] 🗑️ Rolling back payment record...");
      await Payment.deleteOne({ _id: payment._id });
      console.error("[v0] ❌ Payment record deleted due to user update failure");
      throw new Error(`Failed to grant user access: ${userError.message}`);
    }
  } catch (error) {
    console.error("[v0] ❌❌❌ Error in handleTransactionCompleted:", error);
    console.error("[v0] Error message:", error.message);
    console.error("[v0] Error stack:", error.stack);
    throw error;
  }
};

const handleSubscriptionCreated = async (event) => {
  console.log("\n[v0] ===================== SUBSCRIPTION CREATED =====================");
  
  const data = event.data;
  const customData = data.custom_data || {};
  const userId = customData.userId;

  console.log("[v0] 📋 Subscription data:", JSON.stringify(data, null, 2));
  console.log("[v0] 📋 Custom data:", JSON.stringify(customData, null, 2));
  console.log("[v0] 👤 UserId:", userId);

  if (!userId) {
    console.error("[v0] ❌ No userId in subscription data");
    return;
  }

  console.log(`[v0] ✅✅✅ Subscription created: ${data.id} for user: ${userId}`);
};

const handleSubscriptionUpdated = async (event) => {
  console.log("\n[v0] ===================== SUBSCRIPTION UPDATED =====================");
  
  const data = event.data;
  console.log("[v0] 📋 Subscription data:", JSON.stringify(data, null, 2));

  console.log("[v0] 🔍 Looking for payment record with subscription ID:", data.id);
  const payment = await Payment.findOne({
    paddleSubscriptionId: data.id,
  });

  if (!payment) {
    console.error(`[v0] ❌ Payment not found for subscription: ${data.id}`);
    return;
  }

  console.log("[v0] ✅ Payment record found:", payment._id);
  console.log("[v0] 📋 Current payment status:", payment.status);
  console.log("[v0] 📋 New status from webhook:", data.status);

  payment.status = data.status;
  payment.nextBillingDate = data.next_billed_at
    ? new Date(data.next_billed_at)
    : payment.nextBillingDate;
  payment.webhookEvents.push({
    eventType: event.event_type,
    eventId: event.event_id,
    data: event.data,
  });
  
  console.log("[v0] 💾 Saving updated payment record...");
  await payment.save();
  console.log("[v0] ✅ Payment record updated");

  console.log("[v0] 🔍 Looking up user:", payment.userId);
  const user = await User.findById(payment.userId);
  if (user) {
    console.log("[v0] ✅ User found, updating subscription status");
    user.isPaid = data.status === "active";
    user.isActive = data.status === "active";
    await user.save();
    console.log("[v0] ✅ User updated - isPaid:", user.isPaid, "isActive:", user.isActive);
  } else {
    console.error("[v0] ❌ User not found:", payment.userId);
  }

  console.log(`[v0] ✅✅✅ Subscription updated: ${data.id}`);
};

const handleSubscriptionCancelled = async (event) => {
  console.log("\n[v0] ===================== SUBSCRIPTION CANCELLED =====================");
  
  const data = event.data;
  console.log("[v0] 📋 Subscription data:", JSON.stringify(data, null, 2));

  console.log("[v0] 🔍 Looking for payment record with subscription ID:", data.id);
  const payment = await Payment.findOne({
    paddleSubscriptionId: data.id,
  });

  if (!payment) {
    console.error(`[v0] ❌ Payment not found for subscription: ${data.id}`);
    return;
  }

  console.log("[v0] ✅ Payment record found:", payment._id);
  
  payment.status = "cancelled";
  payment.cancelledAt = new Date();
  payment.webhookEvents.push({
    eventType: event.event_type,
    eventId: event.event_id,
    data: event.data,
  });
  
  console.log("[v0] 💾 Saving cancelled payment record...");
  await payment.save();
  console.log("[v0] ✅ Payment record cancelled");

  console.log("[v0] 🔍 Looking up user:", payment.userId);
  const user = await User.findById(payment.userId);
  if (user) {
    console.log("[v0] ✅ User found, revoking subscription");
    user.isPaid = false;
    user.subscriptionType = null;
    await user.save();
    console.log("[v0] ✅ User subscription revoked");
  } else {
    console.error("[v0] ❌ User not found:", payment.userId);
  }

  console.log(`[v0] ✅✅✅ Subscription cancelled: ${data.id}`);
};

const handleSubscriptionPaused = async (event) => {
  console.log("\n[v0] ===================== SUBSCRIPTION PAUSED =====================");
  
  const data = event.data;
  console.log("[v0] 📋 Subscription data:", JSON.stringify(data, null, 2));

  console.log("[v0] 🔍 Looking for payment record with subscription ID:", data.id);
  const payment = await Payment.findOne({
    paddleSubscriptionId: data.id,
  });

  if (!payment) {
    console.error(`[v0] ❌ Payment not found for subscription: ${data.id}`);
    return;
  }

  console.log("[v0] ✅ Payment record found:", payment._id);
  
  payment.status = "paused";
  payment.pausedAt = new Date();
  payment.webhookEvents.push({
    eventType: event.event_type,
    eventId: event.event_id,
    data: event.data,
  });
  
  console.log("[v0] 💾 Saving paused payment record...");
  await payment.save();
  console.log("[v0] ✅ Payment record paused");

  console.log(`[v0] ✅✅✅ Subscription paused: ${data.id}`);
};

const handleSubscriptionResumed = async (event) => {
  console.log("\n[v0] ===================== SUBSCRIPTION RESUMED =====================");
  
  const data = event.data;
  console.log("[v0] 📋 Subscription data:", JSON.stringify(data, null, 2));

  console.log("[v0] 🔍 Looking for payment record with subscription ID:", data.id);
  const payment = await Payment.findOne({
    paddleSubscriptionId: data.id,
  });

  if (!payment) {
    console.error(`[v0] ❌ Payment not found for subscription: ${data.id}`);
    return;
  }

  console.log("[v0] ✅ Payment record found:", payment._id);
  
  payment.status = "active";
  payment.resumedAt = new Date();
  payment.webhookEvents.push({
    eventType: event.event_type,
    eventId: event.event_id,
    data: event.data,
  });
  
  console.log("[v0] 💾 Saving resumed payment record...");
  await payment.save();
  console.log("[v0] ✅ Payment record resumed");

  console.log("[v0] 🔍 Looking up user:", payment.userId);
  const user = await User.findById(payment.userId);
  if (user) {
    console.log("[v0] ✅ User found, reactivating subscription");
    user.isPaid = true;
    user.isActive = true;
    await user.save();
    console.log("[v0] ✅ User subscription reactivated");
  } else {
    console.error("[v0] ❌ User not found:", payment.userId);
  }

  console.log(`[v0] ✅✅✅ Subscription resumed: ${data.id}`);
};

exports.getUserSubscription = async (req, res) => {
  console.log("\n[v0] ==================== GET USER SUBSCRIPTION ====================");
  console.log("[v0] Request params:", JSON.stringify(req.params, null, 2));
  
  try {
    const { userId } = req.params;

    console.log("[v0] UserId:", userId);

    if (!userId) {
      console.log("[v0] ❌ Missing userId");
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    console.log("[v0] 🔍 Looking for active payment record...");
    const payment = await Payment.findOne({
      userId: userId,
      status: { $in: ["active", "trialing"] },
    }).sort({ createdAt: -1 });

    if (!payment) {
      console.log("[v0] ⚠️ No active payment found, checking for free trial...");
      const user = await User.findById(userId);
      
      if (user && user.subscriptionType === "free_trial") {
        const now = new Date();
        const isTrialActive =
          user.subscriptionExpiresAt && user.subscriptionExpiresAt > now;

        console.log("[v0] ℹ️ User has free trial");
        console.log("[v0] ℹ️ Trial active:", isTrialActive);
        console.log("[v0] ℹ️ Expires at:", user.subscriptionExpiresAt);

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

      console.log("[v0] ❌ No active subscription found");
      return res.status(404).json({
        success: false,
        message: "No active subscription found",
      });
    }

    console.log("[v0] ✅ Payment record found:", payment._id);
    console.log("[v0] 📋 Subscription details:", JSON.stringify({
      type: payment.subscriptionType,
      status: payment.status,
      expiresAt: payment.expiresAt,
      nextBillingDate: payment.nextBillingDate,
    }, null, 2));

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
    console.error("[v0] ❌ Get subscription error:", error);
    console.error("[v0] Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Failed to fetch subscription",
      error: error.message,
    });
  }
};

exports.getUserPayments = async (req, res) => {
  console.log("\n[v0] ==================== GET USER PAYMENTS ====================");
  console.log("[v0] Request params:", JSON.stringify(req.params, null, 2));
  
  try {
    const { userId } = req.params;

    console.log("[v0] UserId:", userId);

    if (!userId) {
      console.log("[v0] ❌ Missing userId");
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    console.log("[v0] 🔍 Fetching all payments for user...");
    const payments = await Payment.find({ userId: userId }).sort({
      createdAt: -1,
    });

    console.log("[v0] ✅ Found", payments.length, "payment(s)");

    res.status(200).json({
      success: true,
      data: payments,
    });
  } catch (error) {
    console.error("[v0] ❌ Get payments error:", error);
    console.error("[v0] Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payments",
      error: error.message,
    });
  }
};

exports.cancelSubscription = async (req, res) => {
  console.log("\n[v0] ==================== CANCEL SUBSCRIPTION ====================");
  console.log("[v0] Request body:", JSON.stringify(req.body, null, 2));
  
  try {
    const { userId } = req.body;

    console.log("[v0] UserId:", userId);

    if (!userId) {
      console.log("[v0] ❌ Missing userId");
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    console.log("[v0] 🔍 Looking for active payment record...");
    const payment = await Payment.findOne({
      userId: userId,
      status: "active",
    }).sort({ createdAt: -1 });

    if (!payment) {
      console.log("[v0] ❌ No active subscription found");
      return res.status(404).json({
        success: false,
        message: "No active subscription found",
      });
    }

    console.log("[v0] ✅ Payment record found:", payment._id);
    console.log("[v0] 🔗 Paddle subscription ID:", payment.paddleSubscriptionId);

    if (payment.paddleSubscriptionId && paddleClient) {
      console.log("[v0] 📞 Calling Paddle API to cancel subscription...");
      try {
        await paddleClient.subscriptions.cancel(payment.paddleSubscriptionId, {
          effectiveFrom: "next_billing_period",
        });
        console.log(`[v0] ✅ Paddle subscription cancelled via API: ${payment.paddleSubscriptionId}`);
      } catch (paddleError) {
        console.error("[v0] ❌ Paddle API error:", paddleError);
        console.error("[v0] Error message:", paddleError.message);
        console.error("[v0] Error stack:", paddleError.stack);
      }
    } else {
      console.log("[v0] ⚠️ No Paddle subscription ID or Paddle client not available");
    }

    console.log("[v0] 💾 Updating payment record to cancelled...");
    payment.status = "cancelled";
    payment.cancelledAt = new Date();
    await payment.save();
    console.log("[v0] ✅ Payment record updated");

    console.log("[v0] 🔍 Looking up user:", userId);
    const user = await User.findById(userId);
    if (user) {
      console.log("[v0] ✅ User found, revoking subscription");
      user.isPaid = false;
      user.subscriptionType = null;
      await user.save();
      console.log("[v0] ✅ User subscription revoked");
    } else {
      console.error("[v0] ❌ User not found:", userId);
    }

    console.log("[v0] ✅✅✅ Subscription cancelled successfully");
    res.status(200).json({
      success: true,
      message: "Subscription cancelled successfully",
      data: {
        paddleSubscriptionId: payment.paddleSubscriptionId,
      },
    });
  } catch (error) {
    console.error("[v0] ❌ Cancel subscription error:", error);
    console.error("[v0] Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Failed to cancel subscription",
      error: error.message,
    });
  }
}