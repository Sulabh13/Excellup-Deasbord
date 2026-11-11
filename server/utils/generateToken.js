const jwt = require('jsonwebtoken');

/**
 * Generate a signed JWT token containing the user's id and role.
 * @param {string} id  - MongoDB user _id
 * @param {string} role - user role
 * @returns {string} signed JWT
 */
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

module.exports = generateToken;
