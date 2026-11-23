const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

const {
  getAllCourses,
  getMyLearning,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollStudent,
  getLmsStats,
  createModule,
  deleteModule,
  getCategories,
  createCategory,
} = require('../controllers/lmsCourseController');

const {
  createLecture,
  getLecturesByCourse,
  updateLecture,
  deleteLecture,
  updateProgress,
  getCourseProgress,
} = require('../controllers/lmsLectureController');

const {
  getAllAssignments,
  getAssignmentById,
  createAssignment,
  submitAssignment,
  evaluateSubmission,
  deleteAssignment,
} = require('../controllers/lmsAssignmentController');

// All LMS routes protected
router.use(protect);

// Dashboard
router.get('/dashboard/stats', authorize('admin', 'teacher'), getLmsStats);

// Categories
router.get('/categories', getCategories);
router.post('/categories', authorize('admin'), createCategory);

// Courses
router.get('/courses', getAllCourses);
router.get('/courses/my-learning', authorize('student'), getMyLearning);
router.get('/courses/:id', getCourseById);
router.post('/courses', authorize('admin', 'teacher'), createCourse);
router.put('/courses/:id', authorize('admin', 'teacher'), updateCourse);
router.delete('/courses/:id', authorize('admin'), deleteCourse);
router.post('/courses/:id/enroll', authorize('admin', 'teacher', 'student'), enrollStudent);

// Modules
router.post('/modules', authorize('admin', 'teacher'), createModule);
router.delete('/modules/:id', authorize('admin', 'teacher'), deleteModule);

// Lectures
router.post('/lectures', authorize('admin', 'teacher'), createLecture);
router.get('/lectures/course/:courseId', getLecturesByCourse);
router.put('/lectures/:id', authorize('admin', 'teacher'), updateLecture);
router.delete('/lectures/:id', authorize('admin', 'teacher'), deleteLecture);
router.post('/lectures/:id/progress', authorize('student'), updateProgress);
router.get('/lectures/course/:courseId/my-progress', authorize('student'), getCourseProgress);

// Assignments
router.get('/assignments', getAllAssignments);
router.get('/assignments/:id', getAssignmentById);
router.post('/assignments', authorize('admin', 'teacher'), createAssignment);
router.post('/assignments/:id/submit', authorize('student'), submitAssignment);
router.put('/assignments/submissions/:submissionId/evaluate', authorize('admin', 'teacher'), evaluateSubmission);
router.delete('/assignments/:id', authorize('admin', 'teacher'), deleteAssignment);

module.exports = router;
