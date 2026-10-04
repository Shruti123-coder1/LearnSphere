import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, PlayCircle, Send, CheckCircle2, AlertCircle } from "lucide-react";
import Button from "../components/Button";
import Modal from "../components/Modal";
import Loading from "../components/Loading";
import {
  getCourse,
  getCategories,
  createCourse,
  updateCourse,
  submitCourse,
  addSection,
  deleteSection,
  addLesson,
  deleteLesson,
  getQuiz,
  createQuiz,
} from "../services/courseService";
import { getErrorMessage } from "../services/api";
import { CATEGORIES, LEVELS } from "../utils/constants";

const inputCls =
  "w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100";

const badge = {
  draft: "bg-stone-200 text-stone-700",
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
};

const emptyForm = {
  title: "",
  description: "",
  thumbnail: "",
  category: "",
  level: "Beginner",
  duration: "",
  price: 0,
};

const emptyQuestion = () => ({ question: "", options: ["", "", "", ""], correctIndex: 0 });

function Card({ title, subtitle, children }) {
  return (
    <section className="rounded-xl border border-stone-200 bg-white p-6">
      <h2 className="text-xl font-bold">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-stone-500">{subtitle}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default function CourseManager() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(emptyForm);
  const [course, setCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [categories, setCategories] = useState(CATEGORIES.slice(1));
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [imgFailed, setImgFailed] = useState(false);

  const [sectionTitle, setSectionTitle] = useState("");
  const [lessonModal, setLessonModal] = useState(null);
  const [lessonForm, setLessonForm] = useState({ title: "", videoUrl: "", duration: "", notes: "" });
  const [lessonError, setLessonError] = useState("");

  const [existingQuiz, setExistingQuiz] = useState(null);
  const [quiz, setQuiz] = useState({
    title: "Final quiz",
    passingScore: 50,
    questions: [emptyQuestion()],
  });

  useEffect(() => {
    getCategories()
      .then(({ categories: list }) => {
        if (list?.length) setCategories(list.map((c) => c.name));
      })
      .catch(() => {});
  }, []);

  const refresh = useCallback(
    async (resetForm = false) => {
      const d = await getCourse(id);
      setCourse(d.course);
      setSections(d.sections || []);
      if (resetForm) {
        setForm({
          title: d.course.title || "",
          description: d.course.description || "",
          thumbnail: d.course.thumbnail || "",
          category: d.course.category || "",
          level: d.course.level || "Beginner",
          duration: d.course.duration || "",
          price: d.course.price ?? 0,
        });
      }
    },
    [id]
  );

  useEffect(() => {
    setMsg("");
    setError("");
    setImgFailed(false);
    if (!isEdit) {
      setForm(emptyForm);
      setCourse(null);
      setSections([]);
      setExistingQuiz(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    refresh(true)
      .catch((err) => setError(getErrorMessage(err, "Could not load this course")))
      .finally(() => setLoading(false));
    getQuiz(id)
      .then(({ quiz: q }) => setExistingQuiz(q))
      .catch(() => {});
  }, [id, isEdit, refresh]);

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (e.target.name === "thumbnail") setImgFailed(false);
  };

  const flash = (text) => {
    setMsg(text);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const fail = (err, fallback) => {
    setError(getErrorMessage(err, fallback));
    setMsg("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ---------- Course details ---------- */
  const saveCourse = async (e) => {
    e.preventDefault();
    if (form.title.trim().length < 5) return fail(null, "Title must be at least 5 characters.");
    if (form.description.trim().length < 20)
      return fail(null, "Description must be at least 20 characters.");
    if (!form.category) return fail(null, "Please select a category.");
    if (Number(form.price) < 0 || Number.isNaN(Number(form.price)))
      return fail(null, "Enter a valid price (0 for free).");

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      thumbnail: form.thumbnail.trim(),
      category: form.category,
      level: form.level,
      duration: form.duration.trim(),
      price: Number(form.price),
    };

    try {
      setSaving(true);
      if (isEdit) {
        const res = await updateCourse(id, payload);
        setCourse(res.course);
        flash("Course details saved.");
      } else {
        const res = await createCourse(payload);
        navigate(`/instructor/courses/${res.course._id}`, { replace: true });
      }
    } catch (err) {
      fail(err, "Could not save the course");
    } finally {
      setSaving(false);
    }
  };

  /* ---------- Sections & lessons ---------- */
  const handleAddSection = async (e) => {
    e.preventDefault();
    if (!sectionTitle.trim()) return;
    try {
      await addSection(id, { title: sectionTitle.trim() });
      setSectionTitle("");
      await refresh();
    } catch (err) {
      fail(err, "Could not add section");
    }
  };

  const handleDeleteSection = async (sectionId) => {
    if (!window.confirm("Delete this section and all its lessons?")) return;
    try {
      await deleteSection(id, sectionId);
      await refresh();
    } catch (err) {
      fail(err, "Could not delete section");
    }
  };

  const openLessonModal = (sectionId) => {
    setLessonForm({ title: "", videoUrl: "", duration: "", notes: "" });
    setLessonError("");
    setLessonModal(sectionId);
  };

  const handleAddLesson = async (e) => {
    e.preventDefault();
    if (!lessonForm.title.trim()) return setLessonError("Lesson title is required.");
    if (!/^https?:\/\//i.test(lessonForm.videoUrl.trim()))
      return setLessonError("Enter a valid video link starting with http(s)://");
    try {
      await addLesson(id, lessonModal, {
        title: lessonForm.title.trim(),
        videoUrl: lessonForm.videoUrl.trim(),
        duration: lessonForm.duration.trim(),
        notes: lessonForm.notes.trim(),
      });
      setLessonModal(null);
      await refresh();
    } catch (err) {
      setLessonError(getErrorMessage(err, "Could not add lesson"));
    }
  };

  const handleDeleteLesson = async (sectionId, lessonId) => {
    if (!window.confirm("Delete this lesson?")) return;
    try {
      await deleteLesson(id, sectionId, lessonId);
      await refresh();
    } catch (err) {
      fail(err, "Could not delete lesson");
    }
  };

  /* ---------- Quiz ---------- */
  const setQ = (i, patch) =>
    setQuiz((q) => ({
      ...q,
      questions: q.questions.map((x, idx) => (idx === i ? { ...x, ...patch } : x)),
    }));

  const setOption = (i, j, value) =>
    setQuiz((q) => ({
      ...q,
      questions: q.questions.map((x, idx) =>
        idx === i ? { ...x, options: x.options.map((o, k) => (k === j ? value : o)) } : x
      ),
    }));

  const saveQuiz = async () => {
    const bad = quiz.questions.findIndex(
      (q) => !q.question.trim() || q.options.some((o) => !o.trim())
    );
    if (bad !== -1) return fail(null, `Question ${bad + 1}: fill the question and all 4 options.`);
    const pass = Number(quiz.passingScore);
    if (!(pass >= 1 && pass <= 100)) return fail(null, "Passing score must be between 1 and 100.");
    try {
      const res = await createQuiz(id, {
        title: quiz.title.trim() || "Quiz",
        passingScore: pass,
        questions: quiz.questions.map((q) => ({
          question: q.question.trim(),
          options: q.options.map((o) => o.trim()),
          correctIndex: q.correctIndex,
        })),
      });
      setExistingQuiz(res.quiz);
      setQuiz({ title: "Final quiz", passingScore: 50, questions: [emptyQuestion()] });
      flash("Quiz saved.");
    } catch (err) {
      fail(err, "Could not save quiz");
    }
  };

  /* ---------- Submit for approval ---------- */
  const lessonCount = sections.reduce((n, s) => n + (s.lessons?.length || 0), 0);

  const handleSubmitApproval = async () => {
    try {
      await submitCourse(id);
      await refresh();
      flash("Course submitted. An admin will review it soon.");
    } catch (err) {
      fail(err, "Could not submit the course");
    }
  };

  if (loading) return <Loading text="Loading course..." />;

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <Link
          to="/instructor"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-brand-700"
        >
          <ArrowLeft size={16} /> Back to dashboard
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold">{isEdit ? "Manage course" : "Create new course"}</h1>
          {course?.status && (
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${badge[course.status]}`}
            >
              {course.status}
            </span>
          )}
        </div>
      </div>

      {msg && (
        <p className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">
          <CheckCircle2 size={18} /> {msg}
        </p>
      )}
      {error && (
        <p className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle size={18} /> {error}
        </p>
      )}

      {/* Details */}
      <Card title="Course details">
        <form onSubmit={saveCourse} className="space-y-5" noValidate>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Title</label>
            <input
              name="title"
              value={form.title}
              onChange={onChange}
              placeholder="e.g. Complete React.js Bootcamp"
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={onChange}
              rows={4}
              placeholder="What will students learn in this course?"
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Thumbnail image link</label>
            <input
              name="thumbnail"
              value={form.thumbnail}
              onChange={onChange}
              placeholder="https://images.unsplash.com/..."
              className={inputCls}
            />
            {form.thumbnail && !imgFailed && (
              <img
                src={form.thumbnail}
                alt="Thumbnail preview"
                onError={() => setImgFailed(true)}
                className="mt-3 aspect-video w-full max-w-xs rounded-lg border border-stone-200 object-cover"
              />
            )}
            {imgFailed && (
              <p className="mt-2 text-xs text-red-700">This image link could not be loaded.</p>
            )}
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Category</label>
              <select
                name="category"
                value={form.category}
                onChange={onChange}
                className={inputCls}
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Level</label>
              <select name="level" value={form.level} onChange={onChange} className={inputCls}>
                {LEVELS.filter((l) => l !== "All").map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Duration</label>
              <input
                name="duration"
                value={form.duration}
                onChange={onChange}
                placeholder="e.g. 12h"
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Price (₹, 0 for free)</label>
              <input
                name="price"
                type="number"
                min="0"
                value={form.price}
                onChange={onChange}
                className={inputCls}
              />
            </div>
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : isEdit ? "Save changes" : "Create course"}
          </Button>
        </form>
      </Card>

      {!isEdit && (
        <p className="rounded-lg bg-stone-100 px-4 py-3 text-sm text-stone-600">
          After creating the course you can add sections, lessons and a quiz here.
        </p>
      )}

      {isEdit && course && (
        <>
          {/* Content */}
          <Card
            title="Sections & lessons"
            subtitle={`${sections.length} sections · ${lessonCount} lessons`}
          >
            <form onSubmit={handleAddSection} className="flex flex-col gap-3 sm:flex-row">
              <input
                value={sectionTitle}
                onChange={(e) => setSectionTitle(e.target.value)}
                placeholder="New section title, e.g. Getting started"
                className={inputCls}
              />
              <Button type="submit" className="shrink-0">
                <Plus size={16} /> Add section
              </Button>
            </form>

            <div className="mt-6 space-y-4">
              {sections.length === 0 && (
                <p className="text-sm text-stone-500">No sections yet. Add your first one above.</p>
              )}
              {sections.map((s) => (
                <div key={s._id} className="rounded-lg border border-stone-200">
                  <div className="flex items-center justify-between gap-3 bg-stone-50 px-4 py-3">
                    <p className="font-semibold">{s.title}</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openLessonModal(s._id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold hover:border-brand-600 hover:text-brand-700"
                      >
                        <Plus size={14} /> Lesson
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSection(s._id)}
                        aria-label="Delete section"
                        className="rounded-lg border border-stone-300 bg-white p-1.5 hover:border-red-600 hover:text-red-700"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <ul className="divide-y divide-stone-100">
                    {(s.lessons || []).length === 0 && (
                      <li className="px-4 py-3 text-sm text-stone-500">No lessons in this section.</li>
                    )}
                    {(s.lessons || []).map((l) => (
                      <li
                        key={l._id}
                        className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <PlayCircle size={16} className="shrink-0 text-brand-600" />
                          <span className="truncate">{l.title}</span>
                          {l.duration && <span className="text-stone-500">{l.duration}</span>}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteLesson(s._id, l._id)}
                          aria-label="Delete lesson"
                          className="shrink-0 text-stone-400 hover:text-red-700"
                        >
                          <Trash2 size={15} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Card>

          {/* Quiz */}
          <Card
            title="Quiz"
            subtitle={
              existingQuiz
                ? `A quiz with ${existingQuiz.questions?.length || 0} questions exists. Saving a new one replaces it.`
                : "Add multiple choice questions to test your students."
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Quiz title</label>
                <input
                  value={quiz.title}
                  onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Passing score (%)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={quiz.passingScore}
                  onChange={(e) => setQuiz({ ...quiz, passingScore: e.target.value })}
                  className={inputCls}
                />
              </div>
            </div>

            <div className="mt-6 space-y-5">
              {quiz.questions.map((q, i) => (
                <div key={i} className="rounded-lg border border-stone-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold">Question {i + 1}</p>
                    {quiz.questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setQuiz((x) => ({
                            ...x,
                            questions: x.questions.filter((_, idx) => idx !== i),
                          }))
                        }
                        className="text-stone-400 hover:text-red-700"
                        aria-label="Remove question"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                  <input
                    value={q.question}
                    onChange={(e) => setQ(i, { question: e.target.value })}
                    placeholder="Type the question"
                    className={`${inputCls} mt-2`}
                  />
                  <div className="mt-3 space-y-2">
                    {q.options.map((opt, j) => (
                      <label key={j} className="flex items-center gap-3">
                        <input
                          type="radio"
                          name={`correct-${i}`}
                          checked={q.correctIndex === j}
                          onChange={() => setQ(i, { correctIndex: j })}
                          className="h-4 w-4 accent-brand-600"
                          title="Mark as correct answer"
                        />
                        <input
                          value={opt}
                          onChange={(e) => setOption(i, j, e.target.value)}
                          placeholder={`Option ${j + 1}`}
                          className={inputCls}
                        />
                      </label>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-stone-500">
                    Select the radio button next to the correct answer.
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() =>
                  setQuiz((x) => ({ ...x, questions: [...x.questions, emptyQuestion()] }))
                }
              >
                <Plus size={16} /> Add question
              </Button>
              <Button onClick={saveQuiz}>Save quiz</Button>
            </div>
          </Card>

          {/* Submit */}
          <Card
            title="Publish"
            subtitle="Submit your course so an admin can review and approve it."
          >
            {course.status === "approved" ? (
              <p className="text-sm font-medium text-emerald-800">
                This course is approved and live for students.
              </p>
            ) : course.status === "pending" ? (
              <p className="text-sm font-medium text-amber-800">
                Waiting for admin approval.
              </p>
            ) : (
              <>
                {course.status === "rejected" && (
                  <p className="mb-3 text-sm text-red-700">
                    This course was rejected. Improve it and submit again.
                  </p>
                )}
                <Button onClick={handleSubmitApproval} disabled={lessonCount === 0}>
                  <Send size={16} /> Submit for approval
                </Button>
                {lessonCount === 0 && (
                  <p className="mt-2 text-xs text-stone-500">Add at least one lesson first.</p>
                )}
              </>
            )}
          </Card>
        </>
      )}

      <Modal open={!!lessonModal} onClose={() => setLessonModal(null)} title="Add lesson">
        <form onSubmit={handleAddLesson} className="space-y-4" noValidate>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Lesson title</label>
            <input
              value={lessonForm.title}
              onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Video link (YouTube or .mp4)</label>
            <input
              value={lessonForm.videoUrl}
              onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
              placeholder="https://www.youtube.com/watch?v=..."
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Duration</label>
            <input
              value={lessonForm.duration}
              onChange={(e) => setLessonForm({ ...lessonForm, duration: e.target.value })}
              placeholder="e.g. 12 min"
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Notes (optional)</label>
            <textarea
              rows={3}
              value={lessonForm.notes}
              onChange={(e) => setLessonForm({ ...lessonForm, notes: e.target.value })}
              className={inputCls}
            />
          </div>
          {lessonError && <p className="text-sm text-red-700">{lessonError}</p>}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setLessonModal(null)}>
              Cancel
            </Button>
            <Button type="submit">Add lesson</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}