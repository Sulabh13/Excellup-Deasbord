const StudentFee = require('../models/StudentFee');
const FeePayment = require('../models/FeePayment');
const FeeStructure = require('../models/FeeStructure');
const IncomeTransaction = require('../models/IncomeTransaction');
const Course = require('../models/Course');
const Batch = require('../models/Batch');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// Helper to generate unique receipt numbers: EXC-REC-2026-0001
const generateReceiptNumber = async () => {
  const year = new Date().getFullYear();
  const count = await FeePayment.countDocuments();
  const seq = String(count + 1).padStart(4, '0');
  return `EXC-REC-${year}-${seq}`;
};

// @desc    Get all course fee structures
// @route   GET /api/finance/fees/structures
// @access  Private (Admin)
exports.getFeeStructures = async (req, res, next) => {
  try {
    const structures = await FeeStructure.find({ isActive: true })
      .populate('course', 'name code fees duration')
      .sort({ createdAt: -1 });

    return successResponse(res, structures);
  } catch (err) {
    next(err);
  }
};

// @desc    Create or update course fee structure
// @route   POST /api/finance/fees/structures
// @access  Private (Admin)
exports.saveFeeStructure = async (req, res, next) => {
  try {
    const { courseId, totalFees, admissionFee, registrationFee, installmentOptions, discountPolicy, notes } = req.body;

    if (!courseId || totalFees === undefined) {
      return errorResponse(res, 'Course and totalFees are required', 400);
    }

    const courseDoc = await Course.findById(courseId);
    if (!courseDoc) return errorResponse(res, 'Course not found', 404);

    const structure = await FeeStructure.findOneAndUpdate(
      { course: courseId },
      {
        course: courseId,
        courseName: courseDoc.name,
        totalFees: Number(totalFees),
        admissionFee: Number(admissionFee || 0),
        registrationFee: Number(registrationFee || 0),
        installmentOptions: Number(installmentOptions || 1),
        discountPolicy: discountPolicy || '',
        notes: notes || '',
        isActive: true,
      },
      { new: true, upsert: true, runValidators: true }
    ).populate('course', 'name code fees');

    return successResponse(res, structure, 'Fee structure saved successfully');
  } catch (err) {
    next(err);
  }
};

// @desc    Get all student fees (Admin)
// @route   GET /api/finance/fees/students
// @access  Private (Admin)
exports.getAllStudentFees = async (req, res, next) => {
  try {
    const { course, batch, paymentStatus, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (course) filter.course = course;
    if (batch) filter.batch = batch;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    if (search && search.trim()) {
      const q = search.trim();
      const matchedUsers = await User.find({
        role: 'student',
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } },
          { studentId: { $regex: q, $options: 'i' } },
        ],
      }).select('_id');
      filter.student = { $in: matchedUsers.map((u) => u._id) };
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await StudentFee.countDocuments(filter);

    const studentFees = await StudentFee.find(filter)
      .populate('student', 'name email studentId avatar')
      .populate('course', 'name code fees')
      .populate('batch', 'name batchCode')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    return successResponse(res, {
      studentFees,
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

// @desc    Get single student fee profile with payment history
// @route   GET /api/finance/fees/student/:studentId
// @access  Private (Admin, Student)
exports.getStudentFeeById = async (req, res, next) => {
  try {
    const studentId = req.params.studentId;

    if (req.user.role === 'student' && req.user._id.toString() !== studentId) {
      return errorResponse(res, 'Not authorized', 403);
    }

    const feeRecord = await StudentFee.findOne({ student: studentId })
      .populate('student', 'name email studentId')
      .populate('course', 'name code')
      .populate('batch', 'name batchCode');

    const paymentHistory = await FeePayment.find({ student: studentId })
      .populate('collectedBy', 'name email')
      .sort({ paymentDate: -1 });

    return successResponse(res, { feeRecord, paymentHistory });
  } catch (err) {
    next(err);
  }
};

// @desc    Get logged in student fee record (My Fees)
// @route   GET /api/finance/fees/my-fees
// @access  Private (Student)
exports.getMyFees = async (req, res, next) => {
  try {
    const studentId = req.user._id;

    const feeRecord = await StudentFee.findOne({ student: studentId })
      .populate('course', 'name code')
      .populate('batch', 'name batchCode');

    const paymentHistory = await FeePayment.find({ student: studentId })
      .populate('collectedBy', 'name email')
      .sort({ paymentDate: -1 });

    return successResponse(res, { feeRecord, paymentHistory });
  } catch (err) {
    next(err);
  }
};

// @desc    Assign or update fee for student
// @route   POST /api/finance/fees/assign
// @access  Private (Admin)
exports.assignStudentFee = async (req, res, next) => {
  try {
    const { studentId, courseId, batchId, totalCourseFees, discount = 0, dueDate, installmentsCount = 1, remarks } = req.body;

    if (!studentId || !courseId || totalCourseFees === undefined) {
      return errorResponse(res, 'Student, course, and total fees are required', 400);
    }

    const total = Number(totalCourseFees);
    const disc = Number(discount || 0);
    const finalPayable = Math.max(0, total - disc);

    // Check if existing fee record exists
    let existing = await StudentFee.findOne({ student: studentId, course: courseId });
    const amountPaid = existing ? existing.amountPaid : 0;
    const remainingBalance = Math.max(0, finalPayable - amountPaid);

    let status = 'Pending';
    if (remainingBalance === 0) status = 'Paid';
    else if (amountPaid > 0) status = 'Partially Paid';
    else if (dueDate && new Date(dueDate) < new Date()) status = 'Overdue';

    // Generate installment schedule if requested
    const numInst = Math.max(1, Number(installmentsCount || 1));
    const instAmount = Math.round(finalPayable / numInst);
    const schedule = [];

    const baseDueDate = dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    for (let i = 1; i <= numInst; i++) {
      const instDueDate = new Date(baseDueDate);
      instDueDate.setMonth(instDueDate.getMonth() + (i - 1));

      // Calculate if this installment is already covered by existing amountPaid
      const coveredUpTo = amountPaid;
      const thisInstTarget = instAmount * i;
      const isPaid = coveredUpTo >= thisInstTarget;

      schedule.push({
        installmentNo: i,
        amount: i === numInst ? finalPayable - instAmount * (numInst - 1) : instAmount,
        dueDate: instDueDate,
        status: isPaid ? 'Paid' : instDueDate < new Date() ? 'Overdue' : 'Pending',
        paidDate: isPaid ? new Date() : null,
      });
    }

    const updated = await StudentFee.findOneAndUpdate(
      { student: studentId, course: courseId },
      {
        student: studentId,
        course: courseId,
        batch: batchId || null,
        totalCourseFees: total,
        discount: disc,
        finalPayable,
        amountPaid,
        remainingBalance,
        dueDate: baseDueDate,
        paymentStatus: status,
        installmentSchedule: schedule,
        remarks: remarks || '',
      },
      { new: true, upsert: true, runValidators: true }
    )
      .populate('student', 'name email studentId')
      .populate('course', 'name code')
      .populate('batch', 'name batchCode');

    return successResponse(res, updated, 'Student fee assigned successfully');
  } catch (err) {
    next(err);
  }
};

// @desc    Collect student fee payment
// @route   POST /api/finance/payments/collect
// @access  Private (Admin)
exports.collectPayment = async (req, res, next) => {
  try {
    const { studentId, courseId, amount, paymentMode, transactionId, installmentNo, notes, paymentDate } = req.body;

    if (!studentId || !amount || Number(amount) <= 0) {
      return errorResponse(res, 'Student and valid payment amount are required', 400);
    }

    const payAmount = Number(amount);

    // Find student fee record
    let studentFee = await StudentFee.findOne({ student: studentId });
    if (!studentFee && courseId) {
      studentFee = await StudentFee.findOne({ student: studentId, course: courseId });
    }
    if (!studentFee) {
      return errorResponse(res, 'Student fee record not found. Please assign fee first.', 404);
    }

    const previousPaid = studentFee.amountPaid || 0;
    const newPaid = previousPaid + payAmount;
    const newBalance = Math.max(0, studentFee.finalPayable - newPaid);

    let paymentStatus = 'Partially Paid';
    if (newBalance === 0) paymentStatus = 'Paid';

    // Update student fee record
    studentFee.amountPaid = newPaid;
    studentFee.remainingBalance = newBalance;
    studentFee.paymentStatus = paymentStatus;

    // Update installment schedule if applicable
    let cumulative = 0;
    studentFee.installmentSchedule.forEach((inst) => {
      cumulative += inst.amount;
      if (newPaid >= cumulative) {
        inst.status = 'Paid';
        if (!inst.paidDate) inst.paidDate = new Date();
      }
    });

    await studentFee.save();

    // Generate unique receipt number
    const receiptNumber = await generateReceiptNumber();

    // Create payment transaction record
    const payment = await FeePayment.create({
      receiptNumber,
      student: studentId,
      studentFee: studentFee._id,
      course: studentFee.course,
      batch: studentFee.batch,
      amountPaid: payAmount,
      previousPaid,
      remainingBalance: newBalance,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      paymentMode: paymentMode || 'Cash',
      transactionId: transactionId || '',
      installmentNo: installmentNo ? Number(installmentNo) : null,
      notes: notes || '',
      collectedBy: req.user._id,
    });

    // Auto-record into IncomeTransaction (avoids double counting)
    await IncomeTransaction.create({
      transactionId: receiptNumber,
      source: 'Student Course Fees',
      amount: payAmount,
      date: payment.paymentDate,
      paymentMode: payment.paymentMode,
      referenceId: payment._id,
      student: studentId,
      description: `Course fee payment from student. Receipt: ${receiptNumber}`,
      recordedBy: req.user._id,
    }).catch(() => {});

    const populatedPayment = await FeePayment.findById(payment._id)
      .populate('student', 'name email studentId')
      .populate('course', 'name code fees')
      .populate('batch', 'name batchCode')
      .populate('collectedBy', 'name email');

    return successResponse(
      res,
      { payment: populatedPayment, studentFee },
      'Payment recorded and receipt generated successfully',
      201
    );
  } catch (err) {
    next(err);
  }
};

// @desc    Get payment receipt details
// @route   GET /api/finance/payments/receipt/:receiptId
// @access  Protected
exports.getPaymentReceipt = async (req, res, next) => {
  try {
    const payment = await FeePayment.findById(req.params.receiptId)
      .populate('student', 'name email studentId')
      .populate('course', 'name code fees')
      .populate('batch', 'name batchCode')
      .populate('studentFee', 'totalCourseFees discount finalPayable')
      .populate('collectedBy', 'name email');

    if (!payment) return errorResponse(res, 'Payment receipt not found', 404);

    return successResponse(res, payment);
  } catch (err) {
    next(err);
  }
};

// @desc    Get pending fees list
// @route   GET /api/finance/fees/pending
// @access  Private (Admin)
exports.getPendingFees = async (req, res, next) => {
  try {
    const { course, batch, overdueOnly, search } = req.query;
    const filter = { remainingBalance: { $gt: 0 } };

    if (course) filter.course = course;
    if (batch) filter.batch = batch;

    if (overdueOnly === 'true') {
      filter.$or = [
        { paymentStatus: 'Overdue' },
        { dueDate: { $lt: new Date() } },
      ];
    }

    const pendingList = await StudentFee.find(filter)
      .populate('student', 'name email studentId')
      .populate('course', 'name code')
      .populate('batch', 'name batchCode')
      .sort({ remainingBalance: -1 });

    return successResponse(res, pendingList);
  } catch (err) {
    next(err);
  }
};
