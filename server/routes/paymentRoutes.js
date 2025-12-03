const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const protect = require("../middleware/auth");

// Webhook endpoint (NO authentication - Paddle calls this)
router.post("/webhook", paymentController.handleWebhook);

// Protected routes (require authentication)
router.post("/checkout/create", protect, paymentController.createCheckoutSession);
router.get("/subscription/:userId", protect, paymentController.getUserSubscription);
router.get("/payments/:userId", protect, paymentController.getUserPayments);
router.post("/subscription/cancel", protect, paymentController.cancelSubscription);

module.exports = router;