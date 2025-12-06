const express = require("express")
const router = express.Router()
const paymentController = require("../controllers/paymentController")
const protect = require("../middleware/auth")

const webhookBodyParser = express.raw({ type: "application/json" })

// Webhook endpoint (NO authentication - Paddle calls this)
router.post("/webhook", webhookBodyParser, paymentController.handleWebhook)

// Protected routes (require authentication)
router.post("/checkout/create", protect, paymentController.createCheckoutSession)
router.get("/subscription/:userId", protect, paymentController.getUserSubscription)
router.get("/payments/:userId", protect, paymentController.getUserPayments)
router.post("/subscription/cancel", protect, paymentController.cancelSubscription)

module.exports = router
