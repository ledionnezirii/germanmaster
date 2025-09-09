const express = require("express")
const router = express.Router()
const testController = require("../controllers/testController")
const auth = require("../middleware/auth")
const isAdmin = require("../middleware/isAdmin")

// Public routes - anyone can view tests and stats
router.get("/", testController.getAllTests)
router.get("/stats", testController.getTestStats)
router.get("/availability", testController.getTestAvailability)
router.get("/:id", testController.getTestById)
router.get("/:id/questions", testController.getTestQuestions)

// Public test submission - anyone can submit test answers
router.post("/:id/submit", testController.submitTest)

// Protected admin routes - only admins/teachers can create, update, delete tests
router.post("/", auth, isAdmin, testController.createTest)
router.put("/:id", auth, isAdmin, testController.updateTest)
router.delete("/:id", auth, isAdmin, testController.deleteTest)

module.exports = router
