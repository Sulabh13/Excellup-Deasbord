const mongoose = require('mongoose');

const InstallmentItemSchema = new mongoose.Schema({
  installmentNo: {
    type: Number,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['Paid', 'Pending', 'Overdue'],
    default: 'Pending',
  },
  paidDate: {
    type: Date,
    default: null,
  },
  paymentRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeePayment',
    default: null,
  },
});

const StudentFeeSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    studentProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudentProfile',
      default: null,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      default: null,
    },
    totalCourseFees: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    finalPayable: {
      type: Number,
      required: true,
      min: 0,
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    remainingBalance: {
      type: Number,
      required: true,
      min: 0,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    paymentStatus: {
      type: String,
      enum: ['Paid', 'Partially Paid', 'Pending', 'Overdue', 'Discounted'],
      default: 'Pending',
    },
    installmentSchedule: [InstallmentItemSchema],
    remarks: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

StudentFeeSchema.index({ student: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('StudentFee', StudentFeeSchema);
