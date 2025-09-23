const Payment = require("../models/Payment");
const User = require("../models/User");

// Dummy credentials (ndryshohen më vonë me Paysera)
const PROJECT_ID = "test_project";
const PASSWORD = "test_secret";

// @desc Create payment
exports.createPayment = async (req, res) => {
  try {
    const { amount, orderId, userId } = req.body;

    // Ruaj pagesën në DB
    const payment = await Payment.create({
      user: userId,
      orderId,
      amount,
    });

    // Dummy URL (më vonë zëvendësohet me Paysera real)
    const paymentUrl = `https://paysera.test/pay?projectid=${PROJECT_ID}&orderid=${orderId}&amount=${amount}`;

    res.json({ message: "Payment created", url: paymentUrl, payment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// @desc Callback nga Paysera
exports.handleCallback = async (req, res) => {
  try {
    const { orderId, status, userId } = req.body;

    // Update payment status
    const payment = await Payment.findOneAndUpdate(
      { orderId },
      { status: status || "success" },
      { new: true }
    );

    // Nëse pagesa është sukses, bëje user-in premium
    if (status === "success") {
      await User.findByIdAndUpdate(userId, { isPaid: true });
    }

    res.json({ message: "Callback handled", payment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// @desc Success page
exports.successPage = (req, res) => {
  res.send("Payment successful!");
};

// @desc Cancel page
exports.cancelPage = (req, res) => {
  res.send("Payment cancelled.");
};
