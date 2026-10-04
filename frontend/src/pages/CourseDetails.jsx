import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Star,
  Clock,
  PlayCircle,
  BarChart3,
  Award,
  Users,
  Heart,
  ChevronDown,
  BookOpen,
  AlertCircle,
  Clock3,
} from "lucide-react";
import Button from "../components/Button";
import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";
import { useAuth } from "../context/AuthContext";
import {
  getCourse,
  getCourseReviews,
  addReview,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from "../services/courseService";
import { enroll, getEnrollmentStatus } from "../services/enrollmentService";
import { getErrorMessage } from "../services/api";
import { formatPrice } from "../utils/constants";

function Stars({ value, size = 16 }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          className={
            n <= Math.round(value)
              ? "fill-amber-400 text-amber-400"
              : "fill-stone-200 text-stone-200"
          }
        />
      ))}
    </span>
  );
}

export default function CourseDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isStudent = user?.role === "student";

  const [data, setData] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [status, setStatus] = useState(null);
  const [wished, setWished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [openSection, setOpenSection] = useState(null);
  const [imgFailed, setImgFailed] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const d = await getCourse(id);
      setData(d);
      setOpenSection(d.sections?.[0]?._id ?? null);
      getCourseReviews(id)
        .then((r) => setReviews(r.reviews))
        .catch(() => {});
      if (isStudent) {
        getEnrollmentStatus(id).then(setStatus).catch(() => {});
        getWishlist()
          .then((w) => setWished(w.courses.some((c) => c._id === id)))
          .catch(() => {});
      }
    } catch (err) {
      setError(getErrorMessage(err, "Could not load this course"));
    } finally {
      setLoading(false);
    }
  }, [id, isStudent]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Loading fullPage text="Loading course..." />;

  if (error || !data) {
    return (
      <div className="container-x py-16">
        <EmptyState
          title="Course not available"
          message={error || "This course doesn't exist or is not published yet."}
          action={<Button to="/explore">Browse courses</Button>}
        />
      </div>
    );
  }

  const { course, sections = [] } = data;
  const lessonCount =
    course.lessonCount ?? sections.reduce((n, s) => n + (s.lessons?.length || 0), 0);
  const avgRating = Number(course.rating || 0);

  const goLogin = () => navigate("/login", { state: { from: location.pathname } });

  const handleEnroll = async () => {
    if (!user) return goLogin();
    if (course.price > 0) return navigate(`/payment/${course._id}`);
    try {
      setBusy(true);
      setNotice("");
      await enroll(course._id);
      navigate(`/learn/${course._id}`);
    } catch (err) {
      setNotice(getErrorMessage(err, "Could not enroll"));
    } finally {
      setBusy(false);
    }
  };

  const toggleWish = async () => {
    if (!user) return goLogin();
    try {
      if (wished) await removeFromWishlist(course._id);
      else await addToWishlist(course._id);
      setWished(!wished);
    } catch (err) {
      setNotice(getErrorMessage(err));
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    setReviewError("");
    if (comment.trim().length < 3) return setReviewError("Please write a short review.");
    try {
      setReviewBusy(true);
      await addReview(course._id, { rating, comment: comment.trim() });
      setComment("");
      const [r, d] = await Promise.all([getCourseReviews(id), getCourse(id)]);
      setReviews(r.reviews);
      setData(d);
    } catch (err) {
      setReviewError(getErrorMessage(err, "Could not submit review"));
    } finally {
      setReviewBusy(false);
    }
  };

  const renderCta = () => {
    if (user && !isStudent) {
      return (
        <p className="rounded-lg bg-stone-100 px-4 py-3 text-sm text-stone-600">
          Log in with a student account to enroll in courses.
        </p>
      );
    }
    if (status?.enrolled) {
      return (
        <div className="space-y-2.5">
          <Button to={`/learn/${course._id}`} size="lg" className="w-full">
            Continue learning
          </Button>
          <Button to={`/courses/${course._id}/quiz`} variant="outline" className="w-full">
            Take quiz
          </Button>
          {status.completionPercent === 100 && (
            <Button to={`/certificate/${course._id}`} variant="dark" className="w-full">
              <Award size={18} /> Get certificate
            </Button>
          )}
        </div>
      );
    }
    if (status?.paymentStatus === "pending") {
      return (
        <div className="space-y-3">
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <Clock3 size={18} className="mt-0.5 shrink-0" />
            Your payment is waiting for admin verification.
          </div>
          <Button to="/payments" variant="outline" className="w-full">
            View payment status
          </Button>
        </div>
      );
    }
    return (
      <div className="space-y-3">
        {status?.paymentStatus === "rejected" && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            Your last payment was rejected. Please pay again with a correct transaction ID.
          </div>
        )}
        <Button size="lg" className="w-full" onClick={handleEnroll} disabled={busy}>
          {busy
            ? "Please wait..."
            : course.price > 0
            ? `Buy now · ${formatPrice(course.price)}`
            : "Enroll for free"}
        </Button>
      </div>
    );
  };

  return (
    <>
      {/* Header */}
      <section className="bg-ink text-white">
        <div className="container-x py-12 lg:py-16">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-300">
            {course.category}
          </p>
          <h1 className="mt-3 max-w-4xl text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
            {course.title}
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-stone-300">{course.description}</p>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-stone-300">
            <span className="flex items-center gap-2">
              {avgRating > 0 ? (
                <>
                  <span className="font-bold text-amber-400">{avgRating.toFixed(1)}</span>
                  <Stars value={avgRating} />
                  <span>({course.reviewCount || 0} reviews)</span>
                </>
              ) : (
                <span>No ratings yet</span>
              )}
            </span>
            <span className="flex items-center gap-1.5">
              <Users size={16} /> {course.enrolledCount || 0} students
            </span>
            <span>
              By <span className="font-semibold text-white">{course.instructor?.name}</span>
            </span>
          </div>
        </div>
      </section>

      <div className="container-x grid gap-10 py-10 lg:grid-cols-[1fr_24rem]">
        <div className="min-w-0 space-y-12">
          {course.status && course.status !== "approved" && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              This course is <b className="mx-1 capitalize">{course.status}</b> and not visible to students yet.
            </div>
          )}

          {/* Curriculum */}
          <section>
            <h2 className="text-2xl font-bold">Course content</h2>
            <p className="mt-1 text-sm text-stone-500">
              {sections.length} sections · {lessonCount} lessons
            </p>

            {sections.length === 0 ? (
              <div className="mt-5">
                <EmptyState
                  title="Content coming soon"
                  message="The instructor hasn't added lessons yet."
                />
              </div>
            ) : (
              <div className="mt-5 divide-y divide-stone-200 overflow-hidden rounded-xl border border-stone-200 bg-white">
                {sections.map((s) => {
                  const isOpen = openSection === s._id;
                  return (
                    <div key={s._id}>
                      <button
                        type="button"
                        onClick={() => setOpenSection(isOpen ? null : s._id)}
                        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-stone-50"
                      >
                        <span className="font-semibold">{s.title}</span>
                        <span className="flex shrink-0 items-center gap-3 text-sm text-stone-500">
                          {s.lessons?.length || 0} lessons
                          <ChevronDown
                            size={18}
                            className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
                          />
                        </span>
                      </button>
                      {isOpen && (
                        <ul className="border-t border-stone-100 bg-stone-50/60">
                          {(s.lessons || []).map((l) => (
                            <li
                              key={l._id}
                              className="flex items-center justify-between gap-3 px-5 py-3 text-sm"
                            >
                              <span className="flex items-center gap-3">
                                <PlayCircle size={16} className="text-brand-600" />
                                {l.title}
                              </span>
                              {l.duration && (
                                <span className="text-stone-500">{l.duration}</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Reviews */}
          <section>
            <h2 className="text-2xl font-bold">Student reviews</h2>

            {status?.enrolled && (
              <form
                onSubmit={submitReview}
                className="mt-5 rounded-xl border border-stone-200 bg-white p-5"
              >
                <p className="text-sm font-semibold">Rate this course</p>
                <div className="mt-2 flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(n)}
                      aria-label={`${n} stars`}
                    >
                      <Star
                        size={26}
                        className={
                          n <= rating
                            ? "fill-amber-400 text-amber-400"
                            : "fill-stone-200 text-stone-200"
                        }
                      />
                    </button>
                  ))}
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  placeholder="Share your experience with this course"
                  className="mt-3 w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                />
                {reviewError && (
                  <p className="mt-2 text-sm text-red-700">{reviewError}</p>
                )}
                <Button type="submit" size="sm" className="mt-3" disabled={reviewBusy}>
                  {reviewBusy ? "Submitting..." : "Submit review"}
                </Button>
              </form>
            )}

            {reviews.length === 0 ? (
              <p className="mt-5 text-sm text-stone-500">
                No reviews yet. Enrolled students can leave the first one.
              </p>
            ) : (
              <ul className="mt-5 space-y-4">
                {reviews.map((r) => (
                  <li key={r._id} className="rounded-xl border border-stone-200 bg-white p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-800">
                          {r.student?.name?.charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <p className="text-sm font-semibold">{r.student?.name}</p>
                          <p className="text-xs text-stone-500">
                            {new Date(r.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                      <Stars value={r.rating} size={14} />
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-stone-700">{r.comment}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Sidebar card */}
        <aside>
          <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm lg:sticky lg:top-24">
            <div className="aspect-video bg-stone-200">
              {!course.thumbnail || imgFailed ? (
                <div className="flex h-full w-full items-center justify-center bg-brand-100 text-brand-700">
                  <BookOpen size={44} />
                </div>
              ) : (
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  onError={() => setImgFailed(true)}
                  className="h-full w-full object-cover"
                />
              )}
            </div>

            <div className="space-y-5 p-6">
              <p
                className={`font-display text-3xl font-bold ${
                  !course.price ? "text-emerald-700" : ""
                }`}
              >
                {formatPrice(course.price)}
              </p>

              {notice && (
                <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{notice}</p>
              )}

              {renderCta()}

              {(!user || isStudent) && (
                <button
                  type="button"
                  onClick={toggleWish}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-stone-300 py-2.5 text-sm font-semibold hover:border-ink"
                >
                  <Heart
                    size={17}
                    className={wished ? "fill-brand-600 text-brand-600" : ""}
                  />
                  {wished ? "Saved to wishlist" : "Add to wishlist"}
                </button>
              )}

              <ul className="space-y-3 border-t border-stone-100 pt-5 text-sm text-stone-700">
                <li className="flex items-center gap-3">
                  <Clock size={17} className="text-stone-400" />
                  {course.duration || "Self paced"}
                </li>
                <li className="flex items-center gap-3">
                  <PlayCircle size={17} className="text-stone-400" />
                  {lessonCount} lessons
                </li>
                <li className="flex items-center gap-3">
                  <BarChart3 size={17} className="text-stone-400" />
                  {course.level} level
                </li>
                <li className="flex items-center gap-3">
                  <Award size={17} className="text-stone-400" />
                  Certificate on completion
                </li>
              </ul>
            </div>
          </div>
          <Link
            to="/explore"
            className="mt-4 block text-center text-sm font-semibold text-brand-700 hover:underline"
          >
            ← Back to all courses
          </Link>
        </aside>
      </div>
    </>
  );
}