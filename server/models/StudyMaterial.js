const mongoose = require('mongoose');

const StudyMaterialSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [300, 'Title cannot exceed 300 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: null,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      default: null,
    },
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      default: null,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'uploadedBy is required'],
    },
    fileUrl: {
      type: String,
      default: null,
    },
    fileType: {
      type: String,
      default: null,
    },
    fileName: {
      type: String,
      default: null,
    },
    fileSize: {
      type: Number,
      default: null,
    },
    videoUrl: {
      type: String,
      default: null,
    },
    topic: {
      type: String,
      trim: true,
      default: null,
    },
    chapter: {
      type: String,
      trim: true,
      default: null,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StudyMaterial', StudyMaterialSchema);
