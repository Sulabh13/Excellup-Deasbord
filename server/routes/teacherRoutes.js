const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createTeacher, getAllTeachers, getTeacherById,
  updateTeacher, deleteTeacher, getTeacherBatches,
} = require('../controllers/teacherController');

router.use(protect);
router.route('/').get(authorize('admin'), getAllTeachers).post(authorize('admin'), createTeacher);
router.route('/:id').get(authorize('admin'), getTeacherById).put(authorize('admin'), updateTeacher).delete(authorize('admin'), deleteTeacher);
router.get('/:id/batches', getTeacherBatches);

module.exports = router;

