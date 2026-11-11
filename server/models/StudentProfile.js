const mongoose = require('mongoose');

const StudentProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    studentId: {
      type: String,
      unique: true,
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      default: null,
    },
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      default: null,
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    address: {
      type: String,
      trim: true,
      default: null,
    },
    guardianName: {
      type: String,
      trim: true,
      default: null,
    },
    guardianPhone: {
      type: String,
      trim: true,
      default: null,
    },
    enrollmentDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'graduated'],
      default: 'active',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StudentProfile', StudentProfileSchema);
