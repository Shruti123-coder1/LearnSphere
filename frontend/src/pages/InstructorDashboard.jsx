import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, CheckCircle2, Clock3, Users, Plus, Pencil, Trash2, Send } from "lucide-react";
import Button from "../components/Button";
import Modal from "../components/Modal";
import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";
import { useAuth } from "../context/AuthContext";
import { getMyCourses, deleteCourse, submitCourse } from "../services/courseService";
import { getErrorMessage } from "../services/api";
import { formatPrice } from "../utils/constants";

const badge = {
  draft: "bg-stone-200 text-stone-700",
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
};

export default function InstructorDashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setError("");
      const d = await getMyCourses();
      setCourses(d.courses);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load your courses"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const confirmDelete = async () => {
    try {
      setBusy(true);
      await deleteCourse(toDelete._id);
      setToDelete(null);
      setNotice("Course deleted.");
      await load();
    } catch (err) {
      setNotice(getErrorMessage(err, "Could not delete course"));
      setToDelete(null);
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = async (c) => {
    try {
      await submitCourse(c._id);
      setNotice(`"${c.title}" submitted for admin approval.`);
      await load();
    } catch (err) {
      setNotice(getErrorMessage(err, "Could not submit course"));
    }
  };

  if (loading) return <Loading text="Loading your dashboard..." />;

  const stats = [
    { label: "Total courses", value: courses.length, icon: BookOpen },
    {
      label: "Published",
      value: courses.filter((c) => c.status === "approved").length,
      icon: CheckCircle2,
    },
    {
      label: "Waiting approval",
      value: courses.filter((c) => c.status === "pending").length,
      icon: Clock3,
    },
    {
      label: "Total students",
      value: courses.reduce((n, c) => n + (c.enrolledCount || 0), 0),
      icon: Users,
    },
  ];

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Instructor dashboard</h1>
          <p className="mt-1 text-stone-600">Hello {user?.name}, manage your courses here.</p>
        </div>
        <Button to="/instructor/courses/new">
          <Plus size={18} /> New course
        </Button>
      </div>

      {notice && (
        <p className="mt-5 rounded-lg bg-brand-50 px-4 py-3 text-sm font-medium text-brand-900">
          {notice}
        </p>
      )}
      {error && (
        <p className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-stone-200 bg-white p-5">
            <Icon size={20} className="text-brand-600" />
            <p className="mt-3 font-display text-3xl font-bold">{value}</p>
            <p className="text-sm text-stone-500">{label}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-10 text-xl font-bold">Your courses</h2>

      {courses.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="You haven't created any course"
            message="Create your first course, add lessons and submit it for approval."
            action={<Button to="/instructor/courses/new">Create course</Button>}
          />
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-stone-200 bg-white">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="bg-stone-50 text-xs uppercase tracking-wider text-stone-500">
              <tr>
                <th className="px-5 py-3">Course</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Students</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c._id} className="border-t border-stone-100">
                  <td className="px-5 py-4">
                    <Link
                      to={`/instructor/courses/${c._id}`}
                      className="font-semibold hover:text-brand-700"
                    >
                      {c.title}
                    </Link>
                    <p className="text-xs text-stone-500">
                      {c.category} · {c.level}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${badge[c.status]}`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">{formatPrice(c.price)}</td>
                  <td className="px-5 py-4">{c.enrolledCount || 0}</td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      {(c.status === "draft" || c.status === "rejected") && (
                        <button
                          type="button"
                          onClick={() => handleSubmit(c)}
                          title="Submit for approval"
                          className="rounded-lg border border-stone-300 p-2 text-stone-700 hover:border-brand-600 hover:text-brand-700"
                        >
                          <Send size={16} />
                        </button>
                      )}
                      <Link
                        to={`/instructor/courses/${c._id}`}
                        title="Edit"
                        className="rounded-lg border border-stone-300 p-2 text-stone-700 hover:border-brand-600 hover:text-brand-700"
                      >
                        <Pencil size={16} />
                      </Link>
                      <button
                        type="button"
                        onClick={() => setToDelete(c)}
                        title="Delete"
                        className="rounded-lg border border-stone-300 p-2 text-stone-700 hover:border-red-600 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="Delete this course?">
        <p className="text-sm text-stone-600">
          "{toDelete?.title}" and all its lessons will be permanently removed. This cannot be
          undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setToDelete(null)}>
            Cancel
          </Button>
          <button
            type="button"
            onClick={confirmDelete}
            disabled={busy}
            className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {busy ? "Deleting..." : "Yes, delete"}
          </button>
        </div>
      </Modal>
    </div>
  );
}