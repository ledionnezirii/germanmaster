const express = require("express");
const router = express.Router();
const {
  getAllGiveaways,
  getGiveawayById,
  createGiveaway,
  updateGiveaway,
  deleteGiveaway,
  enterGiveaway,
  pickWinners,
  getAuditLog, // ← new
} = require("../controllers/giveawayController");

const protect = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");

// Public
router.get("/", getAllGiveaways);
router.get("/:id", getGiveawayById);

// Authenticated users
router.post("/:id/enter", protect, enterGiveaway);

// Admin only
router.post("/", protect, isAdmin, createGiveaway);
router.put("/:id", protect, isAdmin, updateGiveaway);
router.delete("/:id", protect, isAdmin, deleteGiveaway);
router.post("/:id/pick-winners", protect, isAdmin, pickWinners);
router.get("/:id/audit", protect, isAdmin, getAuditLog); // ← new

module.exports = router;