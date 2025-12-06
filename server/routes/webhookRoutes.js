const express = require("express")
const router = express.Router()
const paymentController = require("../controllers/paymentController")
const { webhookBodyParser } = require("../middleware/webhook")

router.post("/paddle", webhookBodyParser, async (req, res) => {
  // Convert rawBody to Buffer if it's a string
  if (req.rawBody && typeof req.rawBody === "string") {
    req.body = JSON.parse(req.rawBody)
  } else if (req.rawBody && Buffer.isBuffer(req.rawBody)) {
    req.body = JSON.parse(req.rawBody.toString("utf8"))
  } else if (!Buffer.isBuffer(req.body)) {
    // If body is still not a Buffer, create one
    const bodyString = typeof req.body === "string" ? req.body : JSON.stringify(req.body)
    req.body = Buffer.from(bodyString, "utf8")
  }

  await paymentController.handleWebhook(req, res)
})

module.exports = router
