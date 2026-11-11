const Batch = require('../models/Batch');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const TeacherProfile = require('../models/TeacherProfile');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// @desc    Create a batch
// @route   POST /api/batches
// @access  Private (admin)
exports.createBatch = async (req, res, next) => {
  try {
    const { name, batchCode, course, subject, teacher, schedule, startDate, endDate, maxStudents, description } = req.body;

    if (!name || !batchCode || !course) {
      return errorResponse(res, 'Name, batchCode and course are required', 400);
    }

    const existing = await Batch.findOne({ batchCode: batchCode.toUpperCase() });
    if (existing) return errorResponse(res, `Batch code '${batchCode}' already exists`, 400);

    const batch = await Batch.create({
      name,
      batchCode: batchCode.toUpperCase(),
      course,
      subject: subject || null,
      teacher: teacher || null,
      schedule: schedule || null,
      startDate: startDate || null,
      endDate: endDate || null,
      maxStudents: maxStudents || 50,
      description: description || null,
    });

    // Update teacher profile's assignedBatches
    if (teacher) {
      await TeacherProfile.findOneAndUpdate(
        { user: teacher },
        { $addToSet: { assignedBatches: batch._id } }
      );
    }

    return successResponse(res, batch, 'Batch created successfully', 201);
  } catch (err) {
    next(err);
  }
};

// @desc    Get all batches
// @route   GET /api/batches
// @access  Private
exports.getAllBatches = async (req, res, next) => {
  try {
    const { course, isActive, search } = req.query;
    const filter = {};

    // Teachers can only see their batches
    if (req.user.role === 'teacher') {
      filter.teacher = req.user._id;
    }

    if (course) filter.course = course;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) filter.name = { $regex: search, $options: 'i' };

    const batches = await Batch.find(filter)
      .populate('course', 'name code')
      .populate('subject', 'name code')
      .populate('teacher', 'name email')
      .sort({ createdAt: -1 });

    return successResponse(res, batches);
  } catch (err) {
    next(err);
  }
};

// @desc    Get single batch
// @route   GET /api/batches/:id
// @access  Private
exports.getBatchById = async (req, res, next) => {
  try {
    const batch = await Batch.findById(req.params.id)
      .populate('course', 'name code fees duration')
      .populate('subject', 'name code')
      .populate('teacher', 'name email avatar');

    if (!batch) return errorResponse(res, 'Batch not found', 404);

    // Teachers can only view their own batches
    if (
      req.user.role === 'teacher' &&
      batch.teacher &&
      batch.teacher._id.toString() !== req.user._id.toString()
    ) {
      return errorResponse(res, 'Not authorized to view this batch', 403);
    }

    const enrolledCount = await Enrollment.countDocuments({ batch: batch._id, status: 'active' });
    return successResponse(res, { batch, enrolledCount });
  } catch (err) {
    next(err);
  }
};

// @desc    Update batch
// @route   PUT /api/batches/:id
// @access  Private (admin)
exports.updateBatch = async (req, res, next) => {
  try {
    const { name, batchCode, course, subject, teacher, schedule, startDate, endDate, maxStudents, isActive, description } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (batchCode !== undefined) updates.batchCode = batchCode.toUpperCase();
    if (course !== undefined) updates.course = course;
    if (subject !== undefined) updates.subject = subject;
    if (teacher !== undefined) updates.teacher = teacher;
    if (schedule !== undefined) updates.schedule = schedule;
    if (startDate !== undefined) updates.startDate = startDate;
    if (endDate !== undefined) updates.endDate = endDate;
    if (maxStudents !== undefined) updates.maxStudents = maxStudents;
    if (isActive !== undefined) updates.isActive = isActive;
    if (description !== undefined) updates.description = description;

    const batch = await Batch.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    })
      .populate('course', 'name code')
      .populate('subject', 'name code')
      .populate('teacher', 'name email');

    if (!batch) return errorResponse(res, 'Batch not found', 404);

    // If teacher changed, update teacher profiles
    if (teacher) {
      await TeacherProfile.findOneAndUpdate(
        { user: teacher },
        { $addToSet: { assignedBatches: batch._id } }
      );
    }

    return successResponse(res, batch, 'Batch updated successfully');
  } catch (err) {
    next(err);
  }
};

// @desc    Delete batch
// @route   DELETE /api/batches/:id
// @access  Private (admin)
exports.deleteBatch = async (req, res, next) => {
  try {
    const batch = await Batch.findByIdAndDelete(req.params.id);
    if (!batch) return errorResponse(res, 'Batch not found', 404);
    return successResponse(res, null, 'Batch deleted successfully');
  } catch (err) {
    next(err);
  }
};

// @desc    Get students enrolled in a batch
// @route   GET /api/batches/:id/students
// @access  Private (admin, teacher)
exports.getBatchStudents = async (req, res, next) => {
  try {
    const { status = 'active' } = req.query;
    const enrollments = await Enrollment.find({ batch: req.params.id, status })
      .populate({
        path: 'student',
        select: 'name email studentId avatar isActive',
      })
      .sort({ enrollmentDate: -1 });

    return successResponse(res, enrollments);
  } catch (err) {
    next(err);
  }
};

// @desc    Enroll a student in a batch
// @route   POST /api/batches/:id/enroll
// @access  Private (admin)
exports.enrollStudentToBatch = async (req, res, next) => {
  try {
    const { studentId } = req.body;
    if (!studentId) return errorResponse(res, 'studentId is required', 400);

    const batch = await Batch.findById(req.params.id);
    if (!batch) return errorResponse(res, 'Batch not found', 404);

    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return errorResponse(res, 'Student not found', 404);
    }

    const currentCount = await Enrollment.countDocuments({ batch: batch._id, status: 'active' });
    if (currentCount >= batch.maxStudents) {
      return errorResponse(res, 'Batch is full. Max students limit reached.', 400);
    }

    const existing = await Enrollment.findOne({ student: studentId, batch: batch._id });
    if (existing) {
      if (existing.status === 'active') {
        return errorResponse(res, 'Student is already enrolled in this batch', 400);
      }
      existing.status = 'active';
      await existing.save();
    } else {
      await Enrollment.create({ student: studentId, batch: batch._id });
    }

    // Update student profile batch
    await StudentProfile.findOneAndUpdate({ user: studentId }, { batch: batch._id });

    return successResponse(res, null, 'Student enrolled successfully');
  } catch (err) {
    next(err);
  }
};

// @desc    Remove student from batch
// @route   DELETE /api/batches/:id/enroll/:studentId
// @access  Private (admin)
exports.removeStudentFromBatch = async (req, res, next) => {
  try {
    const enrollment = await Enrollment.findOneAndUpdate(
      { batch: req.params.id, student: req.params.studentId },
      { status: 'dropped' },
      { new: true }
    );

    if (!enrollment) return errorResponse(res, 'Enrollment not found', 404);
    return successResponse(res, null, 'Student removed from batch successfully');
  } catch (err) {
    next(err);
  }
};
