const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

const {
  getFeeStructures,
  saveFeeStructure,
  getAllStudentFees,
  getStudentFeeById,
  getMyFees,
  assignStudentFee,
  collectPayment,
  getPaymentReceipt,
  getPendingFees,
} = require('../controllers/financeFeeController');

const {
  getAllExpenses,
  getExpenseStats,
  createExpense,
  updateExpense,
  deleteExpense,
  getCategories,
} = require('../controllers/financeExpenseController');

const {
  getAllIncome,
  createIncome,
} = require('../controllers/financeIncomeController');

const {
  getFinanceDashboardStats,
  exportReportCSV,
} = require('../controllers/financeReportController');

// All Finance routes protected
router.use(protect);

// Student self-view route
router.get('/fees/my-fees', authorize('student'), getMyFees);
router.get('/payments/receipt/:receiptId', getPaymentReceipt);

// Admin-only finance routes
router.use(authorize('admin'));

// Fee Structures
router.get('/fees/structures', getFeeStructures);
router.post('/fees/structures', saveFeeStructure);

// Student Fees
router.get('/fees/students', getAllStudentFees);
router.get('/fees/student/:studentId', getStudentFeeById);
router.post('/fees/assign', assignStudentFee);
router.get('/fees/pending', getPendingFees);

// Payments
router.post('/payments/collect', collectPayment);

// Expenses
router.get('/expenses', getAllExpenses);
router.get('/expenses/stats', getExpenseStats);
router.get('/expenses/categories', getCategories);
router.post('/expenses', createExpense);
router.put('/expenses/:id', updateExpense);
router.delete('/expenses/:id', deleteExpense);

// Income
router.get('/income', getAllIncome);
router.post('/income', createIncome);

// Reports & Dashboard
router.get('/reports/dashboard', getFinanceDashboardStats);
router.get('/reports/export/:type', exportReportCSV);

module.exports = router;
