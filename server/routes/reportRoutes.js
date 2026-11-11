const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getDailyAttendanceReport, getMonthlyAttendanceReport,
  getStudentAttendanceReport, getBatchAttendanceReport,
  getTestResultReport, exportAttendanceExcel, exportResultsCSV,
} = require('../controllers/reportController');

router.use(protect, authorize('admin', 'teacher'));
router.get('/attendance/daily', getDailyAttendanceReport);
router.get('/attendance/monthly', getMonthlyAttendanceReport);
router.get('/attendance/student', getStudentAttendanceReport);
router.get('/attendance/batch', getBatchAttendanceReport);
router.get('/test-results', getTestResultReport);
router.get('/export/attendance-excel', exportAttendanceExcel);
router.get('/export/results-csv', exportResultsCSV);

module.exports = router;

