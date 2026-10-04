const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true, trim: true },
  options: {
    type: [{ type: String, trim: true }],
    validate: [(arr) => arr.length >= 2, "Each question needs at least 2 options"],
  },
  correctIndex: { type: Number, required: true, min: 0 },
});

const quizSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true, unique: true },
    title: { type: String, trim: true, default: "Quiz" },
    passingScore: { type: Number, min: 1, max: 100, default: 50 },
    questions: [questionSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Quiz", quizSchema);