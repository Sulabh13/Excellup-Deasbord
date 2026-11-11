const User = require('../models/User');
const TeacherProfile = require('../models/TeacherProfile');
const Batch = require('../models/Batch');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// @desc    Create a new teacher
// @route   POST /api/teachers
// @access  Private (admin)
exports.createTeacher = async (req, res, next) => {
  try {
    const { name, email, password, phone, address, qualification, experience, subjects } =
      req.body;

    if (!name || !email || !password) {
      return errorResponse(res, 'Name, email and password are required', 400);
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return errorResponse(res, 'Email already in use', 400);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: 'teacher',
    });

    const profile = await TeacherProfile.create({
      user: user._id,
      phone: phone || null,
      address: address || null,
      qualification: qualification || null,
      experience: experience || 0,
      subjects: subjects || [],
    });

    return successResponse(
      res,
      { user: { _id: user._id, name, email: user.email, role: 'teacher' }, profile },
      'Teacher created successfully',
      201
    );
  } catch (err) {
    next(err);
  }
};

// @desc    Get all teachers
// @route   GET /api/teachers
// @access  Private (admin)
exports.getAllTeachers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;
    const { search, status } = req.query;

    const profileFilter = {};
    if (status) profileFilter.status = status;

    if (search) {
      const matched = await User.find({
        role: 'teacher',
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      }).select('_id');
      profileFilter.user = { $in: matched.map((u) => u._id) };
    }

    const total = await TeacherProfile.countDocuments(profileFilter);
    const profiles = await TeacherProfile.find(profileFilter)
      .populate('user', 'name email avatar isActive')
      .populate('subjects', 'name code')
      .populate('assignedBatches', 'name batchCode schedule')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return successResponse(res, {
      teachers: profiles,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single teacher by ID
// @route   GET /api/teachers/:id
// @access  Private (admin)
exports.getTeacherById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user || user.role !== 'teacher') {
      return errorResponse(res, 'Teacher not found', 404);
    }

    const profile = await TeacherProfile.findOne({ user: user._id })
      .populate('subjects', 'name code course')
      .populate('assignedBatches', 'name batchCode schedule course startDate endDate');

    return successResponse(res, { user, profile });
  } catch (err) {
    next(err);
  }
};

// @desc    Update teacher
// @route   PUT /api/teachers/:id
// @access  Private (admin)
exports.updateTeacher = async (req, res, next) => {
  try {
    const { name, email, phone, address, qualification, experience, subjects, status } = req.body;

    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'teacher') {
      return errorResponse(res, 'Teacher not found', 404);
    }

    if (name) user.name = name;
    if (email) user.email = email.toLowerCase();
    await user.save();

    const profile = await TeacherProfile.findOneAndUpdate(
      { user: user._id },
      { phone, address, qualification, experience, subjects, status },
      { new: true, runValidators: true }
    )
      .populate('subjects', 'name code')
      .populate('assignedBatches', 'name batchCode');

    return successResponse(res, { user, profile }, 'Teacher updated successfully');
  } catch (err) {
    next(err);
  }
};

// @desc    Delete teacher (soft delete)
// @route   DELETE /api/teachers/:id
// @access  Private (admin)
exports.deleteTeacher = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'teacher') {
      return errorResponse(res, 'Teacher not found', 404);
    }
    user.isActive = false;
    await user.save();
    await TeacherProfile.findOneAndUpdate({ user: user._id }, { status: 'inactive' });
    return successResponse(res, null, 'Teacher deactivated successfully');
  } catch (err) {
    next(err);
  }
};

// @desc    Get batches assigned to a teacher
// @route   GET /api/teachers/:id/batches
// @access  Private (admin, teacher)
exports.getTeacherBatches = async (req, res, next) => {
  try {
    const batches = await Batch.find({ teacher: req.params.id, isActive: true })
      .populate('course', 'name code')
      .populate('subject', 'name code')
      .sort({ createdAt: -1 });

    return successResponse(res, batches);
  } catch (err) {
    next(err);
  }
};

// @desc    Assign a batch to a teacher
// @route   POST /api/teachers/:id/assign-batch
// @access  Private (admin)
exports.assignBatchToTeacher = async (req, res, next) => {
  try {
    const { batchId } = req.body;
    if (!batchId) return errorResponse(res, 'batchId is required', 400);

    const batch = await Batch.findById(batchId);
    if (!batch) return errorResponse(res, 'Batch not found', 404);

    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'teacher') {
      return errorResponse(res, 'Teacher not found', 404);
    }

    // Set teacher on batch
    batch.teacher = user._id;
    await batch.save();

    // Add to teacher profile's assignedBatches
    const profile = await TeacherProfile.findOne({ user: user._id });
    if (profile) {
      if (!profile.assignedBatches.includes(batchId)) {
        profile.assignedBatches.push(batchId);
        await profile.save();
      }
    }

    return successResponse(res, batch, 'Batch assigned to teacher successfully');
  } catch (err) {
    next(err);
  }
};
