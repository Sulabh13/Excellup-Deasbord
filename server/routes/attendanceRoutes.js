const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  markAttendance, getAttendanceByBatchDate, updateAttendance,
  getStudentAttendance, getAttendanceReport, exportAttendanceCSV,
} = require('../controllers/attendanceController');

router.use(protect);
router.post('/mark', authorize('admin', 'teacher'), markAttendance);
router.get('/batch', authorize('admin', 'teacher'), getAttendanceByBatchDate);
router.get('/batch/:batchId', authorize('admin', 'teacher'), getAttendanceByBatchDate);
router.put('/:id', authorize('admin', 'teacher'), updateAttendance);
router.get('/student', getStudentAttendance);
router.get('/student/:studentId', getStudentAttendance);
router.get('/report', authorize('admin', 'teacher'), getAttendanceReport);
router.get('/export/csv', authorize('admin', 'teacher'), exportAttendanceCSV);

module.exports = router;

