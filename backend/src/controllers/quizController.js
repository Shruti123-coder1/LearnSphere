const mongoose = require("mongoose");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const Quiz = require("../models/Quiz");
const QuizResult = require("../models/QuizResult");
const asyncHandler = require("../utils/asyncHandler");

const fail = (res, status, message) => {
  res.status(status);
  throw new Error(message);
};

const idOf = (v) => String((v && v._id) || v);

const checkId = (res, id, message = "Resource not found") => {
  if (!mongoose.isValidObjectId(id)) fail(res, 404, message);
};

// GET /api/quizzes/course/:courseId
// Students (enrolled) get the quiz without the answers. Owner/admin get everything.
const getQuiz = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  checkId(res, courseId, "Course not found");

  const course = await Course.findById(courseId);
  if (!course) fail(res, 404, "Course not found");

  const isManager =
    req.user.role === "admin" || idOf(course.instructor) === idOf(req.user._id);

  if (!isManager) {
    const enrolled = await Enrollment.exists({ student: req.user._id, course: courseId });
    if (!enrolled) fail(res, 403, "Enroll in this course to take its quiz.");
  }

  const quiz = await Quiz.findOne({ course: courseId });
  if (!quiz) return res.json({ quiz: null });

  const data = quiz.toObject();
  if (!isManager) {
    data.questions = data.questions.map((q) => ({
      _id: q._id,
      question: q.question,
      options: q.options,
    }));
  }

  res.json({ quiz: data });
});

// POST /api/quizzes/course/:courseId   (instructor who owns the course; replaces the old quiz)
const createQuiz = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  checkId(res, courseId, "Course not found");

  const course = await Course.findById(courseId);
  if (!course) fail(res, 404, "Course not found");
  if (idOf(course.instructor) !== idOf(req.user._id)) {
    fail(res, 403, "You can only manage your own courses.");
  }

  const title = typeof req.body.title === "string" && req.body.title.trim() ? req.body.title.trim() : "Quiz";
  const passingScore = Number(req.body.passingScore);
  const rawQuestions = Array.isArray(req.body.questions) ? req.body.questions : [];

  if (!Number.isFinite(passingScore) || passingScore < 1 || passingScore > 100) {
    fail(res, 400, "Passing score must be between 1 and 100.");
  }
  if (rawQuestions.length < 1) fail(res, 400, "Add at least one question.");

  const questions = rawQuestions.map((q, i) => {
    const question = typeof q.question === "string" ? q.question.trim() : "";
    const options = Array.isArray(q.options)
      ? q.options.map((o) => (typeof o === "string" ? o.trim() : ""))
      : [];
    const correctIndex = Number(q.correctIndex);

    if (!question) fail(res, 400, `Question ${i + 1}: enter the question text.`);
    if (options.length < 2 || options.some((o) => !o)) {
      fail(res, 400, `Question ${i + 1}: fill in all the options.`);
    }
    if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= options.length) {
      fail(res, 400, `Question ${i + 1}: choose the correct answer.`);
    }
    return { question, options, correctIndex };
  });

  const quiz = await Quiz.findOneAndUpdate(
    { course: courseId },
    { $set: { title, passingScore, questions } },
    { upsert: true, new: true, runValidators: true }
  );

  res.status(201).json({ quiz });
});

// POST /api/quizzes/:quizId/submit   body: { answers: [optionIndex, ...] }
const submitQuiz = asyncHandler(async (req, res) => {
  checkId(res, req.params.quizId, "Quiz not found");

  const quiz = await Quiz.findById(req.params.quizId);
  if (!quiz) fail(res, 404, "Quiz not found");

  const enrolled = await Enrollment.exists({ student: req.user._id, course: quiz.course });
  if (!enrolled) fail(res, 403, "Enroll in this course to take its quiz.");

  const { answers } = req.body;
  if (!Array.isArray(answers) || answers.length !== quiz.questions.length) {
    fail(res, 400, "Please answer every question before submitting.");
  }

  let score = 0;
  quiz.questions.forEach((q, i) => {
    const a = answers[i];
    if (!Number.isInteger(a) || a < 0 || a >= q.options.length) {
      fail(res, 400, "Please answer every question before submitting.");
    }
    if (a === q.correctIndex) score += 1;
  });

  const total = quiz.questions.length;
  const percentage = total ? Math.round((score / total) * 10000) / 100 : 0;
  const passed = percentage >= quiz.passingScore;

  const saved = await QuizResult.create({
    quiz: quiz._id,
    course: quiz.course,
    student: req.user._id,
    score,
    total,
    percentage,
    passed,
  });

  res.status(201).json({
    result: {
      _id: saved._id,
      score,
      total,
      percentage,
      passed,
      attemptedAt: saved.attemptedAt,
    },
  });
});

// GET /api/quizzes/course/:courseId/results   (the logged in user's own attempts)
const getQuizResults = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  checkId(res, courseId, "Course not found");

  const results = await QuizResult.find({ course: courseId, student: req.user._id }).sort({
    attemptedAt: -1,
  });

  res.json({ results });
});

module.exports = { getQuiz, createQuiz, submitQuiz, getQuizResults };