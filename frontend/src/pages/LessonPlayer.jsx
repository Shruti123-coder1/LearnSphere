import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  PlayCircle,
  ChevronRight,
  ChevronLeft,
  Award,
  ExternalLink,
  ClipboardList,
} from "lucide-react";
import Button from "../components/Button";
import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";
import { getLearningData, saveProgress } from "../services/enrollmentService";
import { getErrorMessage } from "../services/api";

function getEmbed(url = "") {
  const yt = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/
  );
  if (yt) return { type: "iframe", src: `https://www.youtube.com/embed/${yt[1]}?rel=0` };
  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(url)) return { type: "video", src: url };
  return url ? { type: "link", src: url } : null;
}

export default function LessonPlayer() {
  const { courseId } = useParams();
  const [data, setData] = useState(null);
  const [currentId, setCurrentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    getLearningData(courseId)
      .then((d) => {
        if (ignore) return;
        setData(d);
        const all = d.sections.flatMap((s) => s.lessons || []);
        const done = new Set((d.progress?.completedLessons || []).map(String));
        const start = all.find((l) => !done.has(String(l._id))) || all[0];
        setCurrentId(start?._id ?? null);
      })
      .catch((err) => !ignore && setError(getErrorMessage(err, "Could not open this course")))
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, [courseId]);

  if (loading) return <Loading fullPage text="Loading lessons..." />;

  if (error || !data) {
    return (
      <div className="container-x py-16">
        <EmptyState
          title="You can't open this course"
          message={error || "Please enroll in this course first."}
          action={<Button to={`/courses/${courseId}`}>Go to course page</Button>}
        />
      </div>
    );
  }

  const lessons = data.sections.flatMap((s) => s.lessons || []);
  if (lessons.length === 0) {
    return (
      <div className="container-x py-16">
        <EmptyState
          title="No lessons yet"
          message="The instructor hasn't added any lessons to this course."
          action={<Button to="/my-learning">Back to my learning</Button>}
        />
      </div>
    );
  }

  const done = new Set((data.progress?.completedLessons || []).map(String));
  const idx = Math.max(0, lessons.findIndex((l) => l._id === currentId));
  const lesson = lessons[idx];
  const prev = lessons[idx - 1];
  const next = lessons[idx + 1];
  const isDone = done.has(String(lesson._id));
  const percent = Math.min(100, Math.round(data.progress?.percent || 0));
  const embed = getEmbed(lesson.videoUrl);

  const toggleComplete = async () => {
    try {
      setSaving(true);
      setNotice("");
      const res = await saveProgress(courseId, lesson._id, !isDone);
      setData((p) => ({ ...p, progress: res.progress }));
      if (!isDone && next) setCurrentId(next._id);
    } catch (err) {
      setNotice(getErrorMessage(err, "Could not save progress"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container-x py-6">
      {/* Top bar */}
      <div className="flex flex-col gap-4 border-b border-stone-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <Link
            to="/my-learning"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-brand-700"
          >
            <ArrowLeft size={16} /> My learning
          </Link>
          <h1 className="mt-1 truncate text-xl font-bold sm:text-2xl">{data.course.title}</h1>
        </div>
        <div className="w-full sm:w-72">
          <div className="mb-1.5 flex justify-between text-xs font-medium text-stone-600">
            <span>{done.size} of {lessons.length} lessons done</span>
            <span>{percent}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-stone-200">
            <div
              className="h-full rounded-full bg-brand-600 transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>

      {percent === 100 && (
        <div className="mt-5 flex flex-col gap-3 rounded-xl border border-brand-200 bg-brand-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-semibold text-brand-900">
            🎉 Course completed! Take the quiz and claim your certificate.
          </p>
          <div className="flex gap-2">
            <Button to={`/courses/${courseId}/quiz`} variant="outline" size="sm">
              <ClipboardList size={16} /> Quiz
            </Button>
            <Button to={`/certificate/${courseId}`} size="sm">
              <Award size={16} /> Certificate
            </Button>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_22rem]">
        {/* Player */}
        <div className="min-w-0">
          <div className="aspect-video overflow-hidden rounded-xl bg-black">
            {embed?.type === "iframe" && (
              <iframe
                key={lesson._id}
                src={embed.src}
                title={lesson.title}
                className="h-full w-full"
                allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            )}
            {embed?.type === "video" && (
              <video key={lesson._id} src={embed.src} controls className="h-full w-full" />
            )}
            {embed?.type === "link" && (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-white">
                <PlayCircle size={48} />
                <a
                  href={embed.src}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold hover:bg-brand-700"
                >
                  Open lesson video <ExternalLink size={16} />
                </a>
              </div>
            )}
            {!embed && (
              <div className="flex h-full items-center justify-center text-stone-400">
                No video for this lesson
              </div>
            )}
          </div>

          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm text-stone-500">
                Lesson {idx + 1} of {lessons.length}
                {lesson.duration ? ` · ${lesson.duration}` : ""}
              </p>
              <h2 className="mt-1 text-2xl font-bold">{lesson.title}</h2>
            </div>
            <Button
              onClick={toggleComplete}
              disabled={saving}
              variant={isDone ? "outline" : "primary"}
              className="shrink-0"
            >
              {isDone ? (
                <>
                  <CheckCircle2 size={18} className="text-emerald-600" /> Completed (undo)
                </>
              ) : (
                "Mark as complete"
              )}
            </Button>
          </div>

          {notice && (
            <p className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{notice}</p>
          )}

          <div className="mt-5 flex justify-between gap-3">
            <Button
              variant="outline"
              size="sm"
              disabled={!prev}
              onClick={() => setCurrentId(prev._id)}
            >
              <ChevronLeft size={16} /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!next}
              onClick={() => setCurrentId(next._id)}
            >
              Next <ChevronRight size={16} />
            </Button>
          </div>

          {lesson.notes && (
            <div className="mt-8 rounded-xl border border-stone-200 bg-white p-6">
              <h3 className="font-bold">Lesson notes</h3>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-stone-700">
                {lesson.notes}
              </p>
            </div>
          )}
        </div>

        {/* Playlist */}
        <aside className="min-w-0">
          <div className="overflow-hidden rounded-xl border border-stone-200 bg-white lg:sticky lg:top-24">
            <div className="border-b border-stone-200 px-5 py-4">
              <h3 className="font-bold">Course content</h3>
            </div>
            <div className="max-h-[32rem] overflow-y-auto">
              {data.sections.map((s) => (
                <div key={s._id}>
                  <p className="bg-stone-50 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-stone-500">
                    {s.title}
                  </p>
                  {(s.lessons || []).map((l) => {
                    const active = l._id === lesson._id;
                    const finished = done.has(String(l._id));
                    return (
                      <button
                        key={l._id}
                        type="button"
                        onClick={() => setCurrentId(l._id)}
                        className={`flex w-full items-start gap-3 px-5 py-3 text-left text-sm transition-colors ${
                          active ? "bg-brand-50 text-brand-900" : "hover:bg-stone-50"
                        }`}
                      >
                        {finished ? (
                          <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" />
                        ) : (
                          <Circle size={18} className="mt-0.5 shrink-0 text-stone-300" />
                        )}
                        <span className={active ? "font-semibold" : ""}>{l.title}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}