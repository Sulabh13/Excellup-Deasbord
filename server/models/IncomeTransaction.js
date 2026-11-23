const mongoose = require('mongoose');

const IncomeTransactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    source: {
      type: String,
      enum: [
        'Student Course Fees',
        'Admission Fees',
        'Registration Fees',
        'Online Course Sales',
        'Other Income',
      ],
      required: true,
      default: 'Student Course Fees',
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [1, 'Amount must be greater than 0'],
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    paymentMode: {
      type: String,
      enum: ['Cash', 'UPI', 'Bank Transfer', 'Card', 'Other'],
      default: 'Cash',
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('IncomeTransaction', IncomeTransactionSchema);
