import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, GraduationCap, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth, roleHome } from "../context/AuthContext";
import { getErrorMessage } from "../services/api";

const inputCls =
  "w-full rounded-lg border border-stone-300 bg-white px-4 py-3 text-[15px] outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100";

const points = [
  "Resume your courses instantly",
  "Track your learning progress",
  "Download your certificates",
];

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={roleHome(user.role)} replace />;

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.email.trim() || !form.password) {
      return setError("Please enter your email and password.");
    }
    try {
      setLoading(true);
      const u = await login({ email: form.email.trim(), password: form.password });
      navigate(location.state?.from || roleHome(u.role), { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Login failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-6 sm:px-6 sm:py-10">
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl md:grid md:min-h-[540px] md:grid-cols-2">
        {/* Mobile header strip */}
        <div className="flex items-center gap-3 bg-ink px-5 py-4 text-white md:hidden">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-600">
            <GraduationCap size={20} />
          </span>
          <div>
            <p className="text-base font-bold leading-tight">LearnSphere</p>
            <p className="text-xs text-stone-300">Welcome back. Pick up where you left off.</p>
          </div>
        </div>

        {/* Left info panel (desktop / tablet) */}
        <div className="hidden flex-col justify-between bg-ink p-10 text-white md:flex">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-600">
            <GraduationCap size={24} />
          </span>

          <div>
            <h2 className="text-3xl font-bold leading-tight">
              Welcome back. Pick up right where you left off.
            </h2>
            <p className="mt-3 text-stone-300">
              Your courses, progress and certificates are waiting for you.
            </p>
            <ul className="mt-6 space-y-3">
              {points.map((p) => (
                <li key={p} className="flex items-center gap-2.5 text-sm text-stone-200">
                  <CheckCircle2 size={18} className="shrink-0 text-brand-400" />
                  {p}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-stone-500">LearnSphere Learning Platform</p>
        </div>

        {/* Form panel */}
        <div className="flex flex-col justify-center p-6 sm:p-10">
          <h1 className="text-3xl font-bold">Log in</h1>
          <p className="mt-2 text-sm text-stone-600">
            New here?{" "}
            <Link to="/register" className="font-semibold text-brand-700 hover:underline">
              Create an account
            </Link>
          </p>

          {error && (
            <div className="mt-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-5" noValidate>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={onChange}
                placeholder="you@example.com"
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={onChange}
                  placeholder="Your password"
                  className={`${inputCls} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  aria-label="Toggle password visibility"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-ink"
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand-600 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}