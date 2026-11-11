const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const TeacherProfile = require('../models/TeacherProfile');
const Batch = require('../models/Batch');
const Course = require('../models/Course');
const Attendance = require('../models/Attendance');
const MCQTest = require('../models/MCQTest');
const TestAttempt = require('../models/TestAttempt');
const Enrollment = require('../models/Enrollment');
const Announcement = require('../models/Announcement');
const StudyMaterial = require('../models/StudyMaterial');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// ─── ADMIN DASHBOARD ────────────────────────────────────────────────
exports.getAdminDashboard = async (req, res) => {
  try {
    const [totalStudents, totalTeachers, totalBatches, totalCourses] = await Promise.all([
      User.countDocuments({ role: 'student', isActive: true }),
      User.countDocuments({ role: 'teacher', isActive: true }),
      Batch.countDocuments({ isActive: true }),
      Course.countDocuments({ isActive: true }),
    ]);

    // Today's attendance
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
    const todayAttendance = await Attendance.countDocuments({
      date: { $gte: todayStart, $lte: todayEnd }, status: 'present',
    });

    const now = new Date();
    const activeTests = await MCQTest.countDocuments({
      startTime: { $lte: now }, endTime: { $gte: now }, status: { $ne: 'draft' },
    });
    const upcomingTests = await MCQTest.countDocuments({
      startTime: { $gt: now }, status: { $ne: 'draft' },
    });

    // Monthly enrollment chart (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1); sixMonthsAgo.setHours(0, 0, 0, 0);

    const enrollmentData = await Enrollment.aggregate([
      { $match: { enrollmentDate: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$enrollmentDate' }, month: { $month: '$enrollmentDate' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Batch-wise student count
    const batchDistribution = await Enrollment.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$batch', count: { $sum: 1 } } },
      { $lookup: { from: 'batches', localField: '_id', foreignField: '_id', as: 'batchInfo' } },
      { $unwind: '$batchInfo' },
      { $project: { name: '$batchInfo.name', count: 1 } },
      { $limit: 10 },
    ]);

    // Recent tests
    const recentTests = await MCQTest.find()
      .populate('subject', 'name').populate('batch', 'name')
      .sort('-createdAt').limit(5).select('title status startTime endTime');

    // Recent activity — recent users
    const recentStudents = await User.find({ role: 'student' })
      .sort('-createdAt').limit(5).select('name email createdAt');

    successResponse(res, {
      totalStudents, totalTeachers, totalBatches, totalCourses,
      todayAttendance, activeTests, upcomingTests,
      enrollmentChart: enrollmentData,
      batchDistribution,
      recentTests,
      recentStudents,
    }, 'Admin dashboard data');
  } catch (err) {
    errorResponse(res, err.message, 500);
  }
};

// ─── TEACHER DASHBOARD ───────────────────────────────────────────────
exports.getTeacherDashboard = async (req, res) => {
  try {
    const teacher = await TeacherProfile.findOne({ user: req.user._id });
    const assignedBatches = await Batch.find({ teacher: req.user._id, isActive: true })
      .populate('course', 'name').populate('subject', 'name');

    const batchIds = assignedBatches.map(b => b._id);

    const totalStudents = await Enrollment.countDocuments({ batch: { $in: batchIds }, status: 'active' });

    const now = new Date();
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);

    // Attendance marked today per batch
    const attendanceToday = await Attendance.aggregate([
      { $match: { batch: { $in: batchIds }, date: { $gte: todayStart, $lte: todayEnd } } },
      { $group: { _id: '$batch', count: { $sum: 1 } } },
    ]);

    const upcomingTests = await MCQTest.find({
      batch: { $in: batchIds }, startTime: { $gt: now }, status: { $ne: 'draft' },
    }).populate('subject', 'name').sort('startTime').limit(5);

    const recentMaterials = await StudyMaterial.find({ uploadedBy: req.user._id })
      .populate('subject', 'name').populate('batch', 'name')
      .sort('-createdAt').limit(5);

    successResponse(res, {
      assignedBatches,
      totalStudents,
      attendanceToday,
      upcomingTests,
      recentMaterials,
    }, 'Teacher dashboard data');
  } catch (err) {
    errorResponse(res, err.message, 500);
  }
};

// ─── STUDENT DASHBOARD ───────────────────────────────────────────────
exports.getStudentDashboard = async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({ student: req.user._id, status: 'active' })
      .populate('batch').populate({ path: 'batch', populate: { path: 'teacher', select: 'name' } });

    const profile = await StudentProfile.findOne({ user: req.user._id })
      .populate('course', 'name').populate('batch', 'name');

    // Attendance summary
    const totalAttendance = await Attendance.countDocuments({ student: req.user._id });
    const presentCount = await Attendance.countDocuments({ student: req.user._id, status: 'present' });
    const lateCount = await Attendance.countDocuments({ student: req.user._id, status: 'late' });
    const attendancePercentage = totalAttendance > 0
      ? Math.round(((presentCount + lateCount) / totalAttendance) * 100) : 0;

    // Upcoming tests for student's batch
    const batchId = enrollment?.batch?._id;
    const now = new Date();
    const upcomingTests = batchId ? await MCQTest.find({
      batch: batchId, startTime: { $gt: now }, status: { $ne: 'draft' },
    }).populate('subject', 'name').sort('startTime').limit(5) : [];

    // Active tests
    const activeTests = batchId ? await MCQTest.find({
      batch: batchId, startTime: { $lte: now }, endTime: { $gte: now }, status: { $ne: 'draft' },
    }).populate('subject', 'name') : [];

    // Recent materials
    const recentMaterials = batchId ? await StudyMaterial.find({ batch: batchId, isActive: true })
      .populate('subject', 'name').sort('-createdAt').limit(6) : [];

    // Latest result
    const latestAttempt = await TestAttempt.findOne({
      student: req.user._id, status: { $in: ['submitted', 'auto-submitted'] },
    }).populate('test', 'title totalMarks').sort('-submitTime');

    // Announcements
    const announcements = await Announcement.find({
      isActive: true,
      $or: [{ targetRole: 'all' }, { targetRole: 'student' }],
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    }).sort('-createdAt').limit(5);

    successResponse(res, {
      profile,
      enrollment,
      attendance: { total: totalAttendance, present: presentCount, late: lateCount, percentage: attendancePercentage },
      upcomingTests,
      activeTests,
      recentMaterials,
      latestAttempt,
      announcements,
    }, 'Student dashboard data');
  } catch (err) {
    errorResponse(res, err.message, 500);
  }
};

