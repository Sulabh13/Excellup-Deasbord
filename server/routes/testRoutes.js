const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createTest, getAllTests, getTestById, updateTest, deleteTest,
  publishResult, getTestStats,
} = require('../controllers/testController');

router.use(protect);
router.route('/').get(getAllTests).post(authorize('admin', 'teacher'), createTest);
router.route('/:id').get(getTestById).put(authorize('admin', 'teacher'), updateTest).delete(authorize('admin', 'teacher'), deleteTest);
router.patch('/:id/publish-result', authorize('admin', 'teacher'), publishResult);
router.get('/:id/stats', authorize('admin', 'teacher'), getTestStats);

module.exports = router;

