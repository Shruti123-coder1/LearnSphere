export default function Loading({ text = "Loading...", fullPage = false }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${
        fullPage ? "min-h-[60vh]" : "py-16"
      }`}
    >
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-stone-200 border-t-brand-600" />
      <p className="text-sm font-medium text-stone-500">{text}</p>
    </div>
  );
}