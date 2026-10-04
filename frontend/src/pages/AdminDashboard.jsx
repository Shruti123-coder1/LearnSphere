import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Users,
  GraduationCap,
  Presentation,
  BookOpen,
  Clock3,
  CreditCard,
  IndianRupee,
  ClipboardCheck,
  Trash2,
  Plus,
} from "lucide-react";
import Button from "../components/Button";
import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";
import { useAuth } from "../context/AuthContext";
import {
  getAdminStats,
  getUsers,
  updateUserRole,
  getAdminCourses,
  setCourseStatus,
  getAdminPayments,
  setPaymentStatus,
  createCategory,
  deleteCategory,
} from "../services/adminService";
import { getCategories } from "../services/courseService";
import { getErrorMessage } from "../services/api";
import { formatPrice } from "../utils/constants";

const inputCls =
  "rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100";

const badge = {
  draft: "bg-stone-200 text-stone-700",
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  verified: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
};

const fmt = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const Badge = ({ status }) => (
  <span
    className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${badge[status] || badge.draft}`}
  >
    {status}
  </span>
);

const thCls = "px-5 py-3";
const tdCls = "px-5 py-4";
const tableWrap = "overflow-x-auto rounded-xl border border-stone-200 bg-white";
const theadCls = "bg-stone-50 text-xs uppercase tracking-wider text-stone-500";

/* ---------------- Overview ---------------- */
function Overview() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getAdminStats()
      .then((d) => setStats(d.stats))
      .catch((err) => setError(getErrorMessage(err, "Could not load statistics")));
  }, []);

  if (error) return <EmptyState title="Something went wrong" message={error} />;
  if (!stats) return <Loading text="Loading statistics..." />;

  const cards = [
    { label: "Total users", value: stats.users, icon: Users },
    { label: "Students", value: stats.students, icon: GraduationCap },
    { label: "Instructors", value: stats.instructors, icon: Presentation },
    { label: "Courses", value: stats.courses, icon: BookOpen },
    { label: "Enrollments", value: stats.enrollments, icon: ClipboardCheck },
    { label: "Revenue (verified)", value: formatPrice(stats.revenue || 0), icon: IndianRupee },
    { label: "Courses to review", value: stats.pendingCourses, icon: Clock3, to: "/admin?tab=courses" },
    { label: "Payments to verify", value: stats.pendingPayments, icon: CreditCard, to: "/admin?tab=payments" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      {cards.map(({ label, value, icon: Icon, to }) => {
        const body = (
          <>
            <Icon size={20} className="text-brand-600" />
            <p className="mt-3 font-display text-3xl font-bold">{value}</p>
            <p className="text-sm text-stone-500">{label}</p>
          </>
        );
        return to ? (
          <Link
            key={label}
            to={to}
            className="rounded-xl border border-brand-200 bg-brand-50 p-5 transition hover:shadow-md"
          >
            {body}
          </Link>
        ) : (
          <div key={label} className="rounded-xl border border-stone-200 bg-white p-5">
            {body}
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- Users ---------------- */
function UsersTab() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getUsers()
      .then((d) => setUsers(d.users))
      .catch((err) => setError(getErrorMessage(err, "Could not load users")))
      .finally(() => setLoading(false));
  }, []);

  const changeRole = async (id, role) => {
    try {
      await updateUserRole(id, role);
      setUsers((list) => list.map((u) => (u._id === id ? { ...u, role } : u)));
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "Could not update role"));
    }
  };

  if (loading) return <Loading text="Loading users..." />;

  return (
    <>
      {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
      <div className={tableWrap}>
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className={theadCls}>
            <tr>
              <th className={thCls}>Name</th>
              <th className={thCls}>Email</th>
              <th className={thCls}>Role</th>
              <th className={thCls}>Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-t border-stone-100">
                <td className={`${tdCls} font-semibold`}>{u.name}</td>
                <td className={tdCls}>{u.email}</td>
                <td className={tdCls}>
                  <select
                    value={u.role}
                    disabled={u._id === me?._id}
                    onChange={(e) => changeRole(u._id, e.target.value)}
                    className={`${inputCls} py-1.5 text-xs capitalize disabled:opacity-60`}
                  >
                    <option value="student">Student</option>
                    <option value="instructor">Instructor</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className={tdCls}>{fmt(u.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ---------------- Courses ---------------- */
function CoursesTab() {
  const [filter, setFilter] = useState("pending");
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const d = await getAdminCourses(filter === "all" ? undefined : filter);
      setCourses(d.courses);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load courses"));
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (id, status) => {
    try {
      await setCourseStatus(id, status);
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Action failed"));
    }
  };

  return (
    <>
      <div className="mb-4 flex items-center gap-3">
        <label className="text-sm font-medium">Show</label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className={inputCls}>
          {["pending", "approved", "rejected", "draft", "all"].map((s) => (
            <option key={s} value={s} className="capitalize">
              {s}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}

      {loading ? (
        <Loading text="Loading courses..." />
      ) : courses.length === 0 ? (
        <EmptyState title="Nothing here" message={`No ${filter} courses right now.`} />
      ) : (
        <div className={tableWrap}>
          <table className="w-full min-w-[52rem] text-left text-sm">
            <thead className={theadCls}>
              <tr>
                <th className={thCls}>Course</th>
                <th className={thCls}>Instructor</th>
                <th className={thCls}>Price</th>
                <th className={thCls}>Status</th>
                <th className={`${thCls} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c._id} className="border-t border-stone-100">
                  <td className={tdCls}>
                    <Link to={`/courses/${c._id}`} className="font-semibold hover:text-brand-700">
                      {c.title}
                    </Link>
                    <p className="text-xs text-stone-500">{c.category}</p>
                  </td>
                  <td className={tdCls}>
                    {c.instructor?.name}
                    <p className="text-xs text-stone-500">{c.instructor?.email}</p>
                  </td>
                  <td className={tdCls}>{formatPrice(c.price)}</td>
                  <td className={tdCls}>
                    <Badge status={c.status} />
                  </td>
                  <td className={tdCls}>
                    <div className="flex justify-end gap-2">
                      {c.status !== "approved" && (
                        <button
                          type="button"
                          onClick={() => act(c._id, "approved")}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                        >
                          Approve
                        </button>
                      )}
                      {c.status !== "rejected" && (
                        <button
                          type="button"
                          onClick={() => act(c._id, "rejected")}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

/* ---------------- Payments ---------------- */
function PaymentsTab() {
  const [filter, setFilter] = useState("pending");
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const d = await getAdminPayments(filter === "all" ? undefined : filter);
      setPayments(d.payments);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load payments"));
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (id, status) => {
    try {
      await setPaymentStatus(id, status);
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Action failed"));
    }
  };

  return (
    <>
      <div className="mb-4 flex items-center gap-3">
        <label className="text-sm font-medium">Show</label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className={inputCls}>
          {["pending", "verified", "rejected", "all"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <p className="mb-4 text-xs text-stone-500">
        Check the transaction ID in your UPI/bank app before verifying. Verifying unlocks the
        course for the student.
      </p>
      {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}

      {loading ? (
        <Loading text="Loading payments..." />
      ) : payments.length === 0 ? (
        <EmptyState title="Nothing here" message={`No ${filter} payments right now.`} />
      ) : (
        <div className={tableWrap}>
          <table className="w-full min-w-[56rem] text-left text-sm">
            <thead className={theadCls}>
              <tr>
                <th className={thCls}>Student</th>
                <th className={thCls}>Course</th>
                <th className={thCls}>Amount</th>
                <th className={thCls}>Transaction ID</th>
                <th className={thCls}>Date</th>
                <th className={thCls}>Status</th>
                <th className={`${thCls} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p._id} className="border-t border-stone-100">
                  <td className={tdCls}>
                    <p className="font-semibold">{p.student?.name}</p>
                    <p className="text-xs text-stone-500">{p.student?.email}</p>
                  </td>
                  <td className={tdCls}>{p.course?.title}</td>
                  <td className={tdCls}>{formatPrice(p.amount)}</td>
                  <td className={`${tdCls} font-mono text-xs`}>{p.transactionId}</td>
                  <td className={tdCls}>{fmt(p.createdAt)}</td>
                  <td className={tdCls}>
                    <Badge status={p.status} />
                  </td>
                  <td className={tdCls}>
                    <div className="flex justify-end gap-2">
                      {p.status !== "verified" && (
                        <button
                          type="button"
                          onClick={() => act(p._id, "verified")}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                        >
                          Verify
                        </button>
                      )}
                      {p.status !== "rejected" && (
                        <button
                          type="button"
                          onClick={() => act(p._id, "rejected")}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

/* ---------------- Categories ---------------- */
function CategoriesTab() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const d = await getCategories();
      setCategories(d.categories);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load categories"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const add = async (e) => {
    e.preventDefault();
    if (name.trim().length < 2) return setError("Category name is too short.");
    try {
      await createCategory(name.trim());
      setName("");
      setError("");
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Could not add category"));
    }
  };

  const remove = async (c) => {
    if (!window.confirm(`Delete category "${c.name}"?`)) return;
    try {
      await deleteCategory(c._id);
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Could not delete category"));
    }
  };

  if (loading) return <Loading text="Loading categories..." />;

  return (
    <>
      <form onSubmit={add} className="flex max-w-xl flex-col gap-3 sm:flex-row">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New category name"
          className={`${inputCls} flex-1`}
        />
        <Button type="submit">
          <Plus size={16} /> Add category
        </Button>
      </form>
      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}

      {categories.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="No categories" message="Add your first category above." />
        </div>
      ) : (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((c) => (
            <li
              key={c._id}
              className="flex items-center justify-between rounded-xl border border-stone-200 bg-white px-5 py-3.5"
            >
              <span className="font-medium">{c.name}</span>
              <button
                type="button"
                onClick={() => remove(c)}
                aria-label="Delete category"
                className="text-stone-400 hover:text-red-700"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/* ---------------- Page ---------------- */
const tabs = ["overview", "users", "courses", "payments", "categories"];
const titles = {
  overview: "Platform overview",
  users: "User management",
  courses: "Course approval",
  payments: "Payment verification",
  categories: "Category management",
};

export default function AdminDashboard() {
  const [params] = useSearchParams();
  const tab = tabs.includes(params.get("tab")) ? params.get("tab") : "overview";

  return (
    <div>
      <h1 className="text-3xl font-bold">{titles[tab]}</h1>
      <div className="mt-6">
        {tab === "overview" && <Overview />}
        {tab === "users" && <UsersTab />}
        {tab === "courses" && <CoursesTab />}
        {tab === "payments" && <PaymentsTab />}
        {tab === "categories" && <CategoriesTab />}
      </div>
    </div>
  );
}