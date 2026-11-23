import api from './api'

export const lmsService = {
  // Stats & categories
  getStats: () => api.get('/lms/dashboard/stats'),
  getCategories: () => api.get('/lms/categories'),
  createCategory: (data) => api.post('/lms/categories', data),

  // Courses
  getAllCourses: (params) => api.get('/lms/courses', { params }),
  getMyLearning: () => api.get('/lms/courses/my-learning'),
  getCourseById: (id) => api.get(`/lms/courses/${id}`),
  createCourse: (data) => api.post('/lms/courses', data),
  updateCourse: (id, data) => api.put(`/lms/courses/${id}`, data),
  deleteCourse: (id) => api.delete(`/lms/courses/${id}`),
  enrollStudent: (id, studentId) => api.post(`/lms/courses/${id}/enroll`, { studentId }),

  // Modules
  createModule: (data) => api.post('/lms/modules', data),
  deleteModule: (id) => api.delete(`/lms/modules/${id}`),

  // Lectures
  createLecture: (data) => api.post('/lms/lectures', data),
  getLecturesByCourse: (courseId) => api.get(`/lms/lectures/course/${courseId}`),
  updateLecture: (id, data) => api.put(`/lms/lectures/${id}`, data),
  deleteLecture: (id) => api.delete(`/lms/lectures/${id}`),
  updateProgress: (id, data) => api.post(`/lms/lectures/${id}/progress`, data),
  getCourseProgress: (courseId) => api.get(`/lms/lectures/course/${courseId}/my-progress`),

  // Assignments
  getAllAssignments: (params) => api.get('/lms/assignments', { params }),
  getAssignmentById: (id) => api.get(`/lms/assignments/${id}`),
  createAssignment: (data) => api.post('/lms/assignments', data),
  submitAssignment: (id, data) => api.post(`/lms/assignments/${id}/submit`, data),
  evaluateSubmission: (submissionId, data) => api.put(`/lms/assignments/submissions/${submissionId}/evaluate`, data),
  deleteAssignment: (id) => api.delete(`/lms/assignments/${id}`),
}

export default lmsService
