const OnlineCourse = require('../models/OnlineCourse');
const CourseCategory = require('../models/CourseCategory');
const CourseModule = require('../models/CourseModule');
const VideoLecture = require('../models/VideoLecture');
const LectureProgress = require('../models/LectureProgress');
const Assignment = require('../models/Assignment');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// @desc    Get all online courses (filters: search, category, level, status)
// @route   GET /api/lms/courses
// @access  Public or Protected
exports.getAllCourses = async (req, res, next) => {
  try {
    const { search, category, level, status, teacher, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (req.user?.role === 'student') {
      filter.status = 'published';
    } else if (req.user?.role === 'teacher') {
      // Teachers see courses assigned to them, or published ones
      if (teacher === 'me') {
        filter.teacher = req.user._id;
      }
    } else if (status) {
      filter.status = status;
    }

    if (category) filter.category = category;
    if (level) filter.level = level;
    if (teacher && teacher !== 'me') filter.teacher = teacher;

    if (search && search.trim()) {
      filter.title = { $regex: search.trim(), $options: 'i' };
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await OnlineCourse.countDocuments(filter);

    const courses = await OnlineCourse.find(filter)
      .populate('teacher', 'name email avatar')
      .populate('category', 'name icon')
      .populate('assignedBatches', 'name batchCode')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    return successResponse(res, {
      courses,
      pagination: { total, page: parseInt(page, 10), limit: parseInt(limit, 10), pages: Math.ceil(total / limit) || 1 },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get enrolled courses for logged in student
// @route   GET /api/lms/courses/my-learning
// @access  Private (student)
exports.getMyLearning = async (req, res, next) => {
  try {
    const studentId = req.user._id;

    // Find all courses where student is in enrolledStudents OR assignedBatches matches student batch
    const courses = await OnlineCourse.find({
      status: 'published',
      enrolledStudents: studentId,
    })
      .populate('teacher', 'name email avatar')
      .populate('category', 'name icon');

    // For each course, calculate student's completion progress
    const enriched = await Promise.all(
      courses.map(async (course) => {
        const totalLectures = await VideoLecture.countDocuments({ course: course._id, isPublished: true });
        const completedLectures = await LectureProgress.countDocuments({
          student: studentId,
          course: course._id,
          isCompleted: true,
        });

        const progressPercent = totalLectures > 0 ? Math.round((completedLectures / totalLectures) * 100) : 0;

        // Find last watched lecture
        const lastProgress = await LectureProgress.findOne({ student: studentId, course: course._id })
          .sort({ updatedAt: -1 })
          .populate('lecture', 'title duration videoUrl thumbnail');

        return {
          ...course.toObject(),
          totalLectures,
          completedLectures,
          progressPercent,
          lastWatchedLecture: lastProgress?.lecture || null,
        };
      })
    );

    return successResponse(res, enriched);
  } catch (err) {
    next(err);
  }
};

// @desc    Get single online course with modules and lectures
// @route   GET /api/lms/courses/:id
// @access  Protected
exports.getCourseById = async (req, res, next) => {
  try {
    const course = await OnlineCourse.findById(req.params.id)
      .populate('teacher', 'name email avatar')
      .populate('category', 'name icon')
      .populate('assignedBatches', 'name batchCode')
      .populate('enrolledStudents', 'name email studentId');

    if (!course) return errorResponse(res, 'Course not found', 404);

    const modules = await CourseModule.find({ course: course._id }).sort({ order: 1 });
    const lectures = await VideoLecture.find({ course: course._id }).sort({ order: 1 });
    const assignments = await Assignment.find({ course: course._id, isActive: true }).sort({ deadline: 1 });

    let isEnrolled = false;
    let completedLectureIds = [];

    if (req.user) {
      if (req.user.role === 'admin' || req.user._id.toString() === course.teacher?._id?.toString()) {
        isEnrolled = true;
      } else {
        isEnrolled = course.enrolledStudents.some((s) => (s._id || s).toString() === req.user._id.toString());
        // Also fetch lecture progress for student
        const progresses = await LectureProgress.find({
          student: req.user._id,
          course: course._id,
          isCompleted: true,
        }).select('lecture');
        completedLectureIds = progresses.map((p) => p.lecture.toString());
      }
    }

    return successResponse(res, {
      course,
      modules,
      lectures,
      assignments,
      isEnrolled,
      completedLectureIds,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create online course (Admin, Teacher)
// @route   POST /api/lms/courses
// @access  Private (Admin, Teacher)
exports.createCourse = async (req, res, next) => {
  try {
    const {
      title,
      description,
      thumbnail,
      category,
      categoryName,
      level,
      duration,
      price,
      courseType,
      status,
      startDate,
      endDate,
      assignedBatches,
      teacher,
    } = req.body;

    if (!title) return errorResponse(res, 'Course title is required', 400);

    const assignedTeacher = req.user.role === 'admin' && teacher ? teacher : req.user._id;

    const course = await OnlineCourse.create({
      title,
      description: description || '',
      thumbnail: thumbnail || '',
      category: category || null,
      categoryName: categoryName || 'Programming',
      level: level || 'Beginner',
      duration: duration || '10 hours',
      price: price ? Number(price) : 0,
      courseType: price && Number(price) > 0 ? 'Paid' : 'Free',
      status: status || 'published',
      startDate: startDate || null,
      endDate: endDate || null,
      assignedBatches: Array.isArray(assignedBatches) ? assignedBatches : [],
      teacher: assignedTeacher,
    });

    return successResponse(res, course, 'Course created successfully', 201);
  } catch (err) {
    next(err);
  }
};

// @desc    Update online course
// @route   PUT /api/lms/courses/:id
// @access  Private (Admin, Teacher)
exports.updateCourse = async (req, res, next) => {
  try {
    const course = await OnlineCourse.findById(req.params.id);
    if (!course) return errorResponse(res, 'Course not found', 404);

    if (req.user.role !== 'admin' && course.teacher.toString() !== req.user._id.toString()) {
      return errorResponse(res, 'Not authorized to edit this course', 403);
    }

    const updated = await OnlineCourse.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true })
      .populate('teacher', 'name email')
      .populate('category', 'name icon');

    return successResponse(res, updated, 'Course updated successfully');
  } catch (err) {
    next(err);
  }
};

// @desc    Delete online course
// @route   DELETE /api/lms/courses/:id
// @access  Private (Admin)
exports.deleteCourse = async (req, res, next) => {
  try {
    const course = await OnlineCourse.findById(req.params.id);
    if (!course) return errorResponse(res, 'Course not found', 404);

    await VideoLecture.deleteMany({ course: course._id });
    await CourseModule.deleteMany({ course: course._id });
    await Assignment.deleteMany({ course: course._id });
    await LectureProgress.deleteMany({ course: course._id });
    await OnlineCourse.findByIdAndDelete(req.params.id);

    return successResponse(res, null, 'Course and related content deleted successfully');
  } catch (err) {
    next(err);
  }
};

// @desc    Enroll student to online course
// @route   POST /api/lms/courses/:id/enroll
// @access  Private (Admin, Teacher, Student self-enroll if free)
exports.enrollStudent = async (req, res, next) => {
  try {
    const course = await OnlineCourse.findById(req.params.id);
    if (!course) return errorResponse(res, 'Course not found', 404);

    const studentId = req.body.studentId || (req.user.role === 'student' ? req.user._id : null);
    if (!studentId) return errorResponse(res, 'Student ID is required', 400);

    await OnlineCourse.findByIdAndUpdate(course._id, {
      $addToSet: { enrolledStudents: studentId },
    });

    return successResponse(res, null, 'Student enrolled successfully');
  } catch (err) {
    next(err);
  }
};

// @desc    LMS Dashboard Statistics (Admin)
// @route   GET /api/lms/dashboard/stats
// @access  Private (Admin, Teacher)
exports.getLmsStats = async (req, res, next) => {
  try {
    const totalCourses = await OnlineCourse.countDocuments();
    const activeCourses = await OnlineCourse.countDocuments({ status: 'published' });
    const totalLectures = await VideoLecture.countDocuments();
    const totalAssignments = await Assignment.countDocuments();

    // Sum unique enrolled students across all courses
    const courses = await OnlineCourse.find().select('enrolledStudents');
    const studentSet = new Set();
    courses.forEach((c) => {
      c.enrolledStudents.forEach((s) => studentSet.add(s.toString()));
    });
    const totalEnrolledStudents = studentSet.size;

    // Average course completion
    const allProgress = await LectureProgress.find();
    const totalCompleted = allProgress.filter((p) => p.isCompleted).length;
    const avgCompletion = allProgress.length > 0 ? Math.round((totalCompleted / allProgress.length) * 100) : 0;

    return successResponse(res, {
      totalCourses,
      activeCourses,
      totalLectures,
      totalAssignments,
      totalEnrolledStudents,
      avgCompletion,
    });
  } catch (err) {
    next(err);
  }
};

// MODULES
exports.createModule = async (req, res, next) => {
  try {
    const { courseId, title, description, order } = req.body;
    if (!courseId || !title) return errorResponse(res, 'courseId and title are required', 400);

    const moduleDoc = await CourseModule.create({
      course: courseId,
      title,
      description: description || '',
      order: order || 0,
    });
    return successResponse(res, moduleDoc, 'Module created successfully', 201);
  } catch (err) {
    next(err);
  }
};

exports.deleteModule = async (req, res, next) => {
  try {
    await CourseModule.findByIdAndDelete(req.params.id);
    await VideoLecture.updateMany({ module: req.params.id }, { $set: { module: null } });
    return successResponse(res, null, 'Module deleted successfully');
  } catch (err) {
    next(err);
  }
};

// CATEGORIES
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await CourseCategory.find({ isActive: true }).sort({ name: 1 });
    return successResponse(res, categories);
  } catch (err) {
    next(err);
  }
};

exports.createCategory = async (req, res, next) => {
  try {
    const { name, description, icon } = req.body;
    if (!name) return errorResponse(res, 'Category name is required', 400);

    const cat = await CourseCategory.create({ name, description, icon });
    return successResponse(res, cat, 'Category created', 201);
  } catch (err) {
    next(err);
  }
};
