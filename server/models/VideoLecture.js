const mongoose = require('mongoose');

const VideoLectureSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OnlineCourse',
      required: [true, 'Course reference is required'],
      index: true,
    },
    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CourseModule',
      default: null,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Lecture title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    videoType: {
      type: String,
      enum: ['youtube', 'external', 'upload'],
      default: 'youtube',
    },
    videoUrl: {
      type: String,
      required: [true, 'Video URL or upload path is required'],
    },
    duration: {
      type: String,
      default: '15 mins',
    },
    durationMinutes: {
      type: Number,
      default: 15,
    },
    thumbnail: {
      type: String,
      default: '',
    },
    order: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    resources: [
      {
        title: String,
        fileUrl: String,
        fileType: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('VideoLecture', VideoLectureSchema);
