const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAnnouncements, getAnnouncementById,
  createAnnouncement, updateAnnouncement, deleteAnnouncement,
} = require('../controllers/announcementController');

router.use(protect);
router.route('/').get(getAnnouncements).post(authorize('admin', 'teacher'), createAnnouncement);
router.route('/:id').get(getAnnouncementById).put(authorize('admin', 'teacher'), updateAnnouncement).delete(authorize('admin', 'teacher'), deleteAnnouncement);

module.exports = router;

