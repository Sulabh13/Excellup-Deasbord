const StudentFee = require('../models/StudentFee');
const FeePayment = require('../models/FeePayment');
const Expense = require('../models/Expense');
const IncomeTransaction = require('../models/IncomeTransaction');
const Course = require('../models/Course');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// @desc    Get real-time Finance Dashboard statistics & charts
// @route   GET /api/finance/reports/dashboard
// @access  Private (Admin)
exports.getFinanceDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // 1. Fee aggregation from StudentFee
    const feeTotals = await StudentFee.aggregate([
      {
        $group: {
          _id: null,
          totalExpected: { $sum: '$finalPayable' },
          totalCollectedFromFeeRecords: { $sum: '$amountPaid' },
          totalPending: { $sum: '$remainingBalance' },
        },
      },
    ]);

    const totalExpected = feeTotals[0]?.totalExpected || 0;
    const totalPending = feeTotals[0]?.totalPending || 0;

    // 2. Real-time cash collected from FeePayment records
    const allPayments = await FeePayment.aggregate([
      { $group: { _id: null, total: { $sum: '$amountPaid' } } },
    ]);
    const totalFeesCollected = allPayments[0]?.total || 0;

    // Today's collection
    const todayPayments = await FeePayment.aggregate([
      { $match: { paymentDate: { $gte: startOfToday } } },
      { $group: { _id: null, total: { $sum: '$amountPaid' } } },
    ]);
    const todayCollection = todayPayments[0]?.total || 0;

    // This month's collection
    const monthPayments = await FeePayment.aggregate([
      { $match: { paymentDate: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amountPaid' } } },
    ]);
    const monthCollection = monthPayments[0]?.total || 0;

    // 3. Expenses
    const allExpenses = await Expense.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalExpenses = allExpenses[0]?.total || 0;

    const monthExpenses = await Expense.aggregate([
      { $match: { expenseDate: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const monthExpenseTotal = monthExpenses[0]?.total || 0;

    // 4. Total Income (Actual collected fees + other income sources)
    const otherIncome = await IncomeTransaction.aggregate([
      { $match: { source: { $ne: 'Student Course Fees' } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalOtherIncome = otherIncome[0]?.total || 0;

    const netIncome = totalFeesCollected + totalOtherIncome;
    const netProfit = netIncome - totalExpenses;

    // 5. Monthly breakdown for past 6 months (for Recharts)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextD = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const monthLabel = d.toLocaleString('default', { month: 'short' });

      const mCollection = await FeePayment.aggregate([
        { $match: { paymentDate: { $gte: d, $lt: nextD } } },
        { $group: { _id: null, total: { $sum: '$amountPaid' } } },
      ]);

      const mExpense = await Expense.aggregate([
        { $match: { expenseDate: { $gte: d, $lt: nextD } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);

      const incomeVal = mCollection[0]?.total || 0;
      const expenseVal = mExpense[0]?.total || 0;

      monthlyTrend.push({
        month: monthLabel,
        income: incomeVal,
        expense: expenseVal,
        profit: incomeVal - expenseVal,
      });
    }

    // 6. Course-wise collection
    const courseWise = await StudentFee.aggregate([
      {
        $group: {
          _id: '$course',
          collected: { $sum: '$amountPaid' },
          pending: { $sum: '$remainingBalance' },
          studentsCount: { $sum: 1 },
        },
      },
    ]);

    const populatedCourseWise = await Promise.all(
      courseWise.map(async (cw) => {
        const c = await Course.findById(cw._id).select('name code');
        return {
          courseName: c?.name || 'Unknown',
          collected: cw.collected,
          pending: cw.pending,
          studentsCount: cw.studentsCount,
        };
      })
    );

    return successResponse(res, {
      cards: {
        totalFeesExpected: totalExpected,
        totalFeesCollected,
        totalPendingFees: totalPending,
        todayCollection,
        thisMonthCollection: monthCollection,
        totalExpenses,
        thisMonthExpense: monthExpenseTotal,
        netIncome,
        netProfit,
      },
      monthlyTrend,
      courseWise: populatedCourseWise,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Export financial reports to CSV
// @route   GET /api/finance/reports/export/:type
// @access  Private (Admin)
exports.exportReportCSV = async (req, res, next) => {
  try {
    const { type } = req.params;
    let csvData = '';

    if (type === 'student-fees') {
      const records = await StudentFee.find()
        .populate('student', 'name studentId email')
        .populate('course', 'name')
        .populate('batch', 'name');

      csvData = 'Student Name,Student ID,Email,Course,Batch,Total Fees,Discount,Final Payable,Paid Amount,Remaining Balance,Status\n';
      records.forEach((r) => {
        csvData += `"${r.student?.name || ''}","${r.student?.studentId || ''}","${r.student?.email || ''}","${r.course?.name || ''}","${r.batch?.name || ''}",${r.totalCourseFees},${r.discount},${r.finalPayable},${r.amountPaid},${r.remainingBalance},"${r.paymentStatus}"\n`;
      });
    } else if (type === 'payments') {
      const payments = await FeePayment.find()
        .populate('student', 'name studentId')
        .populate('course', 'name')
        .populate('collectedBy', 'name');

      csvData = 'Receipt No,Date,Student Name,Student ID,Course,Amount Paid,Payment Mode,Transaction ID,Collected By\n';
      payments.forEach((p) => {
        csvData += `"${p.receiptNumber}","${p.paymentDate ? p.paymentDate.toISOString().split('T')[0] : ''}","${p.student?.name || ''}","${p.student?.studentId || ''}","${p.course?.name || ''}",${p.amountPaid},"${p.paymentMode}","${p.transactionId || ''}","${p.collectedBy?.name || ''}"\n`;
      });
    } else if (type === 'expenses') {
      const expenses = await Expense.find().populate('addedBy', 'name');

      csvData = 'Date,Title,Category,Amount,Payment Mode,Paid To,Added By\n';
      expenses.forEach((e) => {
        csvData += `"${e.expenseDate ? e.expenseDate.toISOString().split('T')[0] : ''}","${e.title}","${e.category}",${e.amount},"${e.paymentMode}","${e.paidTo || ''}","${e.addedBy?.name || ''}"\n`;
      });
    } else {
      return errorResponse(res, 'Invalid report type', 400);
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=excellup-${type}-report.csv`);
    return res.status(200).send(csvData);
  } catch (err) {
    next(err);
  }
};
