const mongoose = require('mongoose');

const TeacherProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    address: {
      type: String,
      trim: true,
      default: null,
    },
    subjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
      },
    ],
    assignedBatches: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Batch',
      },
    ],
    qualification: {
      type: String,
      trim: true,
      default: null,
    },
    experience: {
      type: Number,
      default: 0,
      min: 0,
    },
    joiningDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TeacherProfile', TeacherProfileSchema);
