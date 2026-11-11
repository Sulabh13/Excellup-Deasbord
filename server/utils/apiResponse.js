/**
 * Send a standardized success JSON response.
 * @param {import('express').Response} res
 * @param {*} data
 * @param {string} message
 * @param {number} statusCode
 */
const successResponse = (res, data = null, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Send a standardized error JSON response.
 * @param {import('express').Response} res
 * @param {string} message
 * @param {number} statusCode
 * @param {*} [error]
 */
const errorResponse = (res, message = 'Error', statusCode = 500, error = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(error && process.env.NODE_ENV === 'development' && { error }),
  });
};

module.exports = { successResponse, errorResponse };
