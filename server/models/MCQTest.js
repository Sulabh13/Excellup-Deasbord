const mongoose = require('mongoose');

const MCQTestSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Test title is required'],
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
      required: [true, 'Batch reference is required'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'createdBy is required'],
    },
    totalQuestions: {
      type: Number,
      default: 0,
    },
    duration: {
      type: Number,
      required: [true, 'Duration in minutes is required'],
      min: 1,
    },
    totalMarks: {
      type: Number,
      default: 0,
    },
    passingPercentage: {
      type: Number,
      default: 40,
      min: 0,
      max: 100,
    },
    negativeMarking: {
      type: Boolean,
      default: false,
    },
    negativeMarkValue: {
      type: Number,
      default: 0,
    },
    startTime: {
      type: Date,
      default: null,
    },
    endTime: {
      type: Date,
      default: null,
    },
    instructions: {
      type: String,
      trim: true,
      default: null,
    },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'active', 'completed'],
      default: 'draft',
    },
    isResultPublished: {
      type: Boolean,
      default: false,
    },
    allowMultipleAttempts: {
      type: Boolean,
      default: false,
    },
    shuffleQuestions: {
      type: Boolean,
      default: false,
    },
    shuffleOptions: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MCQTest', MCQTestSchema);
