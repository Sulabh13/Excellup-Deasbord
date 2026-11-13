const crypto = require('crypto');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const TeacherProfile = require('../models/TeacherProfile');
const generateToken = require('../utils/generateToken');
const generateStudentId = require('../utils/generateStudentId');
const sendEmail = require('../utils/sendEmail');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const ActivityLog = require('../models/ActivityLog');

// Helper to log activity
const logActivity = async (userId, action, details, req) => {
  try {
    await ActivityLog.create({
      user: userId,
      action,
      details,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  } catch (_) {}
};

// Helper to send token in cookie
const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const token = generateToken(user._id, user.role);
  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  };

  const userObj = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    studentId: user.studentId,
    isActive: user.isActive,
  };

  return res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({ success: true, message, token, user: userObj });
};

// @desc    Register a new user (admin only)
// @route   POST /api/auth/register
// @access  Private (admin)
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, course, batch } = req.body;

    if (!name || !email || !password || !role) {
      return errorResponse(res, 'Name, email, password and role are required', 400);
    }

    if (!['admin', 'teacher', 'student'].includes(role)) {
      return errorResponse(res, 'Invalid role. Must be admin, teacher, or student', 400);
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return errorResponse(res, 'A user with this email already exists', 400);
    }

    const userData = { name, email: email.toLowerCase(), password, role };

    // For students, auto-generate studentId
    if (role === 'student') {
      const sid = await generateStudentId();
      userData.studentId = sid;
    }

    const user = await User.create(userData);

    // Create corresponding profile
    if (role === 'student') {
      await StudentProfile.create({
        user: user._id,
        studentId: user.studentId,
        course: course || null,
        batch: batch || null,
        phone: phone || null,
      });
    } else if (role === 'teacher') {
      await TeacherProfile.create({
        user: user._id,
        phone: phone || null,
      });
    }

    await logActivity(req.user._id, 'USER_REGISTERED', `Created ${role}: ${email}`, req);

    return successResponse(
      res,
      {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId || null,
      },
      `${role.charAt(0).toUpperCase() + role.slice(1)} registered successfully`,
      201
    );
  } catch (err) {
    next(err);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { identifier, email, studentId, password } = req.body;

    if (!password) {
      return errorResponse(res, 'Password is required', 400);
    }

    const loginId = (identifier || email || studentId || '').trim();

    if (!loginId) {
      return errorResponse(res, 'Email or Student ID is required', 400);
    }

    let query = {};
    if (loginId.includes('@')) {
      query.email = loginId.toLowerCase();
    } else {
      query.studentId = loginId;
    }

    const user = await User.findOne(query).select('+password');
    if (!user) {
      return errorResponse(res, 'Invalid credentials', 401);
    }

    if (!user.isActive) {
      return errorResponse(res, 'Your account has been deactivated. Contact admin.', 401);
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return errorResponse(res, 'Invalid credentials', 401);
    }

    await logActivity(user._id, 'USER_LOGIN', `Login by ${user.email}`, req);

    return sendTokenResponse(user, 200, res, 'Login successful');
  } catch (err) {
    next(err);
  }
};

// @desc    Logout user (clear cookie)
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  try {
    res.cookie('token', '', {
      expires: new Date(Date.now()),
      httpOnly: true,
    });
    return successResponse(res, null, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
};

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return errorResponse(res, 'User not found', 404);

    let profile = null;
    if (user.role === 'student') {
      profile = await StudentProfile.findOne({ user: user._id })
        .populate('course', 'name code')
        .populate('batch', 'name batchCode schedule');
    } else if (user.role === 'teacher') {
      profile = await TeacherProfile.findOne({ user: user._id })
        .populate('subjects', 'name code')
        .populate('assignedBatches', 'name batchCode schedule');
    }

    return successResponse(res, { user, profile }, 'User profile fetched');
  } catch (err) {
    next(err);
  }
};

// @desc    Forgot password — generate reset token and send email
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return errorResponse(res, 'Email is required', 400);

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal whether user exists
      return successResponse(
        res,
        null,
        'If that email exists, a reset link has been sent'
      );
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    const html = `
      <h2>Excellup - Password Reset</h2>
      <p>You requested a password reset. Click the link below:</p>
      <a href="${resetUrl}" style="padding:10px 20px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:5px;">
        Reset Password
      </a>
      <p>This link expires in 10 minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
    `;

    try {
      await sendEmail({ to: user.email, subject: 'Excellup — Password Reset Request', html });
      return successResponse(res, null, 'Reset link sent to your email');
    } catch (emailErr) {
      user.resetPasswordToken = null;
      user.resetPasswordExpire = null;
      await user.save({ validateBeforeSave: false });
      return errorResponse(res, 'Email could not be sent. Try again later.', 500);
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Reset password using token
// @route   PUT /api/auth/reset-password/:resetToken
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return errorResponse(res, 'Password must be at least 6 characters', 400);
    }

    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.resetToken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return errorResponse(res, 'Invalid or expired reset token', 400);
    }

    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;
    await user.save();

    await logActivity(user._id, 'PASSWORD_RESET', 'Password reset via email token', req);

    return sendTokenResponse(user, 200, res, 'Password reset successful');
  } catch (err) {
    next(err);
  }
};

// @desc    Change password (authenticated)
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return errorResponse(res, 'Current password and new password are required', 400);
    }

    if (newPassword.length < 6) {
      return errorResponse(res, 'New password must be at least 6 characters', 400);
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) return errorResponse(res, 'User not found', 404);

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return errorResponse(res, 'Current password is incorrect', 400);
    }

    user.password = newPassword;
    await user.save();

    await logActivity(user._id, 'PASSWORD_CHANGED', 'Password changed by user', req);

    return successResponse(res, null, 'Password changed successfully');
  } catch (err) {
    next(err);
  }
};
