const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// @desc    Get assignments (with optional courseId filter)
// @route   GET /api/lms/assignments
// @access  Protected
exports.getAllAssignments = async (req, res, next) => {
  try {
    const { courseId, batchId } = req.query;
    const filter = { isActive: true };

    if (courseId) filter.course = courseId;
    if (batchId) filter.batch = batchId;

    const assignments = await Assignment.find(filter)
      .populate('course', 'title thumbnail')
      .populate('batch', 'name batchCode')
      .populate('teacher', 'name email avatar')
      .sort({ deadline: 1 });

    // If student, attach their submission status to each assignment
    if (req.user?.role === 'student') {
      const submissions = await AssignmentSubmission.find({
        student: req.user._id,
      });
      const submissionMap = new Map();
      submissions.forEach((s) => submissionMap.set(s.assignment.toString(), s));

      const enriched = assignments.map((a) => {
        const sub = submissionMap.get(a._id.toString());
        return {
          ...a.toObject(),
          mySubmission: sub || null,
        };
      });
      return successResponse(res, enriched);
    }

    return successResponse(res, assignments);
  } catch (err) {
    next(err);
  }
};

// @desc    Get assignment by ID with submissions
// @route   GET /api/lms/assignments/:id
// @access  Protected
exports.getAssignmentById = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('course', 'title thumbnail')
      .populate('batch', 'name batchCode')
      .populate('teacher', 'name email avatar');

    if (!assignment) return errorResponse(res, 'Assignment not found', 404);

    let submissions = [];
    let mySubmission = null;

    if (req.user.role === 'student') {
      mySubmission = await AssignmentSubmission.findOne({
        assignment: assignment._id,
        student: req.user._id,
      });
    } else {
      submissions = await AssignmentSubmission.find({ assignment: assignment._id })
        .populate('student', 'name email studentId avatar')
        .sort({ submittedAt: -1 });
    }

    return successResponse(res, { assignment, mySubmission, submissions });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new assignment
// @route   POST /api/lms/assignments
// @access  Private (Admin, Teacher)
exports.createAssignment = async (req, res, next) => {
  try {
    const { course, batch, title, instructions, maxMarks, deadline, attachments } = req.body;

    if (!course || !title || !deadline) {
      return errorResponse(res, 'Course, title, and deadline are required', 400);
    }

    const assignment = await Assignment.create({
      course,
      batch: batch || null,
      teacher: req.user._id,
      title,
      instructions: instructions || '',
      maxMarks: maxMarks ? Number(maxMarks) : 100,
      deadline: new Date(deadline),
      attachments: Array.isArray(attachments) ? attachments : [],
    });

    return successResponse(res, assignment, 'Assignment created successfully', 201);
  } catch (err) {
    next(err);
  }
};

// @desc    Submit assignment (Student)
// @route   POST /api/lms/assignments/:id/submit
// @access  Private (Student)
exports.submitAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return errorResponse(res, 'Assignment not found', 404);

    const { submissionText, files } = req.body;
    const now = new Date();
    const isLate = now > new Date(assignment.deadline);

    const submission = await AssignmentSubmission.findOneAndUpdate(
      { assignment: assignment._id, student: req.user._id },
      {
        $set: {
          submissionText: submissionText || '',
          files: Array.isArray(files) ? files : [],
          status: isLate ? 'Late Submission' : 'Submitted',
          submittedAt: now,
        },
      },
      { new: true, upsert: true }
    );

    return successResponse(res, submission, 'Assignment submitted successfully');
  } catch (err) {
    next(err);
  }
};

// @desc    Evaluate student submission (Teacher, Admin)
// @route   PUT /api/lms/assignments/submissions/:submissionId/evaluate
// @access  Private (Teacher, Admin)
exports.evaluateSubmission = async (req, res, next) => {
  try {
    const { marksObtained, feedback, status } = req.body;

    const submission = await AssignmentSubmission.findById(req.params.submissionId);
    if (!submission) return errorResponse(res, 'Submission not found', 404);

    submission.marksObtained = marksObtained !== undefined ? Number(marksObtained) : submission.marksObtained;
    submission.feedback = feedback !== undefined ? feedback : submission.feedback;
    submission.status = status || 'Evaluated';
    submission.evaluatedBy = req.user._id;
    submission.evaluatedAt = new Date();

    await submission.save();

    return successResponse(res, submission, 'Submission evaluated successfully');
  } catch (err) {
    next(err);
  }
};

// @desc    Delete assignment
// @route   DELETE /api/lms/assignments/:id
// @access  Private (Admin, Teacher)
exports.deleteAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return errorResponse(res, 'Assignment not found', 404);

    await AssignmentSubmission.deleteMany({ assignment: assignment._id });
    await Assignment.findByIdAndDelete(req.params.id);

    return successResponse(res, null, 'Assignment deleted successfully');
  } catch (err) {
    next(err);
  }
};
