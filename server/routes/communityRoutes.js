const express = require('express');
const router = express.Router();
const  protect  = require('../middleware/auth');
const communityController = require('../controllers/communityController');

router.get('/', protect, communityController.getMessages);
router.get('/:messageId/replies', protect, communityController.getReplies);
router.post('/', protect, communityController.postMessage);
router.post('/:messageId/like', protect, communityController.toggleLike);
router.delete('/:messageId', protect, communityController.deleteMessage);

module.exports = router;