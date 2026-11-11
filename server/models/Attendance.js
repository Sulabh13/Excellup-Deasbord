const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema(
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
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late'],
      required: [true, 'Status is required'],
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'markedBy reference is required'],
    },
    remark: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { timestamps: true }
);

// Compound unique index — one record per student per batch per date
AttendanceSchema.index({ student: 1, batch: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);
