const mongoose = require('mongoose');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const Enrollment = require('../models/Enrollment');
const Attendance = require('../models/Attendance');
const TestAttempt = require('../models/TestAttempt');
const Course = require('../models/Course');
const Batch = require('../models/Batch');
const generateStudentId = require('../utils/generateStudentId');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * Robust helper to resolve student User and StudentProfile by:
 * - User _id
 * - StudentProfile _id
 * - studentId string (e.g. EXC-2024-001)
 */
const resolveStudent = async (identifier) => {
  if (!identifier) return { user: null, profile: null };

  const idStr = String(identifier).trim();

  // 1. If valid ObjectId, try finding User directly
  if (mongoose.Types.ObjectId.isValid(idStr)) {
    const user = await User.findById(idStr);
    if (user && user.role === 'student') {
      const profile = await StudentProfile.findOne({ user: user._id });
      return { user, profile };
    }
  }

  // 2. If valid ObjectId, try finding StudentProfile
  if (mongoose.Types.ObjectId.isValid(idStr)) {
    const profile = await StudentProfile.findById(idStr);
    if (profile && profile.user) {
      const user = await User.findById(profile.user);
      if (user && user.role === 'student') {
        return { user, profile };
      }
    }
  }

  // 3. Try finding User by studentId (e.g. EXC-2024-001)
  const userByCode = await User.findOne({ studentId: idStr, role: 'student' });
  if (userByCode) {
    const profile = await StudentProfile.findOne({ user: userByCode._id });
    return { user: userByCode, profile };
  }

  // 4. Try finding StudentProfile by studentId
  const profileByCode = await StudentProfile.findOne({ studentId: idStr });
  if (profileByCode && profileByCode.user) {
    const user = await User.findById(profileByCode.user);
    if (user && user.role === 'student') {
      return { user, profile: profileByCode };
    }
  }

  return { user: null, profile: null };
};

// @desc    Create a new student (admin only)
// @route   POST /api/students
// @access  Private (admin)
exports.createStudent = async (req, res, next) => {
  try {
    const {
      name, email, password, phone, address, guardianName, guardianPhone,
      course, batch, courseId, batchId,
    } = req.body;

    const selectedCourse = course || courseId || null;
    const selectedBatch = batch || batchId || null;

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
      course: selectedCourse,
      batch: selectedBatch,
      phone: phone || null,
      address: address || null,
      guardianName: guardianName || null,
      guardianPhone: guardianPhone || null,
      status: 'active',
    });

    // Auto-enroll in batch if provided
    if (selectedBatch) {
      await Enrollment.create({ student: user._id, batch: selectedBatch }).catch(() => {});
    }

    const safeUser = user.toObject();
    delete safeUser.password;

    return successResponse(
      res,
      { user: safeUser, profile },
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
    const { search, batch, course, status, batchId, courseId } = req.query;

    const selectedBatch = batch || batchId;
    const selectedCourse = course || courseId;

    // Ensure any student users missing a profile have one created
    const studentUsers = await User.find({ role: 'student' }).select('_id studentId');
    for (const u of studentUsers) {
      const exists = await StudentProfile.findOne({ user: u._id });
      if (!exists) {
        await StudentProfile.create({
          user: u._id,
          studentId: u.studentId || (await generateStudentId()),
          status: 'active',
        }).catch(() => {});
      }
    }

    // Build profile filter
    const profileFilter = {};
    if (selectedBatch) profileFilter.batch = selectedBatch;
    if (selectedCourse) profileFilter.course = selectedCourse;
    if (status) profileFilter.status = status;

    // If searching, match user name/email/studentId
    if (search && search.trim()) {
      const q = search.trim();
      const matchedUsers = await User.find({
        role: 'student',
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } },
          { studentId: { $regex: q, $options: 'i' } },
        ],
      }).select('_id');
      const userIds = matchedUsers.map((u) => u._id);
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
      pagination: { total, page, limit, pages: Math.ceil(total / limit) || 1 },
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
    const { user, profile } = await resolveStudent(req.params.id);
    if (!user) {
      return errorResponse(res, 'Student not found', 404);
    }

    // Students can only view their own profile
    if (req.user.role === 'student' && req.user._id.toString() !== user._id.toString()) {
      return errorResponse(res, 'Not authorized to view this profile', 403);
    }

    const populatedProfile = await StudentProfile.findOne({ user: user._id })
      .populate('course', 'name code fees duration')
      .populate('batch', 'name batchCode schedule startDate endDate')
      .populate({ path: 'batch', populate: { path: 'teacher', select: 'name email' } });

    const enrollments = await Enrollment.find({ student: user._id })
      .populate('batch', 'name batchCode schedule course')
      .sort({ enrollmentDate: -1 });

    const safeUser = user.toObject();
    delete safeUser.password;

    return successResponse(res, {
      user: safeUser,
      profile: populatedProfile || profile,
      enrollments,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update student profile
// @route   PUT /api/students/:id
// @access  Private (admin)
exports.updateStudent = async (req, res, next) => {
  try {
    const {
      name, email, phone, address, guardianName, guardianPhone,
      course, batch, courseId, batchId, status,
    } = req.body;

    const selectedCourse = course || courseId;
    const selectedBatch = batch || batchId;

    const { user } = await resolveStudent(req.params.id);
    if (!user) {
      return errorResponse(res, 'Student not found', 404);
    }

    if (name) user.name = name;
    if (email) user.email = email.toLowerCase();
    await user.save();

    const updateFields = {};
    if (phone !== undefined) updateFields.phone = phone;
    if (address !== undefined) updateFields.address = address;
    if (guardianName !== undefined) updateFields.guardianName = guardianName;
    if (guardianPhone !== undefined) updateFields.guardianPhone = guardianPhone;
    if (selectedCourse !== undefined) updateFields.course = selectedCourse || null;
    if (selectedBatch !== undefined) updateFields.batch = selectedBatch || null;
    if (status !== undefined) updateFields.status = status;

    const profile = await StudentProfile.findOneAndUpdate(
      { user: user._id },
      { $set: updateFields },
      { new: true, upsert: true, runValidators: true }
    )
      .populate('course', 'name code')
      .populate('batch', 'name batchCode');

    // Auto-enroll if new batch provided
    if (selectedBatch) {
      const enrolled = await Enrollment.findOne({ student: user._id, batch: selectedBatch });
      if (!enrolled) {
        await Enrollment.create({ student: user._id, batch: selectedBatch }).catch(() => {});
      }
    }

    const safeUser = user.toObject();
    delete safeUser.password;

    return successResponse(res, { user: safeUser, profile }, 'Student updated successfully');
  } catch (err) {
    next(err);
  }
};

// @desc    Delete student (soft delete)
// @route   DELETE /api/students/:id
// @access  Private (admin)
exports.deleteStudent = async (req, res, next) => {
  try {
    const { user } = await resolveStudent(req.params.id);
    if (!user) {
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
    const { user } = await resolveStudent(req.params.id);
    if (!user) {
      return errorResponse(res, 'Student not found', 404);
    }

    if (req.user.role === 'student' && req.user._id.toString() !== user._id.toString()) {
      return errorResponse(res, 'Not authorized', 403);
    }

    const records = await Attendance.find({ student: user._id });
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
    const { user } = await resolveStudent(req.params.id);
    if (!user) {
      return errorResponse(res, 'Student not found', 404);
    }

    if (req.user.role === 'student' && req.user._id.toString() !== user._id.toString()) {
      return errorResponse(res, 'Not authorized', 403);
    }

    const attempts = await TestAttempt.find({ student: user._id })
      .populate('test', 'title subject batch duration totalMarks passingPercentage status isResultPublished')
      .sort({ createdAt: -1 });

    return successResponse(res, attempts);
  } catch (err) {
    next(err);
  }
};
