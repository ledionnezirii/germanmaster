const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/academyController");

// ── Middleware (adjust import paths to match your project) ──
const  protect  = require("../middleware/auth");
const  adminOnly  = require("../middleware/isAdmin");

// Helper: allow only admin OR academyAdmin
const adminOrTeacher = (req, res, next) => {
  if (req.user.role === "admin" || req.user.role === "academyAdmin") return next();
  return res.status(403).json({ success: false, message: "Access denied" });
};

// ─────────────────────────────────────────────────────────────
// ACADEMY ROUTES  — admin only
// ─────────────────────────────────────────────────────────────
router.post("/", protect, adminOnly, ctrl.createAcademy);
router.get("/", protect, adminOrTeacher, ctrl.getAllAcademies);
router.get("/:id", protect, adminOrTeacher, ctrl.getAcademyById);
router.put("/:id", protect, adminOnly, ctrl.updateAcademy);
router.delete("/:id", protect, adminOnly, ctrl.deleteAcademy);
router.post("/:id/assign-admin", protect, adminOnly, ctrl.assignAcademyAdmin);

// ─────────────────────────────────────────────────────────────
// GROUP ROUTES  — academyAdmin (teacher) manages their groups
// NOTE: these sit under /api/academy/groups/...
// ─────────────────────────────────────────────────────────────
router.post("/groups/join", protect, ctrl.joinGroupByCode);
router.get("/groups/mine", protect, ctrl.getMyGroup);
router.post("/groups", protect, adminOrTeacher, ctrl.createGroup);
router.get("/groups", protect, adminOrTeacher, ctrl.getMyGroups);
router.get("/groups/:groupId", protect, adminOrTeacher, ctrl.getGroupById);
router.put("/groups/:groupId", protect, adminOrTeacher, ctrl.updateGroup);
router.delete("/groups/:groupId", protect, adminOrTeacher, ctrl.deleteGroup);


// Students inside a group
router.post(
  "/groups/:groupId/students",
  protect,
  adminOrTeacher,
  ctrl.addStudentToGroup
);
router.delete(
  "/groups/:groupId/students/:studentId",
  protect,
  adminOrTeacher,
  ctrl.removeStudentFromGroup
);

// Leaderboard
router.get(
  "/groups/:groupId/leaderboard",
  protect,
  adminOrTeacher,
  ctrl.getGroupLeaderboard
);

module.exports = router;

// ─────────────────────────────────────────────────────────────
// Register in your main app.js / server.js like this:
//
//   const academyRoutes = require("./routes/academyRoutes");
//   app.use("/api/academy", academyRoutes);
// ─────────────────────────────────────────────────────────────