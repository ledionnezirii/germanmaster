const express = require("express")
const {
  getProfile,
  getUserXp,
  updateStudyHours,
  updateAvatarStyle,
  updateProfile,
  addXp,
  updateStreak
} = require("../controllers/userController")
const auth = require("../middleware/auth")

const router = express.Router()

// All routes are protected
router.use(auth)

router.get("/profile", getProfile)
router.get("/xp", getUserXp)
router.put("/study-hours", updateStudyHours)
router.put("/avatar-style", updateAvatarStyle)
router.put("/profile", updateProfile)
router.post("/add-xp", addXp)
router.post("/update-streak", updateStreak); 



module.exports = router
