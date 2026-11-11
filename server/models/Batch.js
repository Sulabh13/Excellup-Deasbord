const mongoose = require('mongoose');

const BatchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Batch name is required'],
      trim: true,
      maxlength: [200, 'Batch name cannot exceed 200 characters'],
    },
    batchCode: {
      type: String,
      required: [true, 'Batch code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course reference is required'],
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      default: null,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    schedule: {
      type: String,
      trim: true,
      default: null,
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    maxStudents: {
      type: Number,
      default: 50,
      min: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Batch', BatchSchema);
