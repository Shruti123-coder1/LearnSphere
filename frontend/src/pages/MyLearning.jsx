import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Award, PlayCircle, CheckCircle2 } from "lucide-react";
import Button from "../components/Button";
import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";
import { useAuth } from "../context/AuthContext";
import { getMyEnrollments } from "../services/enrollmentService";
import { getErrorMessage } from "../services/api";

function Thumb({ src, alt }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-brand-100 text-brand-700">
        <BookOpen size={32} />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-full w-full object-cover"
    />
  );
}

export default function MyLearning() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getMyEnrollments()
      .then((d) => setItems(d.enrollments.filter((e) => e.course)))
      .catch((err) => setError(getErrorMessage(err, "Could not load your courses")))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading fullPage text="Loading your courses..." />;

  const completed = items.filter((e) => e.completionPercent >= 100).length;
  const inProgress = items.length - completed;
  const resume = items.find((e) => e.completionPercent < 100);

  return (
    <div className="container-x py-10">
      <h1 className="text-3xl font-bold sm:text-4xl">My learning</h1>
      <p className="mt-2 text-stone-600">Welcome back, {user?.name}. Keep going!</p>

      {error ? (
        <div className="mt-8">
          <EmptyState title="Something went wrong" message={error} />
        </div>
      ) : items.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="You haven't enrolled in any course yet"
            message="Explore our courses and start learning today."
            action={<Button to="/explore">Explore courses</Button>}
          />
        </div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              { label: "Enrolled", value: items.length, icon: BookOpen },
              { label: "In progress", value: inProgress, icon: PlayCircle },
              { label: "Completed", value: completed, icon: CheckCircle2 },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-xl border border-stone-200 bg-white p-4 sm:p-5">
                <Icon size={20} className="text-brand-600" />
                <p className="mt-3 font-display text-2xl font-bold sm:text-3xl">{value}</p>
                <p className="text-xs text-stone-500 sm:text-sm">{label}</p>
              </div>
            ))}
          </div>

          {resume && (
            <div className="mt-8 flex flex-col gap-4 rounded-xl bg-ink p-6 text-white sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-300">
                  Continue where you left off
                </p>
                <p className="mt-1 text-lg font-bold">{resume.course.title}</p>
                <p className="text-sm text-stone-300">{resume.completionPercent}% complete</p>
              </div>
              <Button to={`/learn/${resume.course._id}`}>Resume course</Button>
            </div>
          )}

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((e) => {
              const c = e.course;
              const pct = Math.min(100, Math.round(e.completionPercent || 0));
              return (
                <div
                  key={e._id}
                  className="flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-white"
                >
                  <Link to={`/courses/${c._id}`} className="block aspect-video bg-stone-200">
                    <Thumb src={c.thumbnail} alt={c.title} />
                  </Link>
                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-xs font-semibold text-brand-700">{c.category}</p>
                    <h3 className="mt-1 line-clamp-2 font-bold leading-snug">{c.title}</h3>
                    <p className="mt-1 text-sm text-stone-500">{c.instructor?.name}</p>

                    <div className="mt-4">
                      <div className="mb-1.5 flex justify-between text-xs font-medium text-stone-600">
                        <span>{pct === 100 ? "Completed" : "Progress"}</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-stone-200">
                        <div
                          className="h-full rounded-full bg-brand-600 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-auto flex gap-2 pt-5">
                      <Button to={`/learn/${c._id}`} size="sm" className="flex-1">
                        {pct === 0 ? "Start" : pct === 100 ? "Review" : "Continue"}
                      </Button>
                      {pct === 100 && (
                        <Button to={`/certificate/${c._id}`} size="sm" variant="outline">
                          <Award size={16} /> Certificate
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}