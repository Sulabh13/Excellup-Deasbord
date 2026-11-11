const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const TeacherProfile = require('../models/TeacherProfile');
const cloudinary = require('../config/cloudinary');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// @desc    Get all users (admin only) with pagination, search, role filter
// @route   GET /api/users
// @access  Private (admin)
exports.getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;
    const { search, role, isActive } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-password -resetPasswordToken -resetPasswordExpire')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return successResponse(res, {
      users,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single user by ID
// @route   GET /api/users/:id
// @access  Private (admin)
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select(
      '-password -resetPasswordToken -resetPasswordExpire'
    );
    if (!user) return errorResponse(res, 'User not found', 404);
    return successResponse(res, user);
  } catch (err) {
    next(err);
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (admin)
exports.updateUser = async (req, res, next) => {
  try {
    const allowedFields = ['name', 'email', 'role', 'isActive'];
    const updates = {};
    allowedFields.forEach((f) => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).select('-password -resetPasswordToken -resetPasswordExpire');

    if (!user) return errorResponse(res, 'User not found', 404);
    return successResponse(res, user, 'User updated successfully');
  } catch (err) {
    next(err);
  }
};

// @desc    Soft delete user (deactivate)
// @route   DELETE /api/users/:id
// @access  Private (admin)
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select('-password');

    if (!user) return errorResponse(res, 'User not found', 404);
    return successResponse(res, null, 'User deactivated successfully');
  } catch (err) {
    next(err);
  }
};

// @desc    Update user avatar
// @route   PUT /api/users/avatar
// @access  Private
exports.updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) return errorResponse(res, 'Please upload an image file', 400);

    const user = await User.findById(req.user._id);
    if (!user) return errorResponse(res, 'User not found', 404);

    // Delete old avatar from Cloudinary
    if (user.avatar) {
      try {
        const publicId = user.avatar.split('/').slice(-2).join('/').replace(/\.[^.]+$/, '');
        await cloudinary.uploader.destroy(publicId);
      } catch (_) {}
    }

    user.avatar = req.file.path || req.file.secure_url;
    await user.save();

    return successResponse(res, { avatar: user.avatar }, 'Avatar updated successfully');
  } catch (err) {
    next(err);
  }
};
