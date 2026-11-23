const mongoose = require('mongoose');

const ExpenseCategories = [
  'Rent',
  'Electricity Bill',
  'Internet Bill',
  'Teacher Salary',
  'Staff Salary',
  'Marketing & Advertising',
  'Software & Subscriptions',
  'Computer & Hardware',
  'Stationery',
  'Furniture',
  'Maintenance',
  'Travelling',
  'Refreshments',
  'Student Events',
  'Other Expenses',
];

const ExpenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Expense title is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Expense category is required'],
      enum: ExpenseCategories,
      default: 'Other Expenses',
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Expense amount is required'],
      min: [1, 'Amount must be greater than 0'],
    },
    expenseDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    paymentMode: {
      type: String,
      enum: ['Cash', 'UPI', 'Bank Transfer', 'Card', 'Cheque', 'Other'],
      default: 'Cash',
    },
    paidTo: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    attachmentUrl: {
      type: String,
      default: '',
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Expense', ExpenseSchema);
module.exports.ExpenseCategories = ExpenseCategories;
