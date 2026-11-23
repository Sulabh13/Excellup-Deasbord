const IncomeTransaction = require('../models/IncomeTransaction');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// @desc    Get all income transactions
// @route   GET /api/finance/income
// @access  Private (Admin)
exports.getAllIncome = async (req, res, next) => {
  try {
    const { source, paymentMode, startDate, endDate, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (source) filter.source = source;
    if (paymentMode) filter.paymentMode = paymentMode;

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await IncomeTransaction.countDocuments(filter);

    const transactions = await IncomeTransaction.find(filter)
      .populate('student', 'name email studentId')
      .populate('recordedBy', 'name email')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    return successResponse(res, {
      transactions,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Add manual income entry
// @route   POST /api/finance/income
// @access  Private (Admin)
exports.createIncome = async (req, res, next) => {
  try {
    const { source, amount, date, paymentMode, description, studentId } = req.body;

    if (!amount || Number(amount) <= 0) {
      return errorResponse(res, 'Valid income amount is required', 400);
    }

    const transactionId = `INC-${Date.now()}`;

    const income = await IncomeTransaction.create({
      transactionId,
      source: source || 'Other Income',
      amount: Number(amount),
      date: date ? new Date(date) : new Date(),
      paymentMode: paymentMode || 'Cash',
      description: description || '',
      student: studentId || null,
      recordedBy: req.user._id,
    });

    return successResponse(res, income, 'Income recorded successfully', 201);
  } catch (err) {
    next(err);
  }
};
