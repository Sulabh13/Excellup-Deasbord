const MCQTest = require('../models/MCQTest');
const Question = require('../models/Question');
const TestAttempt = require('../models/TestAttempt');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// @desc  Start a test attempt
// @route POST /api/test-attempts/start/:testId
// @access Student
exports.startAttempt = async (req, res) => {
  try {
    const test = await MCQTest.findById(req.params.testId);
    if (!test) return errorResponse(res, 'Test not found', 404);

    const now = new Date();
    if (now < new Date(test.startTime)) return errorResponse(res, 'Test has not started yet', 400);
    if (now > new Date(test.endTime)) return errorResponse(res, 'Test has ended', 400);
    if (test.status === 'draft') return errorResponse(res, 'Test is not published', 400);

    // Check for existing in-progress attempt
    const existing = await TestAttempt.findOne({
      test: test._id, student: req.user._id, status: 'in-progress',
    });
    if (existing) {
      // Resume: return questions without answers
      const questions = await Question.find({ test: test._id })
        .select('-options.isCorrect -explanation')
        .sort('order');
      return successResponse(res, { attempt: existing, questions, test }, 'Resuming attempt');
    }

    // Check multiple attempts
    if (!test.allowMultipleAttempts) {
      const submitted = await TestAttempt.findOne({
        test: test._id, student: req.user._id, status: { $in: ['submitted', 'auto-submitted'] },
      });
      if (submitted) return errorResponse(res, 'You have already attempted this test', 400);
    }

    const attemptCount = await TestAttempt.countDocuments({ test: test._id, student: req.user._id });

    const attempt = await TestAttempt.create({
      test: test._id,
      student: req.user._id,
      startTime: now,
      status: 'in-progress',
      attemptNumber: attemptCount + 1,
      answers: [],
    });

    let questionsQuery = Question.find({ test: test._id }).select('-options.isCorrect -explanation');
    if (test.shuffleQuestions) {
      const qs = await questionsQuery;
      qs.sort(() => Math.random() - 0.5);
      return successResponse(res, { attempt, questions: qs, test }, 'Test started');
    }

    const questions = await questionsQuery.sort('order');
    successResponse(res, { attempt, questions, test }, 'Test started');
  } catch (err) {
    errorResponse(res, err.message, 500);
  }
};

// @desc  Auto-save answers
// @route PATCH /api/test-attempts/:id/save
// @access Student
exports.saveAnswers = async (req, res) => {
  try {
    const attempt = await TestAttempt.findOne({ _id: req.params.id, student: req.user._id });
    if (!attempt) return errorResponse(res, 'Attempt not found', 404);
    if (attempt.status !== 'in-progress') return errorResponse(res, 'Attempt already submitted', 400);

    // Check time expiry
    const test = await MCQTest.findById(attempt.test);
    const deadline = new Date(Math.min(
      new Date(attempt.startTime).getTime() + test.duration * 60000,
      new Date(test.endTime).getTime()
    ));
    if (new Date() > deadline) {
      // Auto-submit
      return submitAttemptInternal(attempt, test, res, 'auto-submitted');
    }

    // Merge answers
    const { answers } = req.body;
    if (Array.isArray(answers)) {
      answers.forEach(({ question, selectedOption }) => {
        const idx = attempt.answers.findIndex(a => a.question?.toString() === question);
        if (idx > -1) attempt.answers[idx].selectedOption = selectedOption;
        else attempt.answers.push({ question, selectedOption });
      });
    }
    await attempt.save();
    successResponse(res, { saved: true }, 'Answers saved');
  } catch (err) {
    errorResponse(res, err.message, 500);
  }
};

// Internal submission logic
const submitAttemptInternal = async (attempt, test, res, status = 'submitted') => {
  const questions = await Question.find({ test: test._id });
  const questionMap = {};
  questions.forEach(q => { questionMap[q._id.toString()] = q; });

  let obtained = 0;
  attempt.answers = attempt.answers.map(ans => {
    const q = questionMap[ans.question?.toString()];
    if (!q) return ans;
    const correctOption = q.options.findIndex(o => o.isCorrect);
    const isCorrect = ans.selectedOption !== undefined && ans.selectedOption !== null && ans.selectedOption === correctOption;
    let marks = 0;
    if (isCorrect) marks = q.marks || 1;
    else if (ans.selectedOption !== undefined && ans.selectedOption !== null && test.negativeMarking) {
      marks = -(test.negativeMarkValue || 0);
    }
    obtained += marks;
    return { ...ans.toObject(), isCorrect, marksAwarded: marks };
  });

  const totalMarks = questions.reduce((s, q) => s + (q.marks || 1), 0);
  obtained = Math.max(0, obtained);
  const percentage = totalMarks > 0 ? (obtained / totalMarks) * 100 : 0;

  attempt.submitTime = new Date();
  attempt.status = status;
  attempt.totalMarks = totalMarks;
  attempt.obtainedMarks = obtained;
  attempt.percentage = Math.round(percentage * 100) / 100;
  attempt.isPassed = percentage >= (test.passingPercentage || 40);

  await attempt.save();
  return res.status(200).json({ success: true, message: 'Test submitted', data: { attempt } });
};

// @desc  Submit test
// @route POST /api/test-attempts/:id/submit
// @access Student
exports.submitAttempt = async (req, res) => {
  try {
    const attempt = await TestAttempt.findOne({ _id: req.params.id, student: req.user._id });
    if (!attempt) return errorResponse(res, 'Attempt not found', 404);
    if (attempt.status !== 'in-progress') return errorResponse(res, 'Already submitted', 400);
    const test = await MCQTest.findById(attempt.test);
    // Merge any final answers from body
    const { answers } = req.body;
    if (Array.isArray(answers)) {
      answers.forEach(({ question, selectedOption }) => {
        const idx = attempt.answers.findIndex(a => a.question?.toString() === question);
        if (idx > -1) attempt.answers[idx].selectedOption = selectedOption;
        else attempt.answers.push({ question, selectedOption });
      });
    }
    await submitAttemptInternal(attempt, test, res, 'submitted');
  } catch (err) {
    errorResponse(res, err.message, 500);
  }
};

// @desc  Get attempt result
// @route GET /api/test-attempts/:id/result
// @access Student (own), Admin/Teacher
exports.getAttemptResult = async (req, res) => {
  try {
    const attempt = await TestAttempt.findById(req.params.id).populate('test student', 'title duration passingPercentage isResultPublished name email studentId');
    if (!attempt) return errorResponse(res, 'Attempt not found', 404);

    // Students can only see their own
    if (req.user.role === 'student' && attempt.student._id.toString() !== req.user._id.toString()) {
      return errorResponse(res, 'Unauthorized', 403);
    }

    let questions = null;
    if (attempt.test.isResultPublished || ['admin', 'teacher'].includes(req.user.role)) {
      questions = await Question.find({ test: attempt.test._id });
    }

    successResponse(res, { attempt, questions }, 'Result fetched');
  } catch (err) {
    errorResponse(res, err.message, 500);
  }
};

// @desc  Get student's own attempts
// @route GET /api/test-attempts/my
// @access Student
exports.getMyAttempts = async (req, res) => {
  try {
    const attempts = await TestAttempt.find({ student: req.user._id })
      .populate('test', 'title subject batch totalMarks passingPercentage')
      .sort('-createdAt');
    successResponse(res, attempts, 'Attempts fetched');
  } catch (err) {
    errorResponse(res, err.message, 500);
  }
};

// @desc  Get all attempts for a test (admin/teacher)
// @route GET /api/test-attempts/test/:testId
// @access Admin, Teacher
exports.getAllAttempts = async (req, res) => {
  try {
    const attempts = await TestAttempt.find({ test: req.params.testId, status: { $ne: 'in-progress' } })
      .populate('student', 'name email studentId')
      .sort('-createdAt');
    successResponse(res, attempts, 'Attempts fetched');
  } catch (err) {
    errorResponse(res, err.message, 500);
  }
};

