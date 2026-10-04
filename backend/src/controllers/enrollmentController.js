const crypto = require("crypto");
const mongoose = require("mongoose");
const Course = require("../models/Course");
const Section = require("../models/Section");
const Lesson = require("../models/Lesson");
const Enrollment = require("../models/Enrollment");
const Progress = require("../models/Progress");
const Payment = require("../models/Payment");
const Certificate = require("../models/Certificate");
const asyncHandler = require("../utils/asyncHandler");

const fail = (res, status, message) => {
  res.status(status);
  throw new Error(message);
};

const checkId = (res, id, message = "Resource not found") => {
  if (!mongoose.isValidObjectId(id)) fail(res, 404, message);
};

const percentOf = (done, total) =>
  total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;

const requireEnrollment = async (req, res, courseId) => {
  checkId(res, courseId, "Course not found");
  const enrolled = await Enrollment.exists({ student: req.user._id, course: courseId });
  if (!enrolled) fail(res, 403, "Please enroll in this course first.");
};

// POST /api/enrollments   (free courses only; paid ones are unlocked by payment verification)
const enroll = asyncHandler(async (req, res) => {
  const { courseId } = req.body;
  checkId(res, courseId, "Course not found");

  const course = await Course.findById(courseId);
  if (!course || course.status !== "approved") fail(res, 404, "This course is not available.");

  if (course.price > 0) {
    fail(res, 400, "This is a paid course. Please complete the payment to get access.");
  }

  const result = await Enrollment.updateOne(
    { student: req.user._id, course: course._id },
    { $setOnInsert: { enrolledAt: new Date() } },
    { upsert: true }
  );
  if (result.upsertedCount) {
    await Course.updateOne({ _id: course._id }, { $inc: { enrolledCount: 1 } });
  }

  res.status(201).json({ message: "Enrolled successfully." });
});

// GET /api/enrollments/my
const getMyEnrollments = asyncHandler(async (req, res) => {
  const enrollments = await Enrollment.find({ student: req.user._id })
    .sort({ createdAt: -1 })
    .populate({ path: "course", populate: { path: "instructor", select: "name" } });

  const progressList = await Progress.find({ student: req.user._id });
  const progressByCourse = new Map(progressList.map((p) => [String(p.course), p]));

  const list = enrollments
    .filter((e) => e.course)
    .map((e) => {
      const p = progressByCourse.get(String(e.course._id));
      const done = p ? p.completedLessons.length : 0;
      return {
        _id: e._id,
        course: e.course,
        enrolledAt: e.enrolledAt,
        completionPercent: percentOf(done, e.course.lessonCount),
      };
    });

  res.json({ enrollments: list });
});

// GET /api/enrollments/status/:courseId
const getEnrollmentStatus = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  checkId(res, courseId, "Course not found");

  const enrolled = !!(await Enrollment.exists({ student: req.user._id, course: courseId }));

  let completionPercent = 0;
  if (enrolled) {
    const [total, progress] = await Promise.all([
      Lesson.countDocuments({ course: courseId }),
      Progress.findOne({ student: req.user._id, course: courseId }),
    ]);
    completionPercent = percentOf(progress ? progress.completedLessons.length : 0, total);
  }

  const lastPayment = await Payment.findOne({ student: req.user._id, course: courseId }).sort({
    createdAt: -1,
  });

  res.json({
    enrolled,
    completionPercent,
    paymentStatus: lastPayment ? lastPayment.status : null,
  });
});

// GET /api/enrollments/learn/:courseId
const getLearningData = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  await requireEnrollment(req, res, courseId);

  const course = await Course.findById(courseId).populate("instructor", "name");
  if (!course) fail(res, 404, "Course not found");

  const [sections, lessons, progress] = await Promise.all([
    Section.find({ course: courseId }).sort({ order: 1, createdAt: 1 }).lean(),
    Lesson.find({ course: courseId }).sort({ order: 1, createdAt: 1 }).lean(),
    Progress.findOne({ student: req.user._id, course: courseId }),
  ]);

  const bySection = new Map();
  lessons.forEach((l) => {
    const key = String(l.section);
    if (!bySection.has(key)) bySection.set(key, []);
    bySection.get(key).push(l);
  });

  const completedLessons = progress ? progress.completedLessons : [];

  res.json({
    course,
    sections: sections.map((s) => ({ ...s, lessons: bySection.get(String(s._id)) || [] })),
    progress: {
      completedLessons,
      percent: percentOf(completedLessons.length, lessons.length),
    },
  });
});

// POST /api/enrollments/progress   body: { courseId, lessonId, completed }
const saveProgress = asyncHandler(async (req, res) => {
  const { courseId, lessonId, completed } = req.body;
  await requireEnrollment(req, res, courseId);
  checkId(res, lessonId, "Lesson not found");

  const lessonExists = await Lesson.exists({ _id: lessonId, course: courseId });
  if (!lessonExists) fail(res, 404, "Lesson not found");

  const update = completed
    ? { $addToSet: { completedLessons: lessonId } }
    : { $pull: { completedLessons: lessonId } };

  const progress = await Progress.findOneAndUpdate(
    { student: req.user._id, course: courseId },
    update,
    { upsert: true, new: true }
  );

  const total = await Lesson.countDocuments({ course: courseId });

  res.json({
    progress: {
      completedLessons: progress.completedLessons,
      percent: percentOf(progress.completedLessons.length, total),
    },
  });
});

// GET /api/enrollments/certificate/:courseId   (404 when not generated yet)
const getCertificate = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  await requireEnrollment(req, res, courseId);

  const certificate = await Certificate.findOne({ student: req.user._id, course: courseId });
  if (!certificate) fail(res, 404, "Certificate has not been generated yet.");

  res.json({ certificate });
});

// POST /api/enrollments/certificate/:courseId
const generateCertificate = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  await requireEnrollment(req, res, courseId);

  const existing = await Certificate.findOne({ student: req.user._id, course: courseId });
  if (existing) return res.json({ certificate: existing });

  const course = await Course.findById(courseId).populate("instructor", "name");
  if (!course) fail(res, 404, "Course not found");

  const [total, progress] = await Promise.all([
    Lesson.countDocuments({ course: courseId }),
    Progress.findOne({ student: req.user._id, course: courseId }),
  ]);
  const percent = percentOf(progress ? progress.completedLessons.length : 0, total);
  if (total === 0 || percent < 100) {
    fail(res, 400, "Complete all lessons to unlock your certificate.");
  }

  const certificate = await Certificate.create({
    student: req.user._id,
    course: course._id,
    certificateId: `LS-${crypto.randomBytes(5).toString("hex").toUpperCase()}`,
    studentName: req.user.name,
    courseTitle: course.title,
    instructorName: course.instructor?.name || "Instructor",
    issuedAt: new Date(),
  });

  res.status(201).json({ certificate });
});

module.exports = {
  enroll,
  getMyEnrollments,
  getEnrollmentStatus,
  getLearningData,
  saveProgress,
  getCertificate,
  generateCertificate,
};