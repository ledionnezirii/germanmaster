const express = require("express");
const router = express.Router();
const  protect  = require("../middleware/auth");

const {
  getAllVideos,
  getVideoById,
  createVideo,
  addSubtitles,
  markVideoFinished,
  getFinishedVideos
} = require("../controllers/videoController");

router.get("/",getAllVideos);
router.get('/finished', protect, getFinishedVideos);

router.get("/:id", getVideoById);
router.post("/",createVideo);
router.post("/:id/subtitles", addSubtitles);
router.post("/:id/finish", protect, markVideoFinished)

module.exports = router;