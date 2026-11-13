const Question = require('../models/Question');
const MCQTest = require('../models/MCQTest');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// Helper to strip correct answer info from questions for students
const sanitizeForStudent = (question) => {
  const q = question.toObject ? question.toObject() : { ...question };
  if (q.options) {
    q.options = q.options.map((opt) => ({ text: opt.text }));
  }
  delete q.explanation;
  return q;
};

// @desc    Add a question to a test
// @route   POST /api/questions/test/:testId
// @access  Private (admin, teacher)
exports.addQuestion = async (req, res, next) => {
  try {
    const test = req.params.testId || req.body.testId || req.body.test;
    const { questionText, questionImage, options, explanation, marks, negativeMarks, order } = req.body;

    if (!test || !questionText || !options || options.length < 2) {
      return errorResponse(res, 'test, questionText, and at least 2 options are required', 400);
    }

    const testDoc = await MCQTest.findById(test);
    if (!testDoc) return errorResponse(res, 'Test not found', 404);

    if (req.user.role === 'teacher' && testDoc.createdBy.toString() !== req.user._id.toString()) {
      return errorResponse(res, 'Not authorized to add questions to this test', 403);
    }

    const question = await Question.create({
      test, questionText, questionImage: questionImage || null, options,
      explanation: explanation || null, marks: marks || 1,
      negativeMarks: negativeMarks || 0, order: order || 0,
    });

    // Update test totals
    const allQuestions = await Question.find({ test });
    testDoc.totalQuestions = allQuestions.length;
    testDoc.totalMarks = allQuestions.reduce((sum, q) => sum + (q.marks || 1), 0);
    await testDoc.save();

    return successResponse(res, question, 'Question added successfully', 201);
  } catch (err) {
    next(err);
  }
};

// @desc    Add multiple questions in bulk
// @route   POST /api/questions/bulk
// @access  Private (admin, teacher)
exports.addBulkQuestions = async (req, res, next) => {
  try {
    const { testId, questions } = req.body;
    if (!testId || !Array.isArray(questions) || questions.length === 0) {
      return errorResponse(res, 'testId and non-empty questions array are required', 400);
    }

    const testDoc = await MCQTest.findById(testId);
    if (!testDoc) return errorResponse(res, 'Test not found', 404);

    if (req.user.role === 'teacher' && testDoc.createdBy.toString() !== req.user._id.toString()) {
      return errorResponse(res, 'Not authorized', 403);
    }

    const questionsWithTest = questions.map((q, idx) => ({
      ...q,
      test: testId,
      order: q.order !== undefined ? q.order : idx,
    }));

    const created = await Question.insertMany(questionsWithTest);

    const allQuestions = await Question.find({ test: testId });
    testDoc.totalQuestions = allQuestions.length;
    testDoc.totalMarks = allQuestions.reduce((sum, q) => sum + (q.marks || 1), 0);
    await testDoc.save();

    return successResponse(res, { count: created.length }, `${created.length} questions added`, 201);
  } catch (err) {
    next(err);
  }
};

// @desc    Get questions for a test
// @route   GET /api/questions/test/:testId
// @access  Private (students get sanitized version without answers)
exports.getQuestions = async (req, res, next) => {
  try {
    const { testId } = req.params;
    const testDoc = await MCQTest.findById(testId);
    if (!testDoc) return errorResponse(res, 'Test not found', 404);

    let questions = await Question.find({ test: testId }).sort({ order: 1 });

    // Students never see correct answer info
    if (req.user.role === 'student') {
      questions = questions.map(sanitizeForStudent);
    }

    return successResponse(res, questions);
  } catch (err) {
    next(err);
  }
};

// @desc    Update a question
// @route   PUT /api/questions/:id
// @access  Private (admin, teacher)
exports.updateQuestion = async (req, res, next) => {
  try {
    const { questionText, questionImage, options, explanation, marks, negativeMarks, order } = req.body;
    const updates = {};
    if (questionText !== undefined) updates.questionText = questionText;
    if (questionImage !== undefined) updates.questionImage = questionImage;
    if (options !== undefined) updates.options = options;
    if (explanation !== undefined) updates.explanation = explanation;
    if (marks !== undefined) updates.marks = marks;
    if (negativeMarks !== undefined) updates.negativeMarks = negativeMarks;
    if (order !== undefined) updates.order = order;

    const question = await Question.findByIdAndUpdate(req.params.id, updates, {
      new: true, runValidators: true,
    });
    if (!question) return errorResponse(res, 'Question not found', 404);

    // Recalculate test marks
    const testDoc = await MCQTest.findById(question.test);
    if (testDoc) {
      const allQuestions = await Question.find({ test: testDoc._id });
      testDoc.totalMarks = allQuestions.reduce((sum, q) => sum + (q.marks || 1), 0);
      await testDoc.save();
    }

    return successResponse(res, question, 'Question updated successfully');
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a question
// @route   DELETE /api/questions/:id
// @access  Private (admin, teacher)
exports.deleteQuestion = async (req, res, next) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);
    if (!question) return errorResponse(res, 'Question not found', 404);

    // Recalculate test totals
    const testDoc = await MCQTest.findById(question.test);
    if (testDoc) {
      const allQuestions = await Question.find({ test: testDoc._id });
      testDoc.totalQuestions = allQuestions.length;
      testDoc.totalMarks = allQuestions.reduce((sum, q) => sum + (q.marks || 1), 0);
      await testDoc.save();
    }

    return successResponse(res, null, 'Question deleted successfully');
  } catch (err) {
    next(err);
  }
};

// @desc    Import questions from CSV text
// @route   POST /api/questions/import-csv
// @access  Private (admin, teacher)
exports.importQuestionsCSV = async (req, res, next) => {
  try {
    const { testId, csvData } = req.body;
    if (!testId || !csvData) {
      return errorResponse(res, 'testId and csvData are required', 400);
    }

    const testDoc = await MCQTest.findById(testId);
    if (!testDoc) return errorResponse(res, 'Test not found', 404);

    // Expected CSV columns: questionText, option1, option2, option3, option4, correctOption(1-4), marks, explanation
    const lines = csvData.trim().split('\n');
    if (lines.length < 2) return errorResponse(res, 'CSV must have a header row and at least one data row', 400);

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    const questions = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
      const row = {};
      headers.forEach((h, idx) => { row[h] = values[idx] || ''; });

      if (!row.questionText || !row.option1 || !row.option2 || !row.correctOption) {
        errors.push({ line: i + 1, reason: 'Missing required fields' });
        continue;
      }

      const correctIdx = parseInt(row.correctOption, 10) - 1;
      const opts = ['option1', 'option2', 'option3', 'option4']
        .map((key, idx) => ({ text: row[key] || '', isCorrect: idx === correctIdx }))
        .filter((o) => o.text.length > 0);

      if (opts.length < 2) {
        errors.push({ line: i + 1, reason: 'Need at least 2 options' });
        continue;
      }

      questions.push({
        test: testId,
        questionText: row.questionText,
        options: opts,
        marks: parseInt(row.marks, 10) || 1,
        explanation: row.explanation || null,
        order: i,
      });
    }

    if (questions.length > 0) {
      await Question.insertMany(questions);
      const allQuestions = await Question.find({ test: testId });
      testDoc.totalQuestions = allQuestions.length;
      testDoc.totalMarks = allQuestions.reduce((sum, q) => sum + (q.marks || 1), 0);
      await testDoc.save();
    }

    return successResponse(
      res,
      { imported: questions.length, errors },
      `${questions.length} questions imported${errors.length > 0 ? ` with ${errors.length} errors` : ''}`
    );
  } catch (err) {
    next(err);
  }
};
