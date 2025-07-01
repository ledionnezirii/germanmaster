const express = require("express")
const {
  getProfile,
  getUserXp,
  updateStudyHours,
  uploadProfilePicture,
  updateProfile,
  addXp,
} = require("../controllers/userController")
const  auth  = require("../middleware/auth")

const router = express.Router()

// All routes are protected
router.use(auth)

router.get("/profile", getProfile)
router.get("/xp", getUserXp)
router.put("/study-hours", updateStudyHours)
router.post("/profile-picture", uploadProfilePicture)
router.put("/profile", updateProfile)
router.post("/add-xp", addXp)

module.exports = router
