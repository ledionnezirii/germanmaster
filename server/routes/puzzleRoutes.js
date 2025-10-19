const express = require("express")
const router = express.Router()
const puzzleController = require("../controllers/puzzleController")
const  protect  = require("../middleware/auth")
const isAdmin = require("../middleware/isAdmin")

// User routes (protected)
router.get("/today", protect, puzzleController.getTodaysPuzzle)
router.post("/:puzzleId/submit", protect, puzzleController.submitAnswer)
router.get("/stats", protect, puzzleController.getPuzzleStats)

// Admin routes (protected + admin only)
router.get("/admin/all", protect, isAdmin, puzzleController.getAllPuzzles)
router.post("/admin/create", protect, isAdmin, puzzleController.createPuzzle)
router.post("/admin/bulk", protect, isAdmin, puzzleController.createBulkPuzzles)
router.put("/admin/:id", protect, isAdmin, puzzleController.updatePuzzle)
router.delete("/admin/:id", protect, isAdmin, puzzleController.deletePuzzle)

module.exports = router
