const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  addQuestion, addBulkQuestions, getQuestions,
  updateQuestion, deleteQuestion, importQuestionsCSV,
} = require('../controllers/questionController');

router.use(protect);
router.route('/test/:testId').get(getQuestions).post(authorize('admin', 'teacher'), addQuestion);
router.post('/test/:testId/bulk', authorize('admin', 'teacher'), addBulkQuestions);
router.post('/import-csv', authorize('admin', 'teacher'), importQuestionsCSV);
router.route('/:id').put(authorize('admin', 'teacher'), updateQuestion).delete(authorize('admin', 'teacher'), deleteQuestion);

module.exports = router;

