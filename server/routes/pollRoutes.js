const express = require("express");
const router = express.Router();
const { getActivePoll, vote, createPoll, getPollVoters } = require("../controllers/pollController");
const  protect = require("../middleware/auth"); // adjust to your auth middleware
const adminOnly = require("../middleware/isAdmin")
// GET  /api/polls/active?visitorId=xxx  — fetch the current active poll
// Use optional auth middleware so req.user is populated if logged in
router.get("/active", optionalAuth, getActivePoll);

// POST /api/polls/vote  — cast a vote
router.post("/vote", optionalAuth, vote);

// POST /api/polls/create — create / seed a new poll (admin utility)
router.post("/create", protect, adminOnly, createPoll);

// GET /api/polls/:pollId/voters — admin: see who voted
router.get("/:pollId/voters", protect, adminOnly, getPollVoters);

// Optional auth middleware — populates req.user if token present, doesn't block if not
function optionalAuth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return next();

  try {
    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const User = require("../models/User");
    User.findById(decoded.id).then((user) => {
      req.user = user;
      next();
    }).catch(() => next());
  } catch {
    next();
  }
}

module.exports = router;