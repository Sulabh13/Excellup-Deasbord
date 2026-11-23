const mongoose = require('mongoose');

const LectureProgressSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OnlineCourse',
      required: true,
      index: true,
    },
    lecture: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VideoLecture',
      required: true,
      index: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    lastWatchedTime: {
      type: Number, // In seconds
      default: 0,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

LectureProgressSchema.index({ student: 1, lecture: 1 }, { unique: true });

module.exports = mongoose.model('LectureProgress', LectureProgressSchema);
