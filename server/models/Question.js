const mongoose = require('mongoose');

const OptionSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
    },
    isCorrect: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const QuestionSchema = new mongoose.Schema(
  {
    test: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MCQTest',
      required: [true, 'Test reference is required'],
    },
    questionText: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
    },
    questionImage: {
      type: String,
      default: null,
    },
    options: {
      type: [OptionSchema],
      validate: {
        validator: function (opts) {
          return opts && opts.length >= 2;
        },
        message: 'At least 2 options are required',
      },
    },
    explanation: {
      type: String,
      trim: true,
      default: null,
    },
    marks: {
      type: Number,
      default: 1,
      min: 0,
    },
    negativeMarks: {
      type: Number,
      default: 0,
      min: 0,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Question', QuestionSchema);
