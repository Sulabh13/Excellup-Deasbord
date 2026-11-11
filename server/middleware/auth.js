const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { errorResponse } = require('../utils/apiResponse');

/**
 * protect — verifies JWT and attaches req.user
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return errorResponse(res, 'Not authorized, no token provided', 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return errorResponse(res, 'User belonging to this token no longer exists', 401);
    }

    if (!user.isActive) {
      return errorResponse(res, 'Your account has been deactivated. Contact admin.', 401);
    }

    req.user = user;
    next();
  } catch (err) {
    return errorResponse(res, 'Not authorized, invalid token', 401);
  }
};

/**
 * authorize — restricts access to specified roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return errorResponse(
        res,
        `Role '${req.user ? req.user.role : 'unknown'}' is not authorized to access this route`,
        403
      );
    }
    next();
  };
};

module.exports = { protect, authorize };
