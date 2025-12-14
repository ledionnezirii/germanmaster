const express = require("express")
const router = express.Router()
const paymentController = require("../controllers/paymentController")
const protect = require("../middleware/auth")

// Protected routes (require authentication)
router.post("/checkout/create", protect, paymentController.createCheckoutSession)
router.get("/subscription/:userId", protect, paymentController.getUserSubscription)
router.get("/payments/:userId", protect, paymentController.getUserPayments)
router.post("/subscription/cancel", protect, paymentController.cancelSubscription)

// NOTE: Webhook route is registered in server.js with raw body parser
// This is just for documentation - do not use this route
// router.post('/webhook', paymentController.handleWebhook);

module.exports = router
