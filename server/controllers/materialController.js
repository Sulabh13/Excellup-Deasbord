const StudyMaterial = require('../models/StudyMaterial');
const Enrollment = require('../models/Enrollment');
const cloudinary = require('../config/cloudinary');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// @desc    Upload study material
// @route   POST /api/materials
// @access  Private (admin, teacher)
exports.uploadMaterial = async (req, res, next) => {
  try {
    const { title, description, subject, subjectId, batch, batchId, videoUrl, topic, chapter, tags } = req.body;

    if (!title) return errorResponse(res, 'Title is required', 400);

    const targetBatch = batch || batchId || null;
    const targetSubject = subject || subjectId || null;

    const materialData = {
      title,
      description: description || null,
      subject: targetSubject,
      batch: targetBatch,
      uploadedBy: req.user._id,
      videoUrl: videoUrl || null,
      topic: topic || null,
      chapter: chapter || null,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim())) : [],
    };

    if (req.file) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      materialData.fileUrl = req.file.path.startsWith('http')
        ? req.file.path
        : `${baseUrl}/uploads/${req.file.filename}`;
      materialData.fileType = req.file.mimetype;
      materialData.fileName = req.file.originalname;
      materialData.fileSize = req.file.size;
    }

    if (!materialData.fileUrl && !materialData.videoUrl) {
      return errorResponse(res, 'Either a file or videoUrl must be provided', 400);
    }

    const material = await StudyMaterial.create(materialData);
    await material.populate([
      { path: 'subject', select: 'name code' },
      { path: 'batch', select: 'name batchCode' },
      { path: 'uploadedBy', select: 'name email' },
    ]);

    return successResponse(res, material, 'Material uploaded successfully', 201);
  } catch (err) {
    next(err);
  }
};

// @desc    Get study materials with filters
// @route   GET /api/materials
// @access  Private
exports.getMaterials = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;
    const { batch, subject, topic, search } = req.query;

    const filter = { isActive: true };
    if (batch) filter.batch = batch;
    if (subject) filter.subject = subject;
    if (topic) filter.topic = { $regex: topic, $options: 'i' };
    if (search) filter.title = { $regex: search, $options: 'i' };

    // Students can only see materials from their enrolled batches
    if (req.user.role === 'student') {
      if (!batch) {
        const enrollments = await Enrollment.find({ student: req.user._id, status: 'active' }).select('batch');
        const batchIds = enrollments.map((e) => e.batch);
        filter.batch = { $in: batchIds };
      } else {
        // Verify student is enrolled in requested batch
        const enrolled = await Enrollment.findOne({
          student: req.user._id,
          batch,
          status: 'active',
        });
        if (!enrolled) return errorResponse(res, 'You are not enrolled in this batch', 403);
      }
    }

    // Teacher sees only their uploaded materials or their batch materials
    if (req.user.role === 'teacher' && !batch) {
      filter.uploadedBy = req.user._id;
    }

    const total = await StudyMaterial.countDocuments(filter);
    const materials = await StudyMaterial.find(filter)
      .populate('subject', 'name code')
      .populate('batch', 'name batchCode')
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return successResponse(res, {
      materials,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single material
// @route   GET /api/materials/:id
// @access  Private
exports.getMaterialById = async (req, res, next) => {
  try {
    const material = await StudyMaterial.findById(req.params.id)
      .populate('subject', 'name code')
      .populate('batch', 'name batchCode')
      .populate('uploadedBy', 'name email');

    if (!material || !material.isActive) {
      return errorResponse(res, 'Material not found', 404);
    }

    // Students must be enrolled in the batch
    if (req.user.role === 'student' && material.batch) {
      const enrolled = await Enrollment.findOne({
        student: req.user._id,
        batch: material.batch._id,
        status: 'active',
      });
      if (!enrolled) return errorResponse(res, 'Not authorized to view this material', 403);
    }

    return successResponse(res, material);
  } catch (err) {
    next(err);
  }
};

// @desc    Update material metadata
// @route   PUT /api/materials/:id
// @access  Private (admin, teacher)
exports.updateMaterial = async (req, res, next) => {
  try {
    const { title, description, subject, batch, videoUrl, topic, chapter, tags, isActive } = req.body;
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (subject !== undefined) updates.subject = subject;
    if (batch !== undefined) updates.batch = batch;
    if (videoUrl !== undefined) updates.videoUrl = videoUrl;
    if (topic !== undefined) updates.topic = topic;
    if (chapter !== undefined) updates.chapter = chapter;
    if (tags !== undefined) updates.tags = Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim());
    if (isActive !== undefined) updates.isActive = isActive;

    const material = await StudyMaterial.findById(req.params.id);
    if (!material) return errorResponse(res, 'Material not found', 404);

    // Teachers can only update their own materials
    if (req.user.role === 'teacher' && material.uploadedBy.toString() !== req.user._id.toString()) {
      return errorResponse(res, 'Not authorized to update this material', 403);
    }

    const updated = await StudyMaterial.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    })
      .populate('subject', 'name code')
      .populate('batch', 'name batchCode')
      .populate('uploadedBy', 'name email');

    return successResponse(res, updated, 'Material updated successfully');
  } catch (err) {
    next(err);
  }
};

// @desc    Delete material and remove from Cloudinary
// @route   DELETE /api/materials/:id
// @access  Private (admin, teacher)
exports.deleteMaterial = async (req, res, next) => {
  try {
    const material = await StudyMaterial.findById(req.params.id);
    if (!material) return errorResponse(res, 'Material not found', 404);

    if (req.user.role === 'teacher' && material.uploadedBy.toString() !== req.user._id.toString()) {
      return errorResponse(res, 'Not authorized to delete this material', 403);
    }

    // Delete file from Cloudinary
    if (material.fileUrl) {
      try {
        const urlParts = material.fileUrl.split('/');
        const fileWithExt = urlParts.slice(-2).join('/');
        const publicId = fileWithExt.replace(/\.[^.]+$/, '');
        await cloudinary.uploader.destroy(publicId, { resource_type: 'auto' });
      } catch (_) {}
    }

    await StudyMaterial.findByIdAndDelete(req.params.id);
    return successResponse(res, null, 'Material deleted successfully');
  } catch (err) {
    next(err);
  }
};
