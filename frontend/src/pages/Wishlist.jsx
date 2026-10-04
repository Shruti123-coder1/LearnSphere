import { useEffect, useState } from "react";
import { Heart, X } from "lucide-react";
import Button from "../components/Button";
import CourseCard from "../components/CourseCard";
import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";
import { getWishlist, removeFromWishlist } from "../services/courseService";
import { getErrorMessage } from "../services/api";

export default function Wishlist() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getWishlist()
      .then((d) => setCourses(d.courses))
      .catch((err) => setError(getErrorMessage(err, "Could not load your wishlist")))
      .finally(() => setLoading(false));
  }, []);

  const remove = async (id) => {
    try {
      await removeFromWishlist(id);
      setCourses((list) => list.filter((c) => c._id !== id));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (loading) return <Loading fullPage text="Loading wishlist..." />;

  return (
    <div className="container-x py-10">
      <div className="flex items-center gap-3">
        <Heart className="text-brand-600" />
        <h1 className="text-3xl font-bold sm:text-4xl">My wishlist</h1>
      </div>
      <p className="mt-2 text-stone-600">Courses you saved for later.</p>

      {error && (
        <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      )}

      <div className="mt-8">
        {courses.length === 0 ? (
          <EmptyState
            title="Your wishlist is empty"
            message="Tap 'Add to wishlist' on any course to save it here."
            action={<Button to="/explore">Explore courses</Button>}
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <div key={c._id} className="relative">
                <CourseCard course={c} />
                <button
                  type="button"
                  onClick={() => remove(c._id)}
                  aria-label="Remove from wishlist"
                  className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-stone-700 shadow hover:bg-red-50 hover:text-red-700"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}