import { SearchX } from "lucide-react";

export default function EmptyState({
  title = "Nothing found",
  message = "Try changing your search or filters.",
  action,
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <SearchX size={26} />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-stone-500">{message}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}