const Attendance = require('../models/Attendance');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// @desc    Mark attendance for a batch on a date
// @route   POST /api/attendance/mark
// @access  Private (admin, teacher)
exports.markAttendance = async (req, res, next) => {
  try {
    const { batchId, date, records } = req.body;
    // records: [{studentId, status, remark}]

    if (!batchId || !date || !Array.isArray(records) || records.length === 0) {
      return errorResponse(res, 'batchId, date, and records array are required', 400);
    }

    const attendanceDate = new Date(date);
    attendanceDate.setUTCHours(0, 0, 0, 0);

    const results = { created: 0, updated: 0, errors: [] };

    for (const record of records) {
      const { studentId, status, remark } = record;
      if (!studentId || !status) {
        results.errors.push({ studentId, reason: 'studentId and status are required' });
        continue;
      }
      if (!['present', 'absent', 'late'].includes(status)) {
        results.errors.push({ studentId, reason: `Invalid status: ${status}` });
        continue;
      }

      try {
        const existing = await Attendance.findOne({
          student: studentId,
          batch: batchId,
          date: attendanceDate,
        });

        if (existing) {
          existing.status = status;
          existing.markedBy = req.user._id;
          if (remark !== undefined) existing.remark = remark;
          await existing.save();
          results.updated++;
        } else {
          await Attendance.create({
            student: studentId,
            batch: batchId,
            date: attendanceDate,
            status,
            markedBy: req.user._id,
            remark: remark || null,
          });
          results.created++;
        }
      } catch (e) {
        results.errors.push({ studentId, reason: e.message });
      }
    }

    return successResponse(res, results, 'Attendance marked successfully');
  } catch (err) {
    next(err);
  }
};

// @desc    Get attendance for a batch on a specific date
// @route   GET /api/attendance/batch/:batchId/date/:date
// @access  Private (admin, teacher)
exports.getAttendanceByBatchDate = async (req, res, next) => {
  try {
    const { batchId, date } = req.params;
    const attendanceDate = new Date(date);
    attendanceDate.setUTCHours(0, 0, 0, 0);

    const records = await Attendance.find({ batch: batchId, date: attendanceDate })
      .populate('student', 'name email studentId avatar')
      .populate('markedBy', 'name role');

    return successResponse(res, records);
  } catch (err) {
    next(err);
  }
};

// @desc    Update a single attendance record
// @route   PUT /api/attendance/:id
// @access  Private (admin, teacher)
exports.updateAttendance = async (req, res, next) => {
  try {
    const { status, remark } = req.body;
    if (!status || !['present', 'absent', 'late'].includes(status)) {
      return errorResponse(res, "Invalid status. Use 'present', 'absent', or 'late'", 400);
    }

    const record = await Attendance.findByIdAndUpdate(
      req.params.id,
      { status, remark: remark || null, markedBy: req.user._id },
      { new: true, runValidators: true }
    ).populate('student', 'name email studentId');

    if (!record) return errorResponse(res, 'Attendance record not found', 404);
    return successResponse(res, record, 'Attendance updated successfully');
  } catch (err) {
    next(err);
  }
};

// @desc    Get student attendance (calendar data) with optional month/year filter
// @route   GET /api/attendance/student/:studentId
// @access  Private (student sees own only)
exports.getStudentAttendance = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { month, year, batchId } = req.query;

    if (req.user.role === 'student' && req.user._id.toString() !== studentId) {
      return errorResponse(res, 'Not authorized to view this attendance', 403);
    }

    const filter = { student: studentId };
    if (batchId) filter.batch = batchId;

    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      filter.date = { $gte: startDate, $lte: endDate };
    } else if (year) {
      const startDate = new Date(parseInt(year), 0, 1);
      const endDate = new Date(parseInt(year), 11, 31, 23, 59, 59);
      filter.date = { $gte: startDate, $lte: endDate };
    }

    const records = await Attendance.find(filter)
      .populate('batch', 'name batchCode')
      .sort({ date: 1 });

    // Build calendar map
    const calendarData = records.map((r) => ({
      date: r.date,
      status: r.status,
      batch: r.batch,
      remark: r.remark,
    }));

    const total = records.length;
    const present = records.filter((r) => r.status === 'present').length;
    const absent = records.filter((r) => r.status === 'absent').length;
    const late = records.filter((r) => r.status === 'late').length;
    const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

    return successResponse(res, { calendarData, summary: { total, present, absent, late, percentage } });
  } catch (err) {
    next(err);
  }
};

// @desc    Get attendance report (batch-wise or student-wise)
// @route   GET /api/attendance/report
// @access  Private (admin, teacher)
exports.getAttendanceReport = async (req, res, next) => {
  try {
    const { batchId, studentId, startDate, endDate } = req.query;

    const filter = {};
    if (batchId) filter.batch = batchId;
    if (studentId) filter.student = studentId;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const records = await Attendance.find(filter)
      .populate('student', 'name email studentId')
      .populate('batch', 'name batchCode')
      .sort({ date: 1 });

    // Aggregate per student
    const reportMap = {};
    for (const r of records) {
      const sid = r.student._id.toString();
      if (!reportMap[sid]) {
        reportMap[sid] = {
          student: r.student,
          batch: r.batch,
          total: 0,
          present: 0,
          absent: 0,
          late: 0,
        };
      }
      reportMap[sid].total++;
      reportMap[sid][r.status]++;
    }

    const report = Object.values(reportMap).map((item) => ({
      ...item,
      percentage:
        item.total > 0 ? Math.round(((item.present + item.late) / item.total) * 100) : 0,
    }));

    return successResponse(res, report);
  } catch (err) {
    next(err);
  }
};

// @desc    Export attendance as CSV
// @route   GET /api/attendance/export-csv
// @access  Private (admin, teacher)
exports.exportAttendanceCSV = async (req, res, next) => {
  try {
    const { batchId, startDate, endDate } = req.query;

    const filter = {};
    if (batchId) filter.batch = batchId;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const records = await Attendance.find(filter)
      .populate('student', 'name email studentId')
      .populate('batch', 'name batchCode')
      .populate('markedBy', 'name')
      .sort({ date: 1 });

    // Build CSV
    const headers = ['Student Name', 'Student ID', 'Email', 'Batch', 'Date', 'Status', 'Marked By', 'Remark'];
    const rows = records.map((r) => [
      r.student.name,
      r.student.studentId || '',
      r.student.email,
      r.batch ? r.batch.batchCode : '',
      new Date(r.date).toISOString().split('T')[0],
      r.status,
      r.markedBy ? r.markedBy.name : '',
      r.remark || '',
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="attendance.csv"');
    return res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
};
