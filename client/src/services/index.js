import api from './api'

export const authService = {
  login: (data) => {
    const payload = {
      password: data.password,
    }
    const val = (data.identifier || data.email || data.studentId || '').trim()
    if (val.includes('@')) {
      payload.email = val
    } else {
      payload.studentId = val
    }
    payload.identifier = val
    return api.post('/auth/login', payload)
  },
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.put(`/auth/reset-password/${token}`, { password }),
  changePassword: (data) => api.put('/auth/change-password', data),
}

export const studentService = {
  getAll: (params) => api.get('/students', { params }),
  getById: (id) => api.get(`/students/${id}`),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  delete: (id) => api.delete(`/students/${id}`),
  getAttendanceSummary: (id) => api.get(`/students/${id}/attendance-summary`),
  getTestHistory: (id) => api.get(`/students/${id}/test-history`),
}

export const teacherService = {
  getAll: (params) => api.get('/teachers', { params }),
  getById: (id) => api.get(`/teachers/${id}`),
  create: (data) => api.post('/teachers', data),
  update: (id, data) => api.put(`/teachers/${id}`, data),
  delete: (id) => api.delete(`/teachers/${id}`),
  getBatches: (id) => api.get(`/teachers/${id}/batches`),
}

export const courseService = {
  getAll: () => api.get('/courses'),
  getById: (id) => api.get(`/courses/${id}`),
  create: (data) => api.post('/courses', data),
  update: (id, data) => api.put(`/courses/${id}`, data),
  delete: (id) => api.delete(`/courses/${id}`),
}

export const subjectService = {
  getAll: (params) => api.get('/subjects', { params }),
  getById: (id) => api.get(`/subjects/${id}`),
  create: (data) => api.post('/subjects', data),
  update: (id, data) => api.put(`/subjects/${id}`, data),
  delete: (id) => api.delete(`/subjects/${id}`),
}

export const batchService = {
  getAll: (params) => api.get('/batches', { params }),
  getById: (id) => api.get(`/batches/${id}`),
  create: (data) => api.post('/batches', data),
  update: (id, data) => api.put(`/batches/${id}`, data),
  delete: (id) => api.delete(`/batches/${id}`),
  getStudents: (id) => api.get(`/batches/${id}/students`),
  enrollStudent: (batchId, studentId) => api.post(`/batches/${batchId}/enroll`, { studentId }),
  removeStudent: (batchId, studentId) => api.delete(`/batches/${batchId}/students/${studentId}`),
}

export const attendanceService = {
  mark: (data) => api.post('/attendance/mark', data),
  getByBatchDate: (batchId, date) => api.get('/attendance/batch', { params: { batchId, date } }),
  update: (id, data) => api.put(`/attendance/${id}`, data),
  getStudentAttendance: (params) => api.get('/attendance/student', { params }),
  getReport: (params) => api.get('/attendance/report', { params }),
  exportCSV: (params) => api.get('/attendance/export/csv', { params, responseType: 'blob' }),
}

export const materialService = {
  getAll: (params) => api.get('/materials', { params }),
  getById: (id) => api.get(`/materials/${id}`),
  upload: (formData) => api.post('/materials', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/materials/${id}`, data),
  delete: (id) => api.delete(`/materials/${id}`),
}

export const testService = {
  getAll: (params) => api.get('/tests', { params }),
  getById: (id) => api.get(`/tests/${id}`),
  create: (data) => api.post('/tests', data),
  update: (id, data) => api.put(`/tests/${id}`, data),
  delete: (id) => api.delete(`/tests/${id}`),
  publishResult: (id) => api.patch(`/tests/${id}/publish-result`),
  getStats: (id) => api.get(`/tests/${id}/stats`),
}

export const questionService = {
  add: (testId, data) => api.post(`/questions/test/${testId}`, data),
  addBulk: (testId, data) => api.post(`/questions/test/${testId}/bulk`, data),
  getByTest: (testId) => api.get(`/questions/test/${testId}`),
  update: (id, data) => api.put(`/questions/${id}`, data),
  delete: (id) => api.delete(`/questions/${id}`),
}

export const attemptService = {
  start: (testId) => api.post(`/test-attempts/start/${testId}`),
  saveAnswers: (attemptId, answers) => api.patch(`/test-attempts/${attemptId}/save`, { answers }),
  submit: (attemptId) => api.post(`/test-attempts/${attemptId}/submit`),
  getResult: (attemptId) => api.get(`/test-attempts/${attemptId}/result`),
  getMyAttempts: (params) => api.get('/test-attempts/my', { params }),
  getAllAttempts: (testId) => api.get(`/test-attempts/test/${testId}`),
}

export const announcementService = {
  getAll: (params) => api.get('/announcements', { params }),
  getById: (id) => api.get(`/announcements/${id}`),
  create: (data) => api.post('/announcements', data),
  update: (id, data) => api.put(`/announcements/${id}`, data),
  delete: (id) => api.delete(`/announcements/${id}`),
}

export const dashboardService = {
  getAdminDashboard: () => api.get('/dashboard/admin'),
  getTeacherDashboard: () => api.get('/dashboard/teacher'),
  getStudentDashboard: () => api.get('/dashboard/student'),
}

export const reportService = {
  getDailyAttendance: (params) => api.get('/reports/attendance/daily', { params }),
  getMonthlyAttendance: (params) => api.get('/reports/attendance/monthly', { params }),
  getStudentAttendance: (params) => api.get('/reports/attendance/student', { params }),
  getBatchAttendance: (params) => api.get('/reports/attendance/batch', { params }),
  getTestResults: (params) => api.get('/reports/test-results', { params }),
  exportAttendanceExcel: (params) => api.get('/reports/export/attendance-excel', { params, responseType: 'blob' }),
  exportResultsCSV: (params) => api.get('/reports/export/results-csv', { params, responseType: 'blob' }),
}

export { lmsService } from './lmsService'
export { financeService } from './financeService'

