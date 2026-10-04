import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { AlertCircle, CheckCircle2, Clock3, Smartphone } from "lucide-react";
import Button from "../components/Button";
import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";
import { getCourse } from "../services/courseService";
import { getEnrollmentStatus } from "../services/enrollmentService";
import { getMyPayments, submitPayment } from "../services/paymentService";
import { getErrorMessage } from "../services/api";
import { formatPrice } from "../utils/constants";

const UPI_ID = import.meta.env.VITE_UPI_ID || "";
const UPI_NAME = import.meta.env.VITE_UPI_NAME || "LearnSphere";

const badge = {
  pending: "bg-amber-100 text-amber-800",
  verified: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
};

const fmt = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default function Payment() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [status, setStatus] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [txn, setTxn] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const loadAll = useCallback(async () => {
    try {
      setError("");
      const [pay, c, s] = await Promise.all([
        getMyPayments(),
        courseId ? getCourse(courseId) : Promise.resolve(null),
        courseId ? getEnrollmentStatus(courseId) : Promise.resolve(null),
      ]);
      setPayments(pay.payments);
      setCourse(c?.course ?? null);
      setStatus(s);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load payment details"));
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    setLoading(true);
    setSuccess(false);
    setTxn("");
    loadAll();
  }, [loadAll]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const value = txn.trim();
    if (!/^[A-Za-z0-9]{8,30}$/.test(value)) {
      return setFormError("Enter a valid transaction ID (8 to 30 letters or digits).");
    }
    setFormError("");
    try {
      setSubmitting(true);
      await submitPayment(courseId, value);
      setSuccess(true);
      setTxn("");
      await loadAll();
    } catch (err) {
      setFormError(getErrorMessage(err, "Could not submit payment"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading fullPage text="Loading payments..." />;

  const upiLink = course
    ? `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${course.price}&cu=INR&tn=${encodeURIComponent(
        "LearnSphere " + course.title.slice(0, 30)
      )}`
    : "";

  const renderPaySection = () => {
    if (!course) return null;

    if (!course.price) {
      return (
        <EmptyState
          title="This course is free"
          message="No payment is needed. You can enroll directly."
          action={<Button to={`/courses/${course._id}`}>Go to course</Button>}
        />
      );
    }

    if (status?.enrolled) {
      return (
        <div className="flex flex-col items-start gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-6">
          <p className="flex items-center gap-2 font-semibold text-emerald-900">
            <CheckCircle2 size={20} /> Payment verified. You have full access to this course.
          </p>
          <Button to={`/learn/${course._id}`}>Start learning</Button>
        </div>
      );
    }

    if (status?.paymentStatus === "pending") {
      return (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
          <p className="flex items-center gap-2 font-semibold text-amber-900">
            <Clock3 size={20} /> Payment submitted. Waiting for admin verification.
          </p>
          <p className="mt-2 text-sm text-amber-900/80">
            The course will unlock automatically once an admin verifies your transaction.
          </p>
        </div>
      );
    }

    return (
      <div className="grid gap-8 rounded-xl border border-stone-200 bg-white p-6 md:grid-cols-2 md:p-8">
        <div className="flex flex-col items-center text-center">
          <p className="text-sm font-semibold text-stone-500">Amount to pay</p>
          <p className="font-display text-4xl font-bold text-brand-700">
            {formatPrice(course.price)}
          </p>
          <div className="mt-5 rounded-xl border border-stone-200 bg-white p-4">
            {UPI_ID ? (
              <QRCodeSVG value={upiLink} size={200} level="M" />
            ) : (
              <p className="w-48 py-16 text-sm text-stone-500">UPI ID not configured</p>
            )}
          </div>
          <p className="mt-3 text-sm text-stone-600">
            UPI ID: <span className="font-semibold">{UPI_ID || "not set"}</span>
          </p>
          <a
            href={upiLink}
            className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:underline md:hidden"
          >
            <Smartphone size={16} /> Open in UPI app
          </a>
          {(!UPI_ID || UPI_ID === "yourname@upi") && (
            <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
              Developer note: set your real UPI ID in <b>VITE_UPI_ID</b> inside frontend/.env
            </p>
          )}
        </div>

        <div>
          <h3 className="text-lg font-bold">How to pay</h3>
          <ol className="mt-4 space-y-3 text-sm text-stone-700">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                1
              </span>
              Scan the QR with any UPI app and pay {formatPrice(course.price)}.
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                2
              </span>
              Copy the UPI transaction ID (UTR) from the payment success screen.
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                3
              </span>
              Paste it below and submit. An admin will verify it.
            </li>
          </ol>

          {status?.paymentStatus === "rejected" && (
            <div className="mt-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              Your previous payment was rejected. Please submit the correct transaction ID.
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6" noValidate>
            <label htmlFor="txn" className="mb-1.5 block text-sm font-medium">
              Transaction ID
            </label>
            <input
              id="txn"
              value={txn}
              onChange={(e) => setTxn(e.target.value)}
              placeholder="e.g. 412345678901"
              className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
            />
            {formError && <p className="mt-2 text-sm text-red-700">{formError}</p>}
            <Button type="submit" className="mt-4 w-full" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit payment"}
            </Button>
          </form>

          <p className="mt-4 text-xs leading-relaxed text-stone-500">
            This is a project demo: payments are verified manually by an admin, not
            automatically by the bank.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="container-x py-10">
      <h1 className="text-3xl font-bold sm:text-4xl">
        {course ? "Complete your payment" : "Payment history"}
      </h1>
      {course && (
        <p className="mt-2 text-stone-600">
          Course: <span className="font-semibold">{course.title}</span>
        </p>
      )}

      {error && (
        <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      )}

      {success && (
        <p className="mt-6 flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">
          <CheckCircle2 size={18} /> Payment submitted successfully. We'll verify it soon.
        </p>
      )}

      {course && <div className="mt-8">{renderPaySection()}</div>}

      <section className="mt-12">
        <h2 className="text-2xl font-bold">Your payments</h2>
        {payments.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              title="No payments yet"
              message="Payments for paid courses will show up here."
              action={<Button to="/explore">Explore courses</Button>}
            />
          </div>
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {payments.map((p) => (
              <div key={p._id} className="rounded-xl border border-stone-200 bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold leading-snug">{p.course?.title}</p>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${badge[p.status]}`}
                  >
                    {p.status}
                  </span>
                </div>
                <dl className="mt-4 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-stone-500">Amount</dt>
                    <dd className="font-semibold">{formatPrice(p.amount)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-stone-500">Transaction ID</dt>
                    <dd className="truncate font-mono text-xs">{p.transactionId}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-stone-500">Submitted</dt>
                    <dd>{fmt(p.createdAt)}</dd>
                  </div>
                </dl>
                {p.status === "verified" && (
                  <Link
                    to={`/learn/${p.course?._id}`}
                    className="mt-4 inline-block text-sm font-semibold text-brand-700 hover:underline"
                  >
                    Start learning →
                  </Link>
                )}
                {p.status === "rejected" && (
                  <Link
                    to={`/payment/${p.course?._id}`}
                    className="mt-4 inline-block text-sm font-semibold text-brand-700 hover:underline"
                  >
                    Pay again →
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}