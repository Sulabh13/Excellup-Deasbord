const mongoose = require('mongoose');

const AnswerSchema = new mongoose.Schema(
  {
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    },
    selectedOption: {
      type: Number,
      default: null,
    },
    isCorrect: {
      type: Boolean,
      default: false,
    },
    marksAwarded: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const TestAttemptSchema = new mongoose.Schema(
  {
    test: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MCQTest',
      required: [true, 'Test reference is required'],
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student reference is required'],
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    submitTime: {
      type: Date,
      default: null,
    },
    answers: {
      type: [AnswerSchema],
      default: [],
    },
    totalMarks: {
      type: Number,
      default: 0,
    },
    obtainedMarks: {
      type: Number,
      default: 0,
    },
    percentage: {
      type: Number,
      default: 0,
    },
    isPassed: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['in-progress', 'submitted', 'auto-submitted'],
      default: 'in-progress',
    },
    attemptNumber: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TestAttempt', TestAttemptSchema);
