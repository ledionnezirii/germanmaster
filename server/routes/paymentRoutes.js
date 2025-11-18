const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");

// This is handled in the main server file, not here

// Create checkout session
router.post("/checkout/create", paymentController.createCheckoutSession);

// Get user's active subscription
router.get("/subscription/:userId", paymentController.getUserSubscription);

// Get all user payments
router.get("/payments/:userId", paymentController.getUserPayments);

// Cancel subscription
router.post("/subscription/cancel", paymentController.cancelSubscription);

module.exports = router;
