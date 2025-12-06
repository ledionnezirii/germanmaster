const express = require("express")

// Middleware to capture raw body for webhook signature verification
const webhookRawBodyMiddleware = (req, res, buffer, encoding) => {
  if (buffer && buffer.length) {
    req.rawBody = buffer.toString(encoding || "utf8")
  }
}

// Express.raw() middleware for Paddle webhook
const webhookBodyParser = express.raw({
  type: "application/json",
  verify: webhookRawBodyMiddleware,
})

module.exports = {
  webhookBodyParser,
  webhookRawBodyMiddleware,
}
