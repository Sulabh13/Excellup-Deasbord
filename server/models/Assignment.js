const mongoose = require('mongoose');

const AssignmentSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OnlineCourse',
      required: [true, 'Course reference is required'],
      index: true,
    },
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      default: null,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Assignment title is required'],
      trim: true,
    },
    instructions: {
      type: String,
      trim: true,
      default: '',
    },
    maxMarks: {
      type: Number,
      default: 100,
      min: 0,
    },
    deadline: {
      type: Date,
      required: [true, 'Deadline date is required'],
    },
    attachments: [
      {
        fileName: String,
        fileUrl: String,
        fileType: String,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Assignment', AssignmentSchema);
