const Attendance = require('../models/Attendance');
const TestAttempt = require('../models/TestAttempt');
const User = require('../models/User');
const Batch = require('../models/Batch');
const Enrollment = require('../models/Enrollment');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const ExcelJS = require('exceljs');

// ── Daily Attendance Report ──────────────────────────────────────────
exports.getDailyAttendanceReport = async (req, res) => {
  try {
    const { date, batchId } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    const start = new Date(targetDate); start.setHours(0, 0, 0, 0);
    const end = new Date(targetDate); end.setHours(23, 59, 59, 999);
    const filter = { date: { $gte: start, $lte: end } };
    if (batchId) filter.batch = batchId;
    const records = await Attendance.find(filter)
      .populate('student', 'name email studentId')
      .populate('batch', 'name')
      .sort('student.name');
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const late = records.filter(r => r.status === 'late').length;
    successResponse(res, { records, summary: { total: records.length, present, absent, late } });
  } catch (err) {
    errorResponse(res, err.message, 500);
  }
};

// ── Monthly Attendance Report ────────────────────────────────────────
exports.getMonthlyAttendanceReport = async (req, res) => {
  try {
    const { month, year, batchId } = req.query;
    const m = parseInt(month) || new Date().getMonth() + 1;
    const y = parseInt(year) || new Date().getFullYear();
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0, 23, 59, 59, 999);
    const filter = { date: { $gte: start, $lte: end } };
    if (batchId) filter.batch = batchId;
    const records = await Attendance.find(filter)
      .populate('student', 'name email studentId')
      .populate('batch', 'name');
    // Group by student
    const byStudent = {};
    records.forEach(r => {
      const sid = r.student._id.toString();
      if (!byStudent[sid]) byStudent[sid] = { student: r.student, present: 0, absent: 0, late: 0 };
      byStudent[sid][r.status]++;
    });
    const data = Object.values(byStudent).map(d => ({
      ...d,
      total: d.present + d.absent + d.late,
      percentage: d.present + d.late + d.absent > 0
        ? Math.round(((d.present + d.late) / (d.present + d.absent + d.late)) * 100) : 0,
    }));
    successResponse(res, data);
  } catch (err) {
    errorResponse(res, err.message, 500);
  }
};

// ── Student Attendance Report ────────────────────────────────────────
exports.getStudentAttendanceReport = async (req, res) => {
  try {
    const { studentId } = req.query;
    const records = await Attendance.find({ student: studentId })
      .populate('batch', 'name').sort('date');
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const late = records.filter(r => r.status === 'late').length;
    const percentage = records.length > 0 ? Math.round(((present + late) / records.length) * 100) : 0;
    successResponse(res, { records, summary: { total: records.length, present, absent, late, percentage } });
  } catch (err) {
    errorResponse(res, err.message, 500);
  }
};

// ── Batch Attendance Report ──────────────────────────────────────────
exports.getBatchAttendanceReport = async (req, res) => {
  try {
    const { batchId, month, year } = req.query;
    const filter = { batch: batchId };
    if (month && year) {
      const m = parseInt(month); const y = parseInt(year);
      filter.date = { $gte: new Date(y, m - 1, 1), $lte: new Date(y, m, 0, 23, 59, 59) };
    }
    const records = await Attendance.find(filter)
      .populate('student', 'name email studentId').sort('date');
    successResponse(res, records);
  } catch (err) {
    errorResponse(res, err.message, 500);
  }
};

// ── Test Result Report ───────────────────────────────────────────────
exports.getTestResultReport = async (req, res) => {
  try {
    const { testId } = req.query;
    const filter = { status: { $in: ['submitted', 'auto-submitted'] } };
    if (testId) filter.test = testId;
    const attempts = await TestAttempt.find(filter)
      .populate('student', 'name email studentId')
      .populate('test', 'title totalMarks passingPercentage')
      .sort('-submitTime');
    successResponse(res, attempts);
  } catch (err) {
    errorResponse(res, err.message, 500);
  }
};

// ── Export Attendance Excel ──────────────────────────────────────────
exports.exportAttendanceExcel = async (req, res) => {
  try {
    const { batchId, month, year } = req.query;
    const filter = {};
    if (batchId) filter.batch = batchId;
    if (month && year) {
      const m = parseInt(month); const y = parseInt(year);
      filter.date = { $gte: new Date(y, m - 1, 1), $lte: new Date(y, m, 0, 23, 59, 59) };
    }
    const records = await Attendance.find(filter)
      .populate('student', 'name studentId').populate('batch', 'name').sort('date');

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Attendance');
    sheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Student Name', key: 'studentName', width: 25 },
      { header: 'Student ID', key: 'studentId', width: 15 },
      { header: 'Batch', key: 'batch', width: 20 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Remark', key: 'remark', width: 20 },
    ];
    records.forEach(r => {
      sheet.addRow({
        date: r.date ? new Date(r.date).toLocaleDateString('en-IN') : '',
        studentName: r.student?.name || '',
        studentId: r.student?.studentId || '',
        batch: r.batch?.name || '',
        status: r.status,
        remark: r.remark || '',
      });
    });
    // Style header
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7C3AED' } };
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=attendance.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    errorResponse(res, err.message, 500);
  }
};

// ── Export Results CSV ───────────────────────────────────────────────
exports.exportResultsCSV = async (req, res) => {
  try {
    const { testId } = req.query;
    const filter = { status: { $in: ['submitted', 'auto-submitted'] } };
    if (testId) filter.test = testId;
    const attempts = await TestAttempt.find(filter)
      .populate('student', 'name email studentId')
      .populate('test', 'title totalMarks');

    const rows = [['Student Name', 'Student ID', 'Email', 'Test', 'Obtained Marks', 'Total Marks', 'Percentage', 'Status', 'Submit Time']];
    attempts.forEach(a => {
      rows.push([
        a.student?.name || '', a.student?.studentId || '', a.student?.email || '',
        a.test?.title || '', a.obtainedMarks, a.totalMarks,
        a.percentage + '%', a.isPassed ? 'Pass' : 'Fail',
        a.submitTime ? new Date(a.submitTime).toLocaleString('en-IN') : '',
      ]);
    });

    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=results.csv');
    res.send(csv);
  } catch (err) {
    errorResponse(res, err.message, 500);
  }
};

