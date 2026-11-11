const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAllBatches, getBatchById, createBatch, updateBatch, deleteBatch,
  getBatchStudents, enrollStudentToBatch, removeStudentFromBatch,
} = require('../controllers/batchController');

router.use(protect);
router.route('/').get(getAllBatches).post(authorize('admin'), createBatch);
router.route('/:id').get(getBatchById).put(authorize('admin'), updateBatch).delete(authorize('admin'), deleteBatch);
router.get('/:id/students', getBatchStudents);
router.post('/:id/enroll', authorize('admin'), enrollStudentToBatch);
router.delete('/:id/students/:studentId', authorize('admin'), removeStudentFromBatch);

module.exports = router;

