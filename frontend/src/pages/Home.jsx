import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  ArrowRight,
  Globe,
  Database,
  Terminal,
  Palette,
  ShieldCheck,
  Brain,
  Cloud,
  PlayCircle,
  Award,
} from "lucide-react";
import Button from "../components/Button";
import CourseCard from "../components/CourseCard";
import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";
import { getCourses } from "../services/courseService";
import { getErrorMessage } from "../services/api";
import { CATEGORIES } from "../utils/constants";

const categoryIcons = {
  "Web Development": Globe,
  "Data Science": Database,
  Programming: Terminal,
  "UI/UX Design": Palette,
  Cybersecurity: ShieldCheck,
  "AI & Machine Learning": Brain,
  "Cloud & DevOps": Cloud,
};

const stats = [
  { value: "50+", label: "Expert led courses" },
  { value: "12,000+", label: "Active learners" },
  { value: "30+", label: "Industry instructors" },
  { value: "4.7/5", label: "Average course rating" },
];

const steps = [
  {
    icon: Search,
    title: "Find your course",
    text: "Search by topic, category or level and pick a path that matches your goal.",
  },
  {
    icon: PlayCircle,
    title: "Learn at your pace",
    text: "Watch lessons, take quizzes and track your progress. Resume anytime.",
  },
  {
    icon: Award,
    title: "Earn a certificate",
    text: "Complete every lesson and download a certificate for your resume.",
  },
];

export default function Home() {
  const [query, setQuery] = useState("");
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let ignore = false;
    getCourses({ limit: 6 })
      .then((d) => !ignore && setFeatured(d.courses))
      .catch((err) => !ignore && setError(getErrorMessage(err, "Could not load courses")))
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/explore?q=${encodeURIComponent(q)}` : "/explore");
  };

  return (
    <>
      {/* Hero */}
      <section className="border-b border-stone-200">
        <div className="container-x grid items-center gap-12 py-14 lg:grid-cols-2 lg:py-20">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-brand-600">
              Learn. Build. Get hired.
            </p>
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-[3.4rem]">
              Skills that move your career forward
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-stone-600">
              Practical courses taught by working developers. Learn real tools,
              build real projects and graduate with a certificate you can show
              recruiters.
            </p>

            <form
              onSubmit={handleSearch}
              className="mt-8 flex max-w-xl items-center overflow-hidden rounded-lg border border-stone-300 bg-white focus-within:border-brand-600"
            >
              <Search size={18} className="ml-4 shrink-0 text-stone-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What do you want to learn?"
                className="w-full bg-transparent px-3 py-3.5 text-sm outline-none"
              />
              <button
                type="submit"
                className="m-1.5 rounded-md bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
              >
                Search
              </button>
            </form>
            <p className="mt-4 text-sm text-stone-500">
              Popular: React, Python, DSA, UI/UX
            </p>
          </div>

          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1000&q=70"
              alt="Students learning together"
              onError={(e) => (e.currentTarget.style.display = "none")}
              className="h-80 w-full rounded-2xl bg-brand-100 object-cover sm:h-[26rem]"
            />
            <div className="absolute -bottom-5 left-4 rounded-xl border border-stone-200 bg-white px-5 py-4 shadow-lg sm:left-6">
              <p className="text-2xl font-bold">12,000+</p>
              <p className="text-xs text-stone-500">learners already enrolled</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-stone-200 bg-white">
        <div className="container-x grid grid-cols-2 gap-6 py-10 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-display text-3xl font-bold text-brand-700">{s.value}</p>
              <p className="mt-1 text-sm text-stone-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="container-x pt-16">
        <h2 className="text-3xl font-bold">Browse by category</h2>
        <p className="mt-2 text-stone-600">Pick a field and start learning today.</p>
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {CATEGORIES.slice(1).map((cat) => {
            const Icon = categoryIcons[cat] || Globe;
            return (
              <Link
                key={cat}
                to={`/explore?category=${encodeURIComponent(cat)}`}
                className="group flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-4 transition hover:border-brand-600 hover:shadow-md"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white">
                  <Icon size={20} />
                </span>
                <span className="text-sm font-semibold">{cat}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured courses */}
      <section className="container-x pt-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold">Featured courses</h2>
            <p className="mt-2 text-stone-600">Fresh picks from our instructors.</p>
          </div>
          <Link
            to="/explore"
            className="hidden items-center gap-1 text-sm font-semibold text-brand-700 hover:underline sm:flex"
          >
            View all <ArrowRight size={16} />
          </Link>
        </div>

        <div className="mt-8">
          {loading ? (
            <Loading text="Loading courses..." />
          ) : error ? (
            <EmptyState title="Courses unavailable" message={error} />
          ) : featured.length === 0 ? (
            <EmptyState
              title="No courses yet"
              message="Approved courses will appear here."
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((course) => (
                <CourseCard key={course._id} course={course} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="container-x pt-20">
        <h2 className="text-center text-3xl font-bold">How LearnSphere works</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.title} className="rounded-xl border border-stone-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <s.icon size={22} />
                </span>
                <span className="font-display text-4xl font-bold text-stone-200">
                  0{i + 1}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-bold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Instructor CTA */}
      <section className="container-x pt-20">
        <div className="flex flex-col items-start justify-between gap-6 rounded-2xl bg-ink px-8 py-12 text-white md:flex-row md:items-center md:px-12">
          <div className="max-w-xl">
            <h2 className="text-3xl font-bold">Share what you know</h2>
            <p className="mt-3 text-stone-300">
              Create courses, add lessons and reach thousands of students. Manage
              everything from your own instructor dashboard.
            </p>
          </div>
          <Button to="/register" size="lg">
            Become an instructor
          </Button>
        </div>
      </section>
    </>
  );
}