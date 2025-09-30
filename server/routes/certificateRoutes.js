const express = require("express");
const router = express.Router();
const certificatesController = require("../controllers/certificateController");
const  protect  = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");

// Apply protect middleware to all routes that require authentication
router.use(protect);

// Get all certificates for logged-in user
router.get("/", certificatesController.getUserCertificates);

// Check and issue certificate for current level
router.post("/issue", certificatesController.checkAndIssueCertificate);

// Download specific certificate
router.get("/download/:certificateId", certificatesController.downloadCertificate);

// Admin only: Generate certificate for specific level
router.post("/generate", isAdmin, certificatesController.generateCertificateForLevel);

module.exports = router;
