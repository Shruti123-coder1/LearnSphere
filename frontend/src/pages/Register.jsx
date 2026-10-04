import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  GraduationCap,
  AlertCircle,
  BookOpen,
  Presentation,
  CheckCircle2,
} from "lucide-react";
import { useAuth, roleHome } from "../context/AuthContext";
import { getErrorMessage } from "../services/api";

const inputCls =
  "w-full rounded-lg border border-stone-300 bg-white px-4 py-3 text-[15px] outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100";

const roles = [
  { value: "student", label: "I want to learn", icon: BookOpen },
  { value: "instructor", label: "I want to teach", icon: Presentation },
];

const points = [
  "Learn at your own pace",
  "Earn certificates on completion",
  "Publish and teach your own courses",
];

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
    role: "student",
  });
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={roleHome(user.role)} replace />;

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validate = () => {
    if (form.name.trim().length < 2) return "Name must be at least 2 characters.";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return "Enter a valid email address.";
    if (form.password.length < 6) return "Password must be at least 6 characters.";
    if (form.password !== form.confirm) return "Passwords do not match.";
    return "";
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const msg = validate();
    if (msg) return setError(msg);
    setError("");
    try {
      setLoading(true);
      const u = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      });
      navigate(roleHome(u.role), { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Registration failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-6 sm:px-6 sm:py-10">
      <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl md:grid md:min-h-[620px] md:grid-cols-5">
        {/* Mobile header strip */}
        <div className="flex items-center gap-3 bg-ink px-5 py-4 text-white md:hidden">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-600">
            <GraduationCap size={20} />
          </span>
          <div>
            <p className="text-base font-bold leading-tight">LearnSphere</p>
            <p className="text-xs text-stone-300">Start learning or start teaching today.</p>
          </div>
        </div>

        {/* Left info panel (desktop / tablet) */}
        <div className="hidden flex-col justify-between bg-ink p-10 text-white md:col-span-2 md:flex">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-600">
            <GraduationCap size={24} />
          </span>

          <div>
            <h2 className="text-3xl font-bold leading-tight">
              Start learning or start teaching today.
            </h2>
            <p className="mt-3 text-stone-300">
              Create a free account to enroll in courses, track progress and earn
              certificates, or publish your own courses.
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
        <div className="flex flex-col justify-center p-6 sm:p-10 md:col-span-3">
          <h1 className="text-3xl font-bold">Create your account</h1>
          <p className="mt-2 text-sm text-stone-600">
            Already registered?{" "}
            <Link to="/login" className="font-semibold text-brand-700 hover:underline">
              Log in
            </Link>
          </p>

          {error && (
            <div className="mt-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-5" noValidate>
            <div className="grid grid-cols-2 gap-3">
              {roles.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm({ ...form, role: value })}
                  className={`flex flex-col items-center gap-2 rounded-lg border px-3 py-3.5 text-sm font-medium transition ${
                    form.role === value
                      ? "border-brand-600 bg-brand-50 text-brand-800"
                      : "border-stone-300 bg-white text-stone-600 hover:border-stone-400"
                  }`}
                >
                  <Icon size={20} />
                  {label}
                </button>
              ))}
            </div>

            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
                Full name
              </label>
              <input
                id="name"
                name="name"
                value={form.name}
                onChange={onChange}
                autoComplete="name"
                placeholder="Your name"
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={onChange}
                autoComplete="email"
                placeholder="you@example.com"
                className={inputCls}
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2 sm:gap-4">
              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={show ? "text" : "password"}
                    value={form.password}
                    onChange={onChange}
                    autoComplete="new-password"
                    placeholder="Min 6 characters"
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
              <div>
                <label htmlFor="confirm" className="mb-1.5 block text-sm font-medium">
                  Confirm password
                </label>
                <input
                  id="confirm"
                  name="confirm"
                  type={show ? "text" : "password"}
                  value={form.confirm}
                  onChange={onChange}
                  autoComplete="new-password"
                  placeholder="Repeat password"
                  className={inputCls}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand-600 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}