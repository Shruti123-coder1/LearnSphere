import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { GraduationCap, Menu, X, ChevronDown, LogOut, LayoutDashboard } from "lucide-react";
import Button from "./Button";
import { useAuth, roleHome } from "../context/AuthContext";
import { APP_NAME } from "../utils/constants";

const roleLinks = {
  student: [
    { to: "/my-learning", label: "My learning" },
    { to: "/wishlist", label: "Wishlist" },
    { to: "/payments", label: "Payments" },
  ],
  instructor: [{ to: "/instructor", label: "Dashboard" }],
  admin: [{ to: "/admin", label: "Admin" }],
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const menuRef = useRef(null);

  useEffect(() => {
    setOpen(false);
    setMenu(false);
  }, [pathname]);

  useEffect(() => {
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenu(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const links = [
    { to: "/", label: "Home" },
    { to: "/explore", label: "Explore" },
    ...(user ? roleLinks[user.role] || [] : []),
  ];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const linkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors ${
      isActive ? "text-brand-700" : "text-stone-600 hover:text-ink"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-paper/95 backdrop-blur">
      <div className="container-x flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
            <GraduationCap size={20} />
          </span>
          <span className="text-lg font-bold tracking-tight">{APP_NAME}</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === "/"} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenu((v) => !v)}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-stone-100"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                  {user.name?.charAt(0).toUpperCase()}
                </span>
                <span className="max-w-32 truncate text-sm font-medium">{user.name}</span>
                <ChevronDown size={16} className="text-stone-500" />
              </button>

              {menu && (
                <div className="absolute right-0 mt-2 w-60 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg">
                  <div className="border-b border-stone-100 px-4 py-3">
                    <p className="truncate text-sm font-semibold">{user.name}</p>
                    <p className="truncate text-xs text-stone-500">{user.email}</p>
                    <span className="mt-2 inline-block rounded bg-brand-50 px-2 py-0.5 text-xs font-semibold capitalize text-brand-700">
                      {user.role}
                    </span>
                  </div>
                  <Link
                    to={roleHome(user.role)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-stone-50"
                  >
                    <LayoutDashboard size={16} /> Go to dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-700 hover:bg-red-50"
                  >
                    <LogOut size={16} /> Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Button to="/login" variant="ghost" size="sm">
                Log in
              </Button>
              <Button to="/register" size="sm">
                Sign up
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          className="rounded-lg p-2 text-ink hover:bg-stone-100 md:hidden"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-stone-200 bg-paper md:hidden">
          <div className="container-x flex flex-col gap-1 py-4">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/"}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2.5 text-sm font-medium ${
                    isActive ? "bg-brand-50 text-brand-700" : "text-stone-700"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
            {user ? (
              <div className="mt-3 border-t border-stone-200 pt-3">
                <p className="px-3 text-sm font-semibold">{user.name}</p>
                <p className="px-3 text-xs capitalize text-stone-500">{user.role}</p>
                <Button variant="outline" className="mt-3 w-full" onClick={handleLogout}>
                  <LogOut size={16} /> Log out
                </Button>
              </div>
            ) : (
              <div className="mt-3 flex gap-2">
                <Button to="/login" variant="outline" className="flex-1">
                  Log in
                </Button>
                <Button to="/register" className="flex-1">
                  Sign up
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}