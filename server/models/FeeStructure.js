const mongoose = require('mongoose');

const FeeStructureSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course reference is required'],
      unique: true,
    },
    courseName: {
      type: String,
      trim: true,
      default: '',
    },
    totalFees: {
      type: Number,
      required: [true, 'Total fee amount is required'],
      min: 0,
    },
    admissionFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    registrationFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    installmentOptions: {
      type: Number,
      default: 1, // 1 = One-time, 2 = 2 Installments, 3 = 3 Installments, etc.
      min: 1,
      max: 12,
    },
    discountPolicy: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FeeStructure', FeeStructureSchema);
