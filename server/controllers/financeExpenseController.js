const Expense = require('../models/Expense');
const { ExpenseCategories } = require('../models/Expense');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// @desc    Get all expenses with filters and pagination
// @route   GET /api/finance/expenses
// @access  Private (Admin)
exports.getAllExpenses = async (req, res, next) => {
  try {
    const { category, paymentMode, startDate, endDate, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (paymentMode) filter.paymentMode = paymentMode;

    if (startDate || endDate) {
      filter.expenseDate = {};
      if (startDate) filter.expenseDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.expenseDate.$lte = end;
      }
    }

    if (search && search.trim()) {
      filter.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { paidTo: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await Expense.countDocuments(filter);

    const expenses = await Expense.find(filter)
      .populate('addedBy', 'name email')
      .sort({ expenseDate: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    return successResponse(res, {
      expenses,
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

// @desc    Get expense summary statistics
// @route   GET /api/finance/expenses/stats
// @access  Private (Admin)
exports.getExpenseStats = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const todayExpenses = await Expense.aggregate([
      { $match: { expenseDate: { $gte: startOfToday } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const monthExpenses = await Expense.aggregate([
      { $match: { expenseDate: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const yearExpenses = await Expense.aggregate([
      { $match: { expenseDate: { $gte: startOfYear } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const totalAllTime = await Expense.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    // Category breakdown
    const categoryBreakdown = await Expense.aggregate([
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]);

    const highestCategory = categoryBreakdown.length > 0 ? categoryBreakdown[0]._id : 'None';

    return successResponse(res, {
      today: todayExpenses[0]?.total || 0,
      thisMonth: monthExpenses[0]?.total || 0,
      thisYear: yearExpenses[0]?.total || 0,
      total: totalAllTime[0]?.total || 0,
      highestCategory,
      categoryBreakdown,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new expense
// @route   POST /api/finance/expenses
// @access  Private (Admin)
exports.createExpense = async (req, res, next) => {
  try {
    const { title, category, amount, expenseDate, paymentMode, paidTo, description, attachmentUrl } = req.body;

    if (!title || !category || !amount || Number(amount) <= 0) {
      return errorResponse(res, 'Title, category, and valid amount are required', 400);
    }

    const expense = await Expense.create({
      title,
      category,
      amount: Number(amount),
      expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
      paymentMode: paymentMode || 'Cash',
      paidTo: paidTo || '',
      description: description || '',
      attachmentUrl: attachmentUrl || '',
      addedBy: req.user._id,
    });

    const populated = await Expense.findById(expense._id).populate('addedBy', 'name email');
    return successResponse(res, populated, 'Expense recorded successfully', 201);
  } catch (err) {
    next(err);
  }
};

// @desc    Update expense
// @route   PUT /api/finance/expenses/:id
// @access  Private (Admin)
exports.updateExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return errorResponse(res, 'Expense not found', 404);

    const updated = await Expense.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('addedBy', 'name email');

    return successResponse(res, updated, 'Expense updated successfully');
  } catch (err) {
    next(err);
  }
};

// @desc    Delete expense
// @route   DELETE /api/finance/expenses/:id
// @access  Private (Admin)
exports.deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return errorResponse(res, 'Expense not found', 404);

    await Expense.findByIdAndDelete(req.params.id);
    return successResponse(res, null, 'Expense deleted successfully');
  } catch (err) {
    next(err);
  }
};

// @desc    Get expense categories
// @route   GET /api/finance/expenses/categories
// @access  Private (Admin)
exports.getCategories = async (req, res) => {
  return successResponse(res, ExpenseCategories);
};
