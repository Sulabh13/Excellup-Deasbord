import api from './api'

export const financeService = {
  // Dashboard & Reports
  getDashboardStats: () => api.get('/finance/reports/dashboard'),
  exportCSV: (type) => api.get(`/finance/reports/export/${type}`, { responseType: 'blob' }),

  // Fee Structures
  getFeeStructures: () => api.get('/finance/fees/structures'),
  saveFeeStructure: (data) => api.post('/finance/fees/structures', data),

  // Student Fees
  getAllStudentFees: (params) => api.get('/finance/fees/students', { params }),
  getStudentFeeById: (studentId) => api.get(`/finance/fees/student/${studentId}`),
  getMyFees: () => api.get('/finance/fees/my-fees'),
  assignStudentFee: (data) => api.post('/finance/fees/assign', data),
  getPendingFees: (params) => api.get('/finance/fees/pending', { params }),

  // Payments & Receipts
  collectPayment: (data) => api.post('/finance/payments/collect', data),
  getPaymentReceipt: (receiptId) => api.get(`/finance/payments/receipt/${receiptId}`),

  // Expenses
  getAllExpenses: (params) => api.get('/finance/expenses', { params }),
  getExpenseStats: () => api.get('/finance/expenses/stats'),
  getExpenseCategories: () => api.get('/finance/expenses/categories'),
  createExpense: (data) => api.post('/finance/expenses', data),
  updateExpense: (id, data) => api.put(`/finance/expenses/${id}`, data),
  deleteExpense: (id) => api.delete(`/finance/expenses/${id}`),

  // Income
  getAllIncome: (params) => api.get('/finance/income', { params }),
  createIncome: (data) => api.post('/finance/income', data),
}

export default financeService
