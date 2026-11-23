const mongoose = require('mongoose');

const AssignmentSubmissionSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true,
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    submissionText: {
      type: String,
      trim: true,
      default: '',
    },
    files: [
      {
        fileName: String,
        fileUrl: String,
        fileType: String,
      },
    ],
    status: {
      type: String,
      enum: ['Pending', 'Submitted', 'Under Review', 'Evaluated', 'Late Submission'],
      default: 'Submitted',
    },
    marksObtained: {
      type: Number,
      default: null,
    },
    feedback: {
      type: String,
      default: '',
    },
    evaluatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    evaluatedAt: {
      type: Date,
      default: null,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

AssignmentSubmissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('AssignmentSubmission', AssignmentSubmissionSchema);
