import { useState } from "react";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { changePassword, updateProfile } from "../services/authService";
import { getErrorMessage } from "../services/api";

const inputCls =
  "w-full rounded-lg border border-stone-300 bg-white px-4 py-3 text-[15px] outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100";

const submitCls =
  "rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60";

function Notice({ notice }) {
  if (!notice) return null;
  const ok = notice.type === "success";
  const Icon = ok ? CheckCircle2 : AlertCircle;
  return (
    <div
      className={`mb-5 flex items-start gap-2 rounded-lg border px-4 py-3 text-sm ${
        ok
          ? "border-green-200 bg-green-50 text-green-800"
          : "border-red-200 bg-red-50 text-red-800"
      }`}
    >
      <Icon size={18} className="mt-0.5 shrink-0" />
      {notice.text}
    </div>
  );
}

function PasswordField({ id, label, value, onChange, show, onToggle, autoComplete, placeholder }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`${inputCls} pr-12`}
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label="Toggle password visibility"
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-ink"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

export default function Profile() {
  const { user, updateUser } = useAuth();

  const [details, setDetails] = useState({ name: user.name || "", email: user.email || "" });
  const [detailsNotice, setDetailsNotice] = useState(null);
  const [savingDetails, setSavingDetails] = useState(false);

  const [pw, setPw] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showPw, setShowPw] = useState(false);
  const [pwNotice, setPwNotice] = useState(null);
  const [savingPw, setSavingPw] = useState(false);

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  const unchanged =
    details.name.trim() === user.name && details.email.trim().toLowerCase() === user.email;

  const onDetailsChange = (e) => setDetails({ ...details, [e.target.name]: e.target.value });
  const onPwChange = (e) => setPw({ ...pw, [e.target.name]: e.target.value });

  const saveDetails = async (e) => {
    e.preventDefault();
    setDetailsNotice(null);

    const name = details.name.trim();
    const email = details.email.trim().toLowerCase();
    if (name.length < 2) {
      return setDetailsNotice({ type: "error", text: "Name must be at least 2 characters." });
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return setDetailsNotice({ type: "error", text: "Enter a valid email address." });
    }

    try {
      setSavingDetails(true);
      const data = await updateProfile({ name, email });
      updateUser(data.user);
      setDetails({ name: data.user.name, email: data.user.email });
      setDetailsNotice({ type: "success", text: "Your profile has been updated." });
    } catch (err) {
      setDetailsNotice({
        type: "error",
        text: getErrorMessage(err, "Could not update your profile. Please try again."),
      });
    } finally {
      setSavingDetails(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setPwNotice(null);

    if (!pw.currentPassword) {
      return setPwNotice({ type: "error", text: "Enter your current password." });
    }
    if (pw.newPassword.length < 6) {
      return setPwNotice({ type: "error", text: "New password must be at least 6 characters." });
    }
    if (pw.newPassword !== pw.confirmPassword) {
      return setPwNotice({ type: "error", text: "New password and confirm password do not match." });
    }

    try {
      setSavingPw(true);
      await changePassword({
        currentPassword: pw.currentPassword,
        newPassword: pw.newPassword,
      });
      setPw({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPwNotice({ type: "success", text: "Your password has been changed." });
    } catch (err) {
      setPwNotice({
        type: "error",
        text: getErrorMessage(err, "Could not change your password. Please try again."),
      });
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="container-x py-10">
      <h1 className="text-3xl font-bold sm:text-4xl">My profile</h1>
      <p className="mt-2 text-stone-600">Update your personal details and keep your account secure.</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[18rem_1fr]">
        {/* Summary card */}
        <aside className="h-fit rounded-2xl border border-stone-200 bg-white p-6 text-center shadow-sm">
          <span
            style={{ width: 80, height: 80, minWidth: 80, minHeight: 80 }}
            className="mx-auto flex shrink-0 items-center justify-center rounded-full bg-brand-600 text-3xl font-bold text-white"
          >
            {user.name?.charAt(0).toUpperCase()}
          </span>
          <p className="mt-4 truncate text-lg font-semibold">{user.name}</p>
          <p className="truncate text-sm text-stone-500">{user.email}</p>
          <span className="mt-3 inline-block rounded bg-brand-50 px-2.5 py-1 text-xs font-semibold capitalize text-brand-700">
            {user.role}
          </span>
          {memberSince && (
            <p className="mt-4 border-t border-stone-100 pt-4 text-xs text-stone-500">
              Member since {memberSince}
            </p>
          )}
        </aside>

        <div className="space-y-6">
          {/* Personal details */}
          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <User size={20} className="text-brand-600" /> Personal details
            </h2>
            <p className="mb-6 mt-1 text-sm text-stone-600">
              This name appears on your certificates and course reviews.
            </p>

            <Notice notice={detailsNotice} />

            <form onSubmit={saveDetails} className="space-y-5" noValidate>
              <div>
                <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
                  Full name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={details.name}
                  onChange={onDetailsChange}
                  placeholder="Your name"
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="email" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
                  <Mail size={15} /> Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={details.email}
                  onChange={onDetailsChange}
                  placeholder="you@example.com"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium" htmlFor="role">
                  Account type
                </label>
                <input
                  id="role"
                  type="text"
                  value={user.role}
                  readOnly
                  disabled
                  className={`${inputCls} cursor-not-allowed bg-stone-50 capitalize text-stone-500`}
                />
              </div>
              <button type="submit" disabled={savingDetails || unchanged} className={submitCls}>
                {savingDetails ? "Saving..." : "Save changes"}
              </button>
            </form>
          </section>

          {/* Change password */}
          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <Lock size={20} className="text-brand-600" /> Change password
            </h2>
            <p className="mb-6 mt-1 text-sm text-stone-600">
              Use at least 6 characters. You will stay logged in after changing it.
            </p>

            <Notice notice={pwNotice} />

            <form onSubmit={savePassword} className="space-y-5" noValidate>
              <PasswordField
                id="currentPassword"
                label="Current password"
                value={pw.currentPassword}
                onChange={onPwChange}
                show={showPw}
                onToggle={() => setShowPw((v) => !v)}
                autoComplete="current-password"
                placeholder="Your current password"
              />
              <div className="grid gap-5 sm:grid-cols-2">
                <PasswordField
                  id="newPassword"
                  label="New password"
                  value={pw.newPassword}
                  onChange={onPwChange}
                  show={showPw}
                  onToggle={() => setShowPw((v) => !v)}
                  autoComplete="new-password"
                  placeholder="Min 6 characters"
                />
                <PasswordField
                  id="confirmPassword"
                  label="Confirm new password"
                  value={pw.confirmPassword}
                  onChange={onPwChange}
                  show={showPw}
                  onToggle={() => setShowPw((v) => !v)}
                  autoComplete="new-password"
                  placeholder="Repeat new password"
                />
              </div>
              <button type="submit" disabled={savingPw} className={submitCls}>
                {savingPw ? "Updating..." : "Update password"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}