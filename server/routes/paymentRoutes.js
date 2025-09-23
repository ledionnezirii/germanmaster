const express = require("express");
const router = express.Router();
const {
  createPayment,
  handleCallback,
  successPage,
  cancelPage,
} = require("../controllers/paymentController");

router.post("/create", createPayment);
router.post("/callback", handleCallback);
router.get("/success", successPage);
router.get("/cancel", cancelPage);

module.exports = router;
