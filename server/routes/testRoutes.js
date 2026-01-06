const express = require("express")
const router = express.Router()
const testController = require("../controllers/testController")
const auth = require("../middleware/auth")
const isAdmin = require("../middleware/isAdmin")

// Public routes
router.get("/", testController.getAllTests)
router.get("/stats", testController.getTestStats)
router.get("/availability", testController.getTestAvailability)
router.get("/:id", testController.getTestById)
router.get("/:id/questions", testController.getTestQuestions)

// Test submission routes
router.post("/:id/submit", testController.submitTest)
router.post("/:id/violation", testController.submitTestViolation) // NEW ROUTE

// Protected admin routes
router.post("/", auth, isAdmin, testController.createTest)
router.put("/:id", auth, isAdmin, testController.updateTest)
router.delete("/:id", auth, isAdmin, testController.deleteTest)

module.exports = router