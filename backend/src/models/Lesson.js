const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    section: { type: mongoose.Schema.Types.ObjectId, ref: "Section", required: true, index: true },
    title: { type: String, required: [true, "Lesson title is required"], trim: true, maxlength: 150 },
    videoUrl: { type: String, required: [true, "Video link is required"], trim: true },
    duration: { type: String, trim: true, default: "" },
    notes: { type: String, trim: true, default: "" },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Lesson", lessonSchema);