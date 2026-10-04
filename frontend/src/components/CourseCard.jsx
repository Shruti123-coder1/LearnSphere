import { useState } from "react";
import { Link } from "react-router-dom";
import { Star, Clock, PlayCircle, BookOpen } from "lucide-react";
import { formatPrice } from "../utils/constants";
import { getCourseImage, getCategoryImage } from "../utils/courseImages";

export default function CourseCard({ course }) {
  // 0 = course's own thumbnail, 1 = category image, 2 = icon fallback
  const [stage, setStage] = useState(0);

  const id = course._id || course.id;
  const instructorName =
    typeof course.instructor === "string" ? course.instructor : course.instructor?.name;
  const rating = Number(course.rating || 0);
  const reviewCount = Number(course.reviewCount ?? course.reviews ?? 0);
  const lessonCount = course.lessonCount ?? course.lessons;

  const src = stage === 0 ? getCourseImage(course) : getCategoryImage(course);

  const onImgError = () => setStage((s) => Math.min(s + 1, 2));

  return (
    <Link
      to={`/courses/${id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-white transition duration-200 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative aspect-video overflow-hidden bg-stone-200">
        {stage >= 2 ? (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-100 to-brand-200 text-brand-700">
            <BookOpen size={36} />
          </div>
        ) : (
          <img
            key={stage}
            src={src}
            alt={course.title}
            loading="lazy"
            onError={onImgError}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        )}
        {course.category && (
          <span className="absolute left-3 top-3 rounded bg-white/95 px-2 py-1 text-xs font-semibold text-stone-800">
            {course.category}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 text-base font-bold leading-snug group-hover:text-brand-700">
          {course.title}
        </h3>
        {instructorName && <p className="mt-1 text-sm text-stone-500">{instructorName}</p>}

        <div className="mt-3 flex items-center gap-1.5 text-sm">
          {rating > 0 ? (
            <>
              <Star size={15} className="fill-amber-400 text-amber-400" />
              <span className="font-semibold">{rating.toFixed(1)}</span>
              <span className="text-stone-400">({reviewCount.toLocaleString("en-IN")})</span>
            </>
          ) : (
            <span className="text-stone-400">No ratings yet</span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500">
          {course.duration && (
            <span className="flex items-center gap-1">
              <Clock size={14} /> {course.duration}
            </span>
          )}
          {lessonCount > 0 && (
            <span className="flex items-center gap-1">
              <PlayCircle size={14} /> {lessonCount} lessons
            </span>
          )}
          {course.level && <span>{course.level}</span>}
        </div>

        <div className="mt-auto flex items-center justify-between pt-5">
          <span
            className={`text-lg font-bold ${
              !course.price ? "text-emerald-700" : "text-ink"
            }`}
          >
            {formatPrice(course.price)}
          </span>
          <span className="text-sm font-semibold text-brand-600">View course →</span>
        </div>
      </div>
    </Link>
  );
}