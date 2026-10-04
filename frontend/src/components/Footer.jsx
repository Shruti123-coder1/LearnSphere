import { Link } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import { APP_NAME } from "../utils/constants";

const columns = [
  {
    title: "Learn",
    links: [
      { to: "/explore", label: "All courses" },
      { to: "/explore?category=Web%20Development", label: "Web development" },
      { to: "/explore?category=Data%20Science", label: "Data science" },
    ],
  },
  {
    title: "Teach",
    links: [
      { to: "/register", label: "Become an instructor" },
      { to: "/login", label: "Instructor login" },
    ],
  },
  {
    title: "Account",
    links: [
      { to: "/login", label: "Log in" },
      { to: "/register", label: "Create account" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-20 bg-ink text-stone-300">
      <div className="container-x grid gap-10 py-14 md:grid-cols-4">
        <div>
          <Link to="/" className="flex items-center gap-2 text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600">
              <GraduationCap size={20} />
            </span>
            <span className="text-lg font-bold">{APP_NAME}</span>
          </Link>
          <p className="mt-4 text-sm leading-relaxed text-stone-400">
            Practical, project based courses to help students and professionals
            build job ready skills.
          </p>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">
              {col.title}
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-stone-400 transition hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-stone-800">
        <div className="container-x py-5 text-center text-xs text-stone-500">
          © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}