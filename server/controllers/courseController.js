const Course = require('../models/Course');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// @desc    Create a course
// @route   POST /api/courses
// @access  Private (admin)
exports.createCourse = async (req, res, next) => {
  try {
    const { name, code, description, duration, fees } = req.body;
    if (!name || !code) return errorResponse(res, 'Name and code are required', 400);

    const existing = await Course.findOne({ code: code.toUpperCase() });
    if (existing) return errorResponse(res, `Course code '${code}' already exists`, 400);

    const course = await Course.create({ name, code: code.toUpperCase(), description, duration, fees });
    return successResponse(res, course, 'Course created successfully', 201);
  } catch (err) {
    next(err);
  }
};

// @desc    Get all courses
// @route   GET /api/courses
// @access  Private
exports.getAllCourses = async (req, res, next) => {
  try {
    const { isActive, search } = req.query;
    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) filter.name = { $regex: search, $options: 'i' };

    const courses = await Course.find(filter).sort({ name: 1 });
    return successResponse(res, courses);
  } catch (err) {
    next(err);
  }
};

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Private
exports.getCourseById = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return errorResponse(res, 'Course not found', 404);
    return successResponse(res, course);
  } catch (err) {
    next(err);
  }
};

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private (admin)
exports.updateCourse = async (req, res, next) => {
  try {
    const { name, code, description, duration, fees, isActive } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (code !== undefined) updates.code = code.toUpperCase();
    if (description !== undefined) updates.description = description;
    if (duration !== undefined) updates.duration = duration;
    if (fees !== undefined) updates.fees = fees;
    if (isActive !== undefined) updates.isActive = isActive;

    const course = await Course.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!course) return errorResponse(res, 'Course not found', 404);
    return successResponse(res, course, 'Course updated successfully');
  } catch (err) {
    next(err);
  }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private (admin)
exports.deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return errorResponse(res, 'Course not found', 404);
    return successResponse(res, null, 'Course deleted successfully');
  } catch (err) {
    next(err);
  }
};
