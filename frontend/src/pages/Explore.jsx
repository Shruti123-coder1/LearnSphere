import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import CourseCard from "../components/CourseCard";
import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";
import Button from "../components/Button";
import { getCourses, getCategories } from "../services/courseService";
import { getErrorMessage } from "../services/api";
import { CATEGORIES, LEVELS } from "../utils/constants";

const PAGE_SIZE = 9;

export default function Explore() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") || "";
  const category = searchParams.get("category") || "All";
  const level = searchParams.get("level") || "All";
  const page = Number(searchParams.get("page") || 1);

  const [search, setSearch] = useState(q);
  const [categories, setCategories] = useState(CATEGORIES);
  const [courses, setCourses] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const update = (changes) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(changes).forEach(([k, v]) => {
        if (v && v !== "All") next.set(k, v);
        else next.delete(k);
      });
      if (!("page" in changes)) next.delete("page");
      return next;
    });
  };

  useEffect(() => {
    getCategories()
      .then(({ categories: list }) => {
        if (list?.length) setCategories(["All", ...list.map((c) => c.name)]);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setSearch(q);
  }, [q]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (search.trim() !== q) update({ q: search.trim() });
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError("");
    getCourses({
      q: q || undefined,
      category: category !== "All" ? category : undefined,
      level: level !== "All" ? level : undefined,
      page,
      limit: PAGE_SIZE,
    })
      .then((d) => {
        if (ignore) return;
        setCourses(d.courses);
        setTotal(d.total);
        setPages(d.pages || 1);
      })
      .catch((err) => !ignore && setError(getErrorMessage(err, "Could not load courses")))
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, [q, category, level, page, reloadKey]);

  const hasFilters = q || category !== "All" || level !== "All";

  const clearAll = () => {
    setSearch("");
    setSearchParams({});
  };

  return (
    <>
      <section className="border-b border-stone-200 bg-white">
        <div className="container-x py-10">
          <h1 className="text-3xl font-bold sm:text-4xl">Explore courses</h1>
          <p className="mt-2 text-stone-600">
            Find the right course by topic, category or skill level.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search courses, e.g. React, Python"
                className="w-full rounded-lg border border-stone-300 bg-white py-3 pl-10 pr-10 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-ink"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <select
              value={level}
              onChange={(e) => update({ level: e.target.value })}
              className="rounded-lg border border-stone-300 bg-white px-4 py-3 text-sm outline-none focus:border-brand-600"
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l === "All" ? "All levels" : l}
                </option>
              ))}
            </select>
          </div>

          <div className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => update({ category: c })}
                className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                  category === c
                    ? "border-brand-600 bg-brand-600 text-white"
                    : "border-stone-300 bg-white text-stone-700 hover:border-brand-600"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="container-x py-10">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-stone-600">
            {loading ? "Searching..." : `${total} course${total === 1 ? "" : "s"} found`}
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={clearAll}
              className="text-sm font-semibold text-brand-700 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>

        {loading ? (
          <Loading text="Loading courses..." />
        ) : error ? (
          <EmptyState
            title="Something went wrong"
            message={error}
            action={<Button onClick={() => setReloadKey((k) => k + 1)}>Try again</Button>}
          />
        ) : courses.length === 0 ? (
          <EmptyState
            title="No courses found"
            message="Try a different keyword or remove some filters."
            action={hasFilters && <Button onClick={clearAll}>Clear filters</Button>}
          />
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <CourseCard key={course._id} course={course} />
              ))}
            </div>

            {pages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => update({ page: String(page - 1) })}
                >
                  <ChevronLeft size={16} /> Previous
                </Button>
                <span className="text-sm text-stone-600">
                  Page {page} of {pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pages}
                  onClick={() => update({ page: String(page + 1) })}
                >
                  Next <ChevronRight size={16} />
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}