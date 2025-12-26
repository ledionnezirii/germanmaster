const express = require("express")
const {
  createRoom,
  joinRoom,
  getAvailableRooms,
  getRoomDetails,
  getRoomByCode, // Added getRoomByCode import
  leaveRoom,
  createQuestion,
  bulkCreateQuestions,
  getQuestions,
  updateQuestion,
  deleteQuestion,
} = require("../controllers/raceController")
const protect = require("../middleware/auth")

const router = express.Router()

// All routes require authentication
router.use(protect)

// Room routes
router.post("/create", createRoom)
router.get("/rooms", getAvailableRooms)
router.get("/rooms/code/:roomCode", getRoomByCode)
router.get("/rooms/:roomId", getRoomDetails)
router.post("/rooms/:roomId/join", joinRoom)
router.post("/rooms/:roomId/leave", leaveRoom)

// Question routes
router.post("/questions", createQuestion)
router.post("/questions/bulk", bulkCreateQuestions)
router.get("/questions", getQuestions)
router.put("/questions/:id", updateQuestion)
router.delete("/questions/:id", deleteQuestion)

module.exports = router
