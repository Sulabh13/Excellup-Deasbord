const MCQTest = require('../models/MCQTest');
const Question = require('../models/Question');
const TestAttempt = require('../models/TestAttempt');
const Enrollment = require('../models/Enrollment');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// @desc    Create a test
// @route   POST /api/tests
// @access  Private (admin, teacher)
exports.createTest = async (req, res, next) => {
  try {
    const {
      title, description, subject, batch, duration, totalMarks, passingPercentage,
      negativeMarking, negativeMarkValue, startTime, endTime, instructions,
      status, allowMultipleAttempts, shuffleQuestions, shuffleOptions,
    } = req.body;

    if (!title || !batch || !duration) {
      return errorResponse(res, 'Title, batch, and duration are required', 400);
    }

    const test = await MCQTest.create({
      title, description: description || null, subject: subject || null, batch,
      createdBy: req.user._id, duration,
      totalMarks: totalMarks || 0, passingPercentage: passingPercentage || 40,
      negativeMarking: negativeMarking || false, negativeMarkValue: negativeMarkValue || 0,
      startTime: startTime || null, endTime: endTime || null, instructions: instructions || null,
      status: status || 'draft', allowMultipleAttempts: allowMultipleAttempts || false,
      shuffleQuestions: shuffleQuestions || false, shuffleOptions: shuffleOptions || false,
    });

    return successResponse(res, test, 'Test created successfully', 201);
  } catch (err) {
    next(err);
  }
};

// @desc    Get all tests (role-based filtering)
// @route   GET /api/tests
// @access  Private
exports.getAllTests = async (req, res, next) => {
  try {
    const { batch, subject, status, search } = req.query;
    const filter = {};

    if (req.user.role === 'teacher') {
      filter.createdBy = req.user._id;
    } else if (req.user.role === 'student') {
      // Students only see active/completed tests for their enrolled batches
      const enrollments = await Enrollment.find({ student: req.user._id, status: 'active' }).select('batch');
      const batchIds = enrollments.map((e) => e.batch);
      filter.batch = { $in: batchIds };
      filter.status = { $in: ['active', 'completed'] };
    }

    if (batch) filter.batch = batch;
    if (subject) filter.subject = subject;
    if (status && req.user.role !== 'student') filter.status = status;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const tests = await MCQTest.find(filter)
      .populate('subject', 'name code')
      .populate('batch', 'name batchCode')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    return successResponse(res, tests);
  } catch (err) {
    next(err);
  }
};

// @desc    Get single test
// @route   GET /api/tests/:id
// @access  Private
exports.getTestById = async (req, res, next) => {
  try {
    const test = await MCQTest.findById(req.params.id)
      .populate('subject', 'name code')
      .populate('batch', 'name batchCode')
      .populate('createdBy', 'name email');

    if (!test) return errorResponse(res, 'Test not found', 404);

    // Students can only see active/completed tests from their enrolled batches
    if (req.user.role === 'student') {
      const enrolled = await Enrollment.findOne({
        student: req.user._id,
        batch: test.batch._id,
        status: 'active',
      });
      if (!enrolled) return errorResponse(res, 'Not authorized to view this test', 403);
      if (!['active', 'completed'].includes(test.status)) {
        return errorResponse(res, 'Test is not available yet', 403);
      }
    }

    const questionCount = await Question.countDocuments({ test: test._id });
    return successResponse(res, { test, questionCount });
  } catch (err) {
    next(err);
  }
};

// @desc    Update test
// @route   PUT /api/tests/:id
// @access  Private (admin, teacher)
exports.updateTest = async (req, res, next) => {
  try {
    const test = await MCQTest.findById(req.params.id);
    if (!test) return errorResponse(res, 'Test not found', 404);

    if (req.user.role === 'teacher' && test.createdBy.toString() !== req.user._id.toString()) {
      return errorResponse(res, 'Not authorized to update this test', 403);
    }

    const allowedFields = [
      'title', 'description', 'subject', 'batch', 'duration', 'totalMarks', 'passingPercentage',
      'negativeMarking', 'negativeMarkValue', 'startTime', 'endTime', 'instructions', 'status',
      'allowMultipleAttempts', 'shuffleQuestions', 'shuffleOptions',
    ];
    const updates = {};
    allowedFields.forEach((f) => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });

    const updated = await MCQTest.findByIdAndUpdate(req.params.id, updates, {
      new: true, runValidators: true,
    })
      .populate('subject', 'name code')
      .populate('batch', 'name batchCode')
      .populate('createdBy', 'name');

    return successResponse(res, updated, 'Test updated successfully');
  } catch (err) {
    next(err);
  }
};

// @desc    Delete test and its questions/attempts
// @route   DELETE /api/tests/:id
// @access  Private (admin, teacher)
exports.deleteTest = async (req, res, next) => {
  try {
    const test = await MCQTest.findById(req.params.id);
    if (!test) return errorResponse(res, 'Test not found', 404);

    if (req.user.role === 'teacher' && test.createdBy.toString() !== req.user._id.toString()) {
      return errorResponse(res, 'Not authorized to delete this test', 403);
    }

    await Question.deleteMany({ test: test._id });
    await TestAttempt.deleteMany({ test: test._id });
    await MCQTest.findByIdAndDelete(test._id);

    return successResponse(res, null, 'Test and all associated data deleted successfully');
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle result published
// @route   PUT /api/tests/:id/publish-result
// @access  Private (admin, teacher)
exports.publishResult = async (req, res, next) => {
  try {
    const test = await MCQTest.findById(req.params.id);
    if (!test) return errorResponse(res, 'Test not found', 404);

    if (req.user.role === 'teacher' && test.createdBy.toString() !== req.user._id.toString()) {
      return errorResponse(res, 'Not authorized', 403);
    }

    test.isResultPublished = !test.isResultPublished;
    await test.save();

    return successResponse(
      res,
      { isResultPublished: test.isResultPublished },
      `Result ${test.isResultPublished ? 'published' : 'unpublished'} successfully`
    );
  } catch (err) {
    next(err);
  }
};

// @desc    Get test analytics/stats
// @route   GET /api/tests/:id/stats
// @access  Private (admin, teacher)
exports.getTestStats = async (req, res, next) => {
  try {
    const test = await MCQTest.findById(req.params.id);
    if (!test) return errorResponse(res, 'Test not found', 404);

    const attempts = await TestAttempt.find({
      test: test._id,
      status: { $in: ['submitted', 'auto-submitted'] },
    });

    const totalAttempts = attempts.length;
    const passed = attempts.filter((a) => a.isPassed).length;
    const failed = totalAttempts - passed;
    const avgPercentage =
      totalAttempts > 0
        ? Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / totalAttempts)
        : 0;
    const highest = totalAttempts > 0 ? Math.max(...attempts.map((a) => a.obtainedMarks)) : 0;
    const lowest = totalAttempts > 0 ? Math.min(...attempts.map((a) => a.obtainedMarks)) : 0;
    const passRate = totalAttempts > 0 ? Math.round((passed / totalAttempts) * 100) : 0;

    return successResponse(res, {
      totalAttempts, passed, failed, avgPercentage, highest, lowest, passRate,
    });
  } catch (err) {
    next(err);
  }
};
