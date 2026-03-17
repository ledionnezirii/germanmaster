const User = require("../models/User");
const Video = require("../models/Video");

// GET /api/videos
const getAllVideos = async (req, res) => {
  const videos = await Video.find().sort({ createdAt: -1 });
  res.json({ success: true, data: videos });
};

// GET /api/videos/:id
const getVideoById = async (req, res) => {
  const video = await Video.findById(req.params.id);
  if (!video) return res.status(404).json({ success: false, message: "Video not found" });
  res.json({ success: true, data: video });
};

// POST /api/videos
const createVideo = async (req, res) => {
  const video = await Video.create(req.body);

  res.status(201).json({
    success: true,
    data: video
  });
};

// POST /api/videos/:id/subtitles
const addSubtitles = async (req, res) => {
  const video = await Video.findById(req.params.id);
  if (!video) return res.status(404).json({ success: false, message: "Video not found" });
  video.subtitles = req.body.subtitles;
  await video.save();
  res.json({ success: true, data: video });
};
const markVideoFinished = async (req, res) => {
  const userId = req.user._id; // assuming auth middleware
  const videoId = req.params.id;
  
  const user = await User.findById(userId);
  if (!user.finishedVideos) user.finishedVideos = [];
  
  if (!user.finishedVideos.includes(videoId)) {
    user.finishedVideos.push(videoId);
    user.videosFinished = user.finishedVideos.length;
    await user.save();
  }
  
  res.json({ success: true, videosFinished: user.videosFinished });


};

  const getFinishedVideos = async (req, res) => {
  const userId = req.user._id;
  const user = await User.findById(userId);
  res.json({ success: true, data: user.finishedVideos || [] });
};
module.exports = { getAllVideos, getVideoById, createVideo, addSubtitles,markVideoFinished, getFinishedVideos };