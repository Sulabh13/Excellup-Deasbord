const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getAllSubjects, getSubjectById, createSubject, updateSubject, deleteSubject } = require('../controllers/subjectController');

router.use(protect);
router.route('/').get(getAllSubjects).post(authorize('admin'), createSubject);
router.route('/:id').get(getSubjectById).put(authorize('admin'), updateSubject).delete(authorize('admin'), deleteSubject);

module.exports = router;

