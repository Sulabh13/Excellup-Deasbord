const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createStudent, getAllStudents, getStudentById,
  updateStudent, deleteStudent,
  getStudentAttendanceSummary, getStudentTestHistory,
} = require('../controllers/studentController');

router.use(protect);
router.route('/').get(authorize('admin', 'teacher'), getAllStudents).post(authorize('admin'), createStudent);
router.route('/:id').get(getStudentById).put(authorize('admin'), updateStudent).delete(authorize('admin'), deleteStudent);
router.get('/:id/attendance-summary', getStudentAttendanceSummary);
router.get('/:id/test-history', getStudentTestHistory);

module.exports = router;

