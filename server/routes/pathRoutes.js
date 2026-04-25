const express = require("express")
const {
  getAllPaths,
  getPathById,
  getRound,
  completeRound,
  getUserProgress,
  generatePath,
  createPath,
  updatePath,
  deletePath,
  getAllPathsAdmin,
  addRound,
  updateRound,
  deleteRound,
} = require("../controllers/pathController")
const auth = require("../middleware/auth")
const isAdmin = require("../middleware/isAdmin")

const router = express.Router()

// ── User routes ──────────────────────────────────────────────────────────────
// NOTE: specific routes before /:id to avoid param conflicts
router.get("/user/progress", auth, getUserProgress)
router.get("/admin/all", auth, isAdmin, getAllPathsAdmin)
router.post("/generate", auth, generatePath)

router.get("/", auth, getAllPaths)
router.get("/:id", auth, getPathById)
router.get("/:id/round/:roundIndex", auth, getRound)
router.post("/:id/round/:roundIndex/complete", auth, completeRound)

// ── Admin routes ─────────────────────────────────────────────────────────────
router.post("/", auth, isAdmin, createPath)
router.put("/:id", auth, isAdmin, updatePath)
router.delete("/:id", auth, isAdmin, deletePath)
router.post("/:id/round", auth, isAdmin, addRound)
router.put("/:id/round/:roundIndex", auth, isAdmin, updateRound)
router.delete("/:id/round/:roundIndex", auth, isAdmin, deleteRound)

module.exports = router
