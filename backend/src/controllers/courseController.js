const mongoose = require("mongoose");
const Course = require("../models/Course");
const Section = require("../models/Section");
const Lesson = require("../models/Lesson");
const Category = require("../models/Category");
const Enrollment = require("../models/Enrollment");
const Progress = require("../models/Progress");
const Quiz = require("../models/Quiz");
const QuizResult = require("../models/QuizResult");
const Review = require("../models/Review");
const Wishlist = require("../models/Wishlist");
const Payment = require("../models/Payment");
const asyncHandler = require("../utils/asyncHandler");

const LEVELS = ["Beginner", "Intermediate", "Advanced"];

const str = (v) => (typeof v === "string" ? v.trim() : "");
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const fail = (res, status, message) => {
  res.status(status);
  throw new Error(message);
};

const idOf = (v) => String((v && v._id) || v);

const checkId = (res, id, message = "Resource not found") => {
  if (!mongoose.isValidObjectId(id)) fail(res, 404, message);
};

// Keeps course.lessonCount in sync with the real number of lessons
const syncLessonCount = async (courseId) => {
  const count = await Lesson.countDocuments({ course: courseId });
  await Course.updateOne({ _id: courseId }, { lessonCount: count });
};

// Loads a course and makes sure the logged in instructor owns it
const loadOwnedCourse = async (req, res) => {
  checkId(res, req.params.id, "Course not found");
  const course = await Course.findById(req.params.id);
  if (!course) fail(res, 404, "Course not found");
  if (idOf(course.instructor) !== idOf(req.user._id)) {
    fail(res, 403, "You can only manage your own courses.");
  }
  return course;
};

// Validates the course form and returns clean values
const cleanCourseBody = (body, res) => {
  const title = str(body.title);
  const description = str(body.description);
  const category = str(body.category);
  const price = Number(body.price ?? 0);

  if (title.length < 5) fail(res, 400, "Title must be at least 5 characters.");
  if (description.length < 20) fail(res, 400, "Description must be at least 20 characters.");
  if (!category) fail(res, 400, "Please select a category.");
  if (Number.isNaN(price) || price < 0) fail(res, 400, "Enter a valid price (0 for free).");

  return {
    title,
    description,
    category,
    price,
    thumbnail: str(body.thumbnail),
    duration: str(body.duration),
    level: LEVELS.includes(body.level) ? body.level : "Beginner",
  };
};

// GET /api/categories  (public)
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  res.json({ categories });
});

// GET /api/courses  (public, approved courses only)
const getCourses = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 9, 1), 50);

  const filter = { status: "approved" };
  const category = str(req.query.category);
  const level = str(req.query.level);
  const q = str(req.query.q);

  if (category) filter.category = category;
  if (level) filter.level = level;
  if (q) {
    const rx = new RegExp(escapeRegex(q), "i");
    filter.$or = [{ title: rx }, { description: rx }, { category: rx }];
  }

  const [courses, total] = await Promise.all([
    Course.find(filter)
      .populate("instructor", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Course.countDocuments(filter),
  ]);

  res.json({ courses, total, page, pages: Math.max(Math.ceil(total / limit), 1) });
});

// GET /api/courses/instructor/mine
const getMyCourses = asyncHandler(async (req, res) => {
  const courses = await Course.find({ instructor: req.user._id }).sort({ createdAt: -1 });
  res.json({ courses });
});

// GET /api/courses/:id  (public for approved, owner/admin for the rest)
const getCourse = asyncHandler(async (req, res) => {
  checkId(res, req.params.id, "This course doesn't exist or is not published yet.");

  const course = await Course.findById(req.params.id).populate("instructor", "name email");
  if (!course) fail(res, 404, "This course doesn't exist or is not published yet.");

  const canManage =
    !!req.user &&
    (req.user.role === "admin" || idOf(course.instructor) === idOf(req.user._id));

  if (course.status !== "approved" && !canManage) {
    fail(res, 404, "This course doesn't exist or is not published yet.");
  }

  const sections = await Section.find({ course: course._id })
    .sort({ order: 1, createdAt: 1 })
    .lean();

  // Video links and notes are only for the owner/admin here. Students get them
  // from /api/enrollments/learn/:courseId after enrolling.
  const lessonQuery = Lesson.find({ course: course._id }).sort({ order: 1, createdAt: 1 });
  if (!canManage) lessonQuery.select("-videoUrl -notes");
  const lessons = await lessonQuery.lean();

  const bySection = new Map();
  lessons.forEach((l) => {
    const key = String(l.section);
    if (!bySection.has(key)) bySection.set(key, []);
    bySection.get(key).push(l);
  });

  const courseData = course.toObject();
  if (!canManage && courseData.instructor) delete courseData.instructor.email;

  res.json({
    course: courseData,
    sections: sections.map((s) => ({ ...s, lessons: bySection.get(String(s._id)) || [] })),
  });
});

// POST /api/courses
const createCourse = asyncHandler(async (req, res) => {
  const data = cleanCourseBody(req.body, res);
  const course = await Course.create({ ...data, instructor: req.user._id, status: "draft" });
  res.status(201).json({ course });
});

// PUT /api/courses/:id
const updateCourse = asyncHandler(async (req, res) => {
  const course = await loadOwnedCourse(req, res);
  const data = cleanCourseBody(req.body, res);
  Object.assign(course, data);
  await course.save();
  res.json({ course });
});

// DELETE /api/courses/:id
const deleteCourse = asyncHandler(async (req, res) => {
  const course = await loadOwnedCourse(req, res);

  const enrolled = await Enrollment.countDocuments({ course: course._id });
  if (enrolled > 0) {
    fail(res, 400, "This course has enrolled students and cannot be deleted.");
  }

  await Promise.all([
    Lesson.deleteMany({ course: course._id }),
    Section.deleteMany({ course: course._id }),
    Quiz.deleteMany({ course: course._id }),
    QuizResult.deleteMany({ course: course._id }),
    Review.deleteMany({ course: course._id }),
    Wishlist.deleteMany({ course: course._id }),
    Progress.deleteMany({ course: course._id }),
    Payment.deleteMany({ course: course._id, status: { $ne: "verified" } }),
  ]);
  await course.deleteOne();

  res.json({ message: "Course deleted." });
});

// POST /api/courses/:id/submit
const submitCourse = asyncHandler(async (req, res) => {
  const course = await loadOwnedCourse(req, res);

  if (!["draft", "rejected"].includes(course.status)) {
    fail(res, 400, "Only draft or rejected courses can be submitted for approval.");
  }

  const lessons = await Lesson.countDocuments({ course: course._id });
  if (lessons < 1) fail(res, 400, "Add at least one lesson before submitting for approval.");

  course.status = "pending";
  await course.save();

  res.json({ course, message: "Course submitted for admin approval." });
});

// POST /api/courses/:id/sections
const addSection = asyncHandler(async (req, res) => {
  const course = await loadOwnedCourse(req, res);
  const title = str(req.body.title);
  if (!title) fail(res, 400, "Section title is required.");

  const order = await Section.countDocuments({ course: course._id });
  const section = await Section.create({ course: course._id, title, order });

  res.status(201).json({ section });
});

// DELETE /api/courses/:id/sections/:sectionId
const deleteSection = asyncHandler(async (req, res) => {
  const course = await loadOwnedCourse(req, res);
  checkId(res, req.params.sectionId, "Section not found");

  const section = await Section.findOne({ _id: req.params.sectionId, course: course._id });
  if (!section) fail(res, 404, "Section not found");

  const lessons = await Lesson.find({ section: section._id }).select("_id");
  const lessonIds = lessons.map((l) => l._id);

  await Lesson.deleteMany({ section: section._id });
  await section.deleteOne();
  if (lessonIds.length) {
    await Progress.updateMany(
      { course: course._id },
      { $pull: { completedLessons: { $in: lessonIds } } }
    );
  }
  await syncLessonCount(course._id);

  res.json({ message: "Section deleted." });
});

// POST /api/courses/:id/sections/:sectionId/lessons
const addLesson = asyncHandler(async (req, res) => {
  const course = await loadOwnedCourse(req, res);
  checkId(res, req.params.sectionId, "Section not found");

  const section = await Section.findOne({ _id: req.params.sectionId, course: course._id });
  if (!section) fail(res, 404, "Section not found");

  const title = str(req.body.title);
  const videoUrl = str(req.body.videoUrl);
  if (!title) fail(res, 400, "Lesson title is required.");
  if (!/^https?:\/\//i.test(videoUrl)) {
    fail(res, 400, "Enter a valid video link starting with http(s)://");
  }

  const order = await Lesson.countDocuments({ section: section._id });
  const lesson = await Lesson.create({
    course: course._id,
    section: section._id,
    title,
    videoUrl,
    duration: str(req.body.duration),
    notes: str(req.body.notes),
    order,
  });
  await syncLessonCount(course._id);

  res.status(201).json({ lesson });
});

// DELETE /api/courses/:id/sections/:sectionId/lessons/:lessonId
const deleteLesson = asyncHandler(async (req, res) => {
  const course = await loadOwnedCourse(req, res);
  checkId(res, req.params.lessonId, "Lesson not found");

  const lesson = await Lesson.findOne({
    _id: req.params.lessonId,
    course: course._id,
    section: req.params.sectionId,
  });
  if (!lesson) fail(res, 404, "Lesson not found");

  await lesson.deleteOne();
  await Progress.updateMany(
    { course: course._id },
    { $pull: { completedLessons: lesson._id } }
  );
  await syncLessonCount(course._id);

  res.json({ message: "Lesson deleted." });
});

module.exports = {
  getCategories,
  getCourses,
  getMyCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  submitCourse,
  addSection,
  deleteSection,
  addLesson,
  deleteLesson,
};