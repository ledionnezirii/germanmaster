const express = require("express")
const {
  getAllFavorites,
  addFavorite,
  removeFavorite,
  updateFavoriteNotes,
  checkFavorite,
  getFavoritesByLevel,
  getFavoriteStats,
} = require("../controllers/favoriteController")
const auth = require("../middleware/auth")

const router = express.Router()

// All routes require authentication
router.use(auth)

router.get("/", getAllFavorites)
router.get("/stats", getFavoriteStats)
router.get("/level/:level", getFavoritesByLevel)
router.get("/check/:wordId", checkFavorite)
router.post("/", addFavorite)
router.put("/:wordId", updateFavoriteNotes)
router.delete("/:wordId", removeFavorite)

module.exports = router
