const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const {
  uploadMaterial, getMaterials, getMaterialById,
  updateMaterial, deleteMaterial,
} = require('../controllers/materialController');

router.use(protect);
router.route('/').get(getMaterials).post(authorize('admin', 'teacher'), upload.single('file'), uploadMaterial);
router.route('/:id').get(getMaterialById).put(authorize('admin', 'teacher'), updateMaterial).delete(authorize('admin', 'teacher'), deleteMaterial);

module.exports = router;

