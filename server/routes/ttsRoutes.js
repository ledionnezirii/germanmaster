// routes/ttsRoutes.js
const express = require("express");
const { generateTTS } = require("../controllers/ttsController");

const router = express.Router();

router.post("/", generateTTS);

module.exports = router;
