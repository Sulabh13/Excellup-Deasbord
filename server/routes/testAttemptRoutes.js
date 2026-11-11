const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  startAttempt, saveAnswers, submitAttempt,
  getAttemptResult, getMyAttempts, getAllAttempts,
} = require('../controllers/testAttemptController');

router.use(protect);
router.post('/start/:testId', authorize('student'), startAttempt);
router.patch('/:id/save', authorize('student'), saveAnswers);
router.post('/:id/submit', authorize('student'), submitAttempt);
router.get('/:id/result', getAttemptResult);
router.get('/my', authorize('student'), getMyAttempts);
router.get('/test/:testId', authorize('admin', 'teacher'), getAllAttempts);

module.exports = router;

