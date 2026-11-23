const VideoLecture = require('../models/VideoLecture');
const LectureProgress = require('../models/LectureProgress');
const OnlineCourse = require('../models/OnlineCourse');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// @desc    Create a new video lecture
// @route   POST /api/lms/lectures
// @access  Private (Admin, Teacher)
exports.createLecture = async (req, res, next) => {
  try {
    const { course, module, title, description, videoType, videoUrl, duration, order, resources } = req.body;

    if (!course || !title || !videoUrl) {
      return errorResponse(res, 'Course, title, and video URL are required', 400);
    }

    const courseDoc = await OnlineCourse.findById(course);
    if (!courseDoc) return errorResponse(res, 'Course not found', 404);

    if (req.user.role !== 'admin' && courseDoc.teacher.toString() !== req.user._id.toString()) {
      return errorResponse(res, 'Not authorized to add lectures to this course', 403);
    }

    const lecture = await VideoLecture.create({
      course,
      module: module || null,
      title,
      description: description || '',
      videoType: videoType || 'youtube',
      videoUrl,
      duration: duration || '15 mins',
      order: order !== undefined ? Number(order) : 0,
      resources: Array.isArray(resources) ? resources : [],
    });

    return successResponse(res, lecture, 'Lecture added successfully', 201);
  } catch (err) {
    next(err);
  }
};

// @desc    Get lectures by course
// @route   GET /api/lms/lectures/course/:courseId
// @access  Protected
exports.getLecturesByCourse = async (req, res, next) => {
  try {
    const lectures = await VideoLecture.find({ course: req.params.courseId })
      .populate('module', 'title order')
      .sort({ order: 1, createdAt: 1 });

    return successResponse(res, lectures);
  } catch (err) {
    next(err);
  }
};

// @desc    Update video lecture
// @route   PUT /api/lms/lectures/:id
// @access  Private (Admin, Teacher)
exports.updateLecture = async (req, res, next) => {
  try {
    const lecture = await VideoLecture.findById(req.params.id);
    if (!lecture) return errorResponse(res, 'Lecture not found', 404);

    const updated = await VideoLecture.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    return successResponse(res, updated, 'Lecture updated successfully');
  } catch (err) {
    next(err);
  }
};

// @desc    Delete video lecture
// @route   DELETE /api/lms/lectures/:id
// @access  Private (Admin, Teacher)
exports.deleteLecture = async (req, res, next) => {
  try {
    const lecture = await VideoLecture.findById(req.params.id);
    if (!lecture) return errorResponse(res, 'Lecture not found', 404);

    await LectureProgress.deleteMany({ lecture: lecture._id });
    await VideoLecture.findByIdAndDelete(req.params.id);

    return successResponse(res, null, 'Lecture deleted successfully');
  } catch (err) {
    next(err);
  }
};

// @desc    Update student lecture progress (resume timestamp and mark complete)
// @route   POST /api/lms/lectures/:id/progress
// @access  Private (Student)
exports.updateProgress = async (req, res, next) => {
  try {
    const lectureId = req.params.id;
    const studentId = req.user._id;
    const { lastWatchedTime, isCompleted } = req.body;

    const lecture = await VideoLecture.findById(lectureId);
    if (!lecture) return errorResponse(res, 'Lecture not found', 404);

    const updateData = {};
    if (lastWatchedTime !== undefined) updateData.lastWatchedTime = Number(lastWatchedTime);
    if (isCompleted !== undefined) {
      updateData.isCompleted = Boolean(isCompleted);
      if (isCompleted) updateData.completedAt = new Date();
    }

    const progress = await LectureProgress.findOneAndUpdate(
      { student: studentId, lecture: lectureId },
      {
        $set: updateData,
        $setOnInsert: { course: lecture.course },
      },
      { new: true, upsert: true }
    );

    return successResponse(res, progress, 'Progress updated');
  } catch (err) {
    next(err);
  }
};

// @desc    Get progress of a course for student
// @route   GET /api/lms/lectures/course/:courseId/my-progress
// @access  Private (Student)
exports.getCourseProgress = async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const progresses = await LectureProgress.find({
      student: studentId,
      course: req.params.courseId,
    });

    const totalLectures = await VideoLecture.countDocuments({ course: req.params.courseId });
    const completedCount = progresses.filter((p) => p.isCompleted).length;
    const progressPercent = totalLectures > 0 ? Math.round((completedCount / totalLectures) * 100) : 0;

    return successResponse(res, {
      progresses,
      totalLectures,
      completedCount,
      progressPercent,
    });
  } catch (err) {
    next(err);
  }
};
