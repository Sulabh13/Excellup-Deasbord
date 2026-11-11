const StudentProfile = require('../models/StudentProfile');

/**
 * Auto-generate a unique student ID in the format EXC-YYYY-NNN.
 * Queries the last created StudentProfile and increments the numeric suffix.
 * @returns {Promise<string>} e.g. "EXC-2024-001"
 */
const generateStudentId = async () => {
  const year = new Date().getFullYear();
  const prefix = `EXC-${year}-`;

  // Find the last student created this year
  const lastProfile = await StudentProfile.findOne(
    { studentId: { $regex: `^${prefix}` } },
    { studentId: 1 },
    { sort: { studentId: -1 } }
  );

  let nextNumber = 1;
  if (lastProfile && lastProfile.studentId) {
    const parts = lastProfile.studentId.split('-');
    const lastNum = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastNum)) {
      nextNumber = lastNum + 1;
    }
  }

  const paddedNumber = String(nextNumber).padStart(3, '0');
  return `${prefix}${paddedNumber}`;
};

module.exports = generateStudentId;
