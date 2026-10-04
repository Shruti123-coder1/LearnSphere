const mongoose = require("mongoose");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const Review = require("../models/Review");
const asyncHandler = require("../utils/asyncHandler");

const fail = (res, status, message) => {
  res.status(status);
  throw new Error(message);
};

// Recalculates the average rating and review count stored on the course
const recalcRating = async (courseId) => {
  const stats = await Review.aggregate([
    { $match: { course: new mongoose.Types.ObjectId(String(courseId)) } },
    { $group: { _id: "$course", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  const rating = stats[0] ? Math.round(stats[0].avg * 10) / 10 : 0;
  const reviewCount = stats[0] ? stats[0].count : 0;
  await Course.updateOne({ _id: courseId }, { rating, reviewCount });
};

// GET /api/reviews/course/:courseId   (public)
const getCourseReviews = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  if (!mongoose.isValidObjectId(courseId)) fail(res, 404, "Course not found");

  const reviews = await Review.find({ course: courseId })
    .sort({ createdAt: -1 })
    .populate("student", "name");

  res.json({ reviews });
});

// POST /api/reviews/course/:courseId   body: { rating, comment }   (one review per student)
const addReview = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  if (!mongoose.isValidObjectId(courseId)) fail(res, 404, "Course not found");

  const rating = Number(req.body.rating);
  const comment = typeof req.body.comment === "string" ? req.body.comment.trim() : "";

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    fail(res, 400, "Rating must be between 1 and 5.");
  }
  if (comment.length < 3) fail(res, 400, "Please write a short review.");

  const course = await Course.findById(courseId);
  if (!course) fail(res, 404, "Course not found");

  const enrolled = await Enrollment.exists({ student: req.user._id, course: courseId });
  if (!enrolled) fail(res, 403, "Only enrolled students can review this course.");

  const review = await Review.findOneAndUpdate(
    { course: courseId, student: req.user._id },
    { $set: { rating, comment } },
    { upsert: true, new: true, runValidators: true }
  );
  await recalcRating(courseId);

  res.status(201).json({ review });
});

module.exports = { getCourseReviews, addReview };