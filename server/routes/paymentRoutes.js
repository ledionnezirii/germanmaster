const express = require("express")
const router = express.Router()
const paymentController = require("../controllers/paymentController")
const protect = require("../middleware/auth")

// Webhook endpoint (NO authentication - Paddle calls this)
// This is now in the main app.js file to ensure express.raw() middleware is applied correctly

// Protected routes (require authentication)
router.post("/checkout/create", protect, paymentController.createCheckoutSession)
router.get("/subscription/:userId", protect, paymentController.getUserSubscription)
router.get("/payments/:userId", protect, paymentController.getUserPayments)
router.post("/subscription/cancel", protect, paymentController.cancelSubscription)

module.exports = router
