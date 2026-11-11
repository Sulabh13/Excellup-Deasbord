const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const Enrollment = require('../models/Enrollment');
const Attendance = require('../models/Attendance');
const TestAttempt = require('../models/TestAttempt');
const generateStudentId = require('../utils/generateStudentId');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// @desc    Create a new student (admin only)
// @route   POST /api/students
// @access  Private (admin)
exports.createStudent = async (req, res, next) => {
  try {
    const { name, email, password, phone, address, guardianName, guardianPhone, course, batch } =
      req.body;

    if (!name || !email || !password) {
      return errorResponse(res, 'Name, email, and password are required', 400);
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return errorResponse(res, 'Email already in use', 400);

    const studentId = await generateStudentId();

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: 'student',
      studentId,
    });

    const profile = await StudentProfile.create({
      user: user._id,
      studentId,
      course: course || null,
      batch: batch || null,
      phone: phone || null,
      address: address || null,
      guardianName: guardianName || null,
      guardianPhone: guardianPhone || null,
    });

    // Auto-enroll in batch if provided
    if (batch) {
      await Enrollment.create({ student: user._id, batch }).catch(() => {});
    }

    return successResponse(
      res,
      { user: { _id: user._id, name, email: user.email, studentId }, profile },
      'Student created successfully',
      201
    );
  } catch (err) {
    next(err);
  }
};

// @desc    Get all students with pagination, search, filters
// @route   GET /api/students
// @access  Private (admin, teacher)
exports.getAllStudents = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;
    const { search, batch, course, status } = req.query;

    // Build profile filter
    const profileFilter = {};
    if (batch) profileFilter.batch = batch;
    if (course) profileFilter.course = course;
    if (status) profileFilter.status = status;

    // If searching, also match user name/email/studentId
    let userIds = null;
    if (search) {
      const matchedUsers = await User.find({
        role: 'student',
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { studentId: { $regex: search, $options: 'i' } },
        ],
      }).select('_id');
      userIds = matchedUsers.map((u) => u._id);
      profileFilter.user = { $in: userIds };
    }

    const total = await StudentProfile.countDocuments(profileFilter);
    const profiles = await StudentProfile.find(profileFilter)
      .populate('user', 'name email studentId isActive avatar')
      .populate('course', 'name code')
      .populate('batch', 'name batchCode schedule')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return successResponse(res, {
      students: profiles,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single student full profile
// @route   GET /api/students/:id
// @access  Private (admin, teacher, own student)
exports.getStudentById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user || user.role !== 'student') {
      return errorResponse(res, 'Student not found', 404);
    }

    // Students can only view their own profile
    if (req.user.role === 'student' && req.user._id.toString() !== user._id.toString()) {
      return errorResponse(res, 'Not authorized to view this profile', 403);
    }

    const profile = await StudentProfile.findOne({ user: user._id })
      .populate('course', 'name code fees duration')
      .populate('batch', 'name batchCode schedule startDate endDate')
      .populate({ path: 'batch', populate: { path: 'teacher', select: 'name email' } });

    const enrollments = await Enrollment.find({ student: user._id })
      .populate('batch', 'name batchCode schedule course')
      .sort({ enrollmentDate: -1 });

    return successResponse(res, { user, profile, enrollments });
  } catch (err) {
    next(err);
  }
};

// @desc    Update student profile
// @route   PUT /api/students/:id
// @access  Private (admin)
exports.updateStudent = async (req, res, next) => {
  try {
    const { name, email, phone, address, guardianName, guardianPhone, course, batch, status } =
      req.body;

    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'student') {
      return errorResponse(res, 'Student not found', 404);
    }

    if (name) user.name = name;
    if (email) user.email = email.toLowerCase();
    await user.save();

    const profile = await StudentProfile.findOneAndUpdate(
      { user: user._id },
      { phone, address, guardianName, guardianPhone, course, batch, status },
      { new: true, runValidators: true }
    )
      .populate('course', 'name code')
      .populate('batch', 'name batchCode');

    return successResponse(res, { user, profile }, 'Student updated successfully');
  } catch (err) {
    next(err);
  }
};

// @desc    Delete student (soft delete)
// @route   DELETE /api/students/:id
// @access  Private (admin)
exports.deleteStudent = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'student') {
      return errorResponse(res, 'Student not found', 404);
    }
    user.isActive = false;
    await user.save();
    await StudentProfile.findOneAndUpdate({ user: user._id }, { status: 'inactive' });
    return successResponse(res, null, 'Student deactivated successfully');
  } catch (err) {
    next(err);
  }
};

// @desc    Get student attendance summary
// @route   GET /api/students/:id/attendance-summary
// @access  Private
exports.getStudentAttendanceSummary = async (req, res, next) => {
  try {
    const studentId = req.params.id;

    if (req.user.role === 'student' && req.user._id.toString() !== studentId) {
      return errorResponse(res, 'Not authorized', 403);
    }

    const records = await Attendance.find({ student: studentId });
    const total = records.length;
    const present = records.filter((r) => r.status === 'present').length;
    const absent = records.filter((r) => r.status === 'absent').length;
    const late = records.filter((r) => r.status === 'late').length;
    const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

    return successResponse(res, { total, present, absent, late, percentage });
  } catch (err) {
    next(err);
  }
};

// @desc    Get student test history
// @route   GET /api/students/:id/test-history
// @access  Private
exports.getStudentTestHistory = async (req, res, next) => {
  try {
    const studentId = req.params.id;

    if (req.user.role === 'student' && req.user._id.toString() !== studentId) {
      return errorResponse(res, 'Not authorized', 403);
    }

    const attempts = await TestAttempt.find({ student: studentId })
      .populate('test', 'title subject batch duration totalMarks passingPercentage status isResultPublished')
      .sort({ createdAt: -1 });

    return successResponse(res, attempts);
  } catch (err) {
    next(err);
  }
};
