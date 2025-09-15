const express = require("express");
const router = express.Router();
const { getWords, addWord, checkPronunciation,addMultipleWords } = require("../controllers/pronunciationController");
const  protect  = require("../middleware/auth"); // middleware për JWT
const isAdmin = require("../middleware/isAdmin")

router.get("/", protect, getWords);
router.post("/", protect,isAdmin, addWord);
router.post("/check", protect, checkPronunciation);
router.post("/bulk", protect, isAdmin, addMultipleWords);


module.exports = router;
