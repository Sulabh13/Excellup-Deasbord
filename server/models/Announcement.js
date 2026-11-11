const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [300, 'Title cannot exceed 300 characters'],
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'createdBy is required'],
    },
    targetRole: {
      type: String,
      enum: ['all', 'student', 'teacher'],
      default: 'all',
    },
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      default: null,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Announcement', AnnouncementSchema);
