
const express = require("express")
const router = express.Router()
const paymentController = require("../controllers/paymentController")
const protect = require("../middleware/auth")

// NOTE: Webhook route is now handled directly in server.js with raw body parser
// DO NOT register it here to avoid conflicts

// Protected routes (require authentication)
router.post("/checkout/create", protect, paymentController.createCheckoutSession)
router.get("/subscription/:userId", protect, paymentController.getUserSubscription)
router.get("/payments/:userId", protect, paymentController.getUserPayments)
router.post("/subscription/cancel", protect, paymentController.cancelSubscription)

module.exports = router