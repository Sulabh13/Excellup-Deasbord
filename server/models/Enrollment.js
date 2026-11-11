const mongoose = require('mongoose');

const EnrollmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student reference is required'],
    },
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      required: [true, 'Batch reference is required'],
    },
    enrollmentDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'dropped'],
      default: 'active',
    },
    feePaid: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Prevent duplicate enrollments
EnrollmentSchema.index({ student: 1, batch: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', EnrollmentSchema);
