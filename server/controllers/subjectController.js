const Subject = require('../models/Subject');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// @desc    Create a subject
// @route   POST /api/subjects
// @access  Private (admin)
exports.createSubject = async (req, res, next) => {
  try {
    const { name, code, course, description } = req.body;
    if (!name || !code || !course) {
      return errorResponse(res, 'Name, code, and course are required', 400);
    }

    const existing = await Subject.findOne({ code: code.toUpperCase() });
    if (existing) return errorResponse(res, `Subject code '${code}' already exists`, 400);

    const subject = await Subject.create({ name, code: code.toUpperCase(), course, description });
    return successResponse(res, subject, 'Subject created successfully', 201);
  } catch (err) {
    next(err);
  }
};

// @desc    Get all subjects with optional course filter
// @route   GET /api/subjects
// @access  Private
exports.getAllSubjects = async (req, res, next) => {
  try {
    const { course, isActive, search } = req.query;
    const filter = {};
    if (course) filter.course = course;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) filter.name = { $regex: search, $options: 'i' };

    const subjects = await Subject.find(filter)
      .populate('course', 'name code')
      .sort({ name: 1 });
    return successResponse(res, subjects);
  } catch (err) {
    next(err);
  }
};

// @desc    Get single subject
// @route   GET /api/subjects/:id
// @access  Private
exports.getSubjectById = async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id).populate('course', 'name code');
    if (!subject) return errorResponse(res, 'Subject not found', 404);
    return successResponse(res, subject);
  } catch (err) {
    next(err);
  }
};

// @desc    Update subject
// @route   PUT /api/subjects/:id
// @access  Private (admin)
exports.updateSubject = async (req, res, next) => {
  try {
    const { name, code, course, description, isActive } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (code !== undefined) updates.code = code.toUpperCase();
    if (course !== undefined) updates.course = course;
    if (description !== undefined) updates.description = description;
    if (isActive !== undefined) updates.isActive = isActive;

    const subject = await Subject.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).populate('course', 'name code');
    if (!subject) return errorResponse(res, 'Subject not found', 404);
    return successResponse(res, subject, 'Subject updated successfully');
  } catch (err) {
    next(err);
  }
};

// @desc    Delete subject
// @route   DELETE /api/subjects/:id
// @access  Private (admin)
exports.deleteSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) return errorResponse(res, 'Subject not found', 404);
    return successResponse(res, null, 'Subject deleted successfully');
  } catch (err) {
    next(err);
  }
};
