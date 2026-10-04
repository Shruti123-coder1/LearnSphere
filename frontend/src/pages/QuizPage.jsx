import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import Button from "../components/Button";
import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";
import { getQuiz, submitQuiz, getQuizResults } from "../services/courseService";
import { getErrorMessage } from "../services/api";

const fmt = (d) =>
  new Date(d).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function QuizPage() {
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [results, setResults] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let ignore = false;
    getQuiz(id)
      .then(({ quiz: q }) => {
        if (ignore) return;
        setQuiz(q);
        setAnswers(q ? new Array(q.questions.length).fill(null) : []);
      })
      .catch((err) => !ignore && setError(getErrorMessage(err, "Could not load the quiz")))
      .finally(() => !ignore && setLoading(false));
    getQuizResults(id)
      .then((d) => !ignore && setResults(d.results))
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, [id]);

  const choose = (qi, oi) => {
    setAnswers((a) => a.map((v, i) => (i === qi ? oi : v)));
    setFormError("");
  };

  const handleSubmit = async () => {
    if (answers.some((a) => a === null)) {
      return setFormError("Please answer every question before submitting.");
    }
    try {
      setSubmitting(true);
      const res = await submitQuiz(quiz._id, answers);
      setResult(res.result);
      getQuizResults(id)
        .then((d) => setResults(d.results))
        .catch(() => {});
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setFormError(getErrorMessage(err, "Could not submit the quiz"));
    } finally {
      setSubmitting(false);
    }
  };

  const retake = () => {
    setResult(null);
    setAnswers(new Array(quiz.questions.length).fill(null));
  };

  if (loading) return <Loading fullPage text="Loading quiz..." />;

  const back = (
    <Link
      to={`/learn/${id}`}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-brand-700"
    >
      <ArrowLeft size={16} /> Back to course
    </Link>
  );

  if (error) {
    return (
      <div className="container-x py-16">
        <EmptyState
          title="Quiz unavailable"
          message={error}
          action={<Button to={`/courses/${id}`}>Go to course page</Button>}
        />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="container-x py-16">
        <EmptyState
          title="No quiz for this course"
          message="The instructor hasn't added a quiz yet."
          action={<Button to={`/learn/${id}`}>Back to course</Button>}
        />
      </div>
    );
  }

  return (
    <div className="container-x max-w-4xl py-10">
      {back}
      <h1 className="mt-3 text-3xl font-bold">{quiz.title}</h1>
      <p className="mt-2 text-stone-600">
        {quiz.questions.length} questions · Passing score {quiz.passingScore}%
      </p>

      {result ? (
        <div className="mt-8 rounded-xl border border-stone-200 bg-white p-8 text-center">
          {result.passed ? (
            <CheckCircle2 size={56} className="mx-auto text-emerald-600" />
          ) : (
            <XCircle size={56} className="mx-auto text-red-600" />
          )}
          <h2 className="mt-4 text-2xl font-bold">
            {result.passed ? "Well done, you passed!" : "Not passed this time"}
          </h2>
          <p className="mt-4 font-display text-5xl font-bold text-brand-700">
            {Math.round(result.percentage)}%
          </p>
          <p className="mt-2 text-stone-600">
            You scored {result.score} out of {result.total}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button variant="outline" onClick={retake}>
              <RotateCcw size={16} /> Retake quiz
            </Button>
            <Button to={`/learn/${id}`}>Back to course</Button>
          </div>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {quiz.questions.map((q, qi) => (
            <div key={q._id} className="rounded-xl border border-stone-200 bg-white p-6">
              <p className="font-semibold">
                <span className="mr-2 text-brand-700">Q{qi + 1}.</span>
                {q.question}
              </p>
              <div className="mt-4 space-y-2.5">
                {q.options.map((opt, oi) => (
                  <label
                    key={oi}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition ${
                      answers[qi] === oi
                        ? "border-brand-600 bg-brand-50"
                        : "border-stone-200 hover:border-stone-400"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q-${qi}`}
                      checked={answers[qi] === oi}
                      onChange={() => choose(qi, oi)}
                      className="h-4 w-4 accent-brand-600"
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          ))}

          {formError && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{formError}</p>
          )}
          <Button size="lg" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit quiz"}
          </Button>
        </div>
      )}

      {results.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold">Your previous attempts</h2>
          <div className="mt-4 divide-y divide-stone-200 overflow-hidden rounded-xl border border-stone-200 bg-white">
            {results.map((r) => (
              <div
                key={r._id}
                className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5 text-sm"
              >
                <span className="text-stone-600">{fmt(r.attemptedAt)}</span>
                <span className="font-semibold">
                  {r.score}/{r.total} · {Math.round(r.percentage)}%
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    r.passed ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                  }`}
                >
                  {r.passed ? "Passed" : "Failed"}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}