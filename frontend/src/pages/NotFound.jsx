import Button from "../components/Button";

export default function NotFound() {
  return (
    <div className="container-x flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="font-display text-8xl font-bold text-brand-600">404</p>
      <h1 className="mt-4 text-2xl font-bold">Page not found</h1>
      <p className="mt-2 max-w-md text-stone-600">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <div className="mt-8 flex gap-3">
        <Button to="/">Go home</Button>
        <Button to="/explore" variant="outline">
          Explore courses
        </Button>
      </div>
    </div>
  );
}