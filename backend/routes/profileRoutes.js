const express = require('express');
const router = express.Router();
const {
  getProfile, updateProfile, uploadAvatar, uploadResume,
  getRecommendations, getNotifications, markNotificationsRead
} = require('../controllers/profileController');

router.get('/:userId', getProfile);
router.put('/:userId', updateProfile);
router.post('/:userId/avatar', uploadAvatar);
router.post('/:userId/resume', uploadResume);
router.get('/:userId/recommendations', getRecommendations);
router.get('/:userId/notifications', getNotifications);
router.put('/:userId/notifications/read', markNotificationsRead);

module.exports = router;
