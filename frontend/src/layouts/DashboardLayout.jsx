import { Link, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, PlusCircle, Users, BookOpen, CreditCard, Tags } from "lucide-react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

const menus = {
  instructor: [
    { to: "/instructor", label: "Dashboard", icon: LayoutDashboard },
    { to: "/instructor/courses/new", label: "New course", icon: PlusCircle },
  ],
  admin: [
    { to: "/admin?tab=overview", label: "Overview", icon: LayoutDashboard },
    { to: "/admin?tab=users", label: "Users", icon: Users },
    { to: "/admin?tab=courses", label: "Courses", icon: BookOpen },
    { to: "/admin?tab=payments", label: "Payments", icon: CreditCard },
    { to: "/admin?tab=categories", label: "Categories", icon: Tags },
  ],
};

export default function DashboardLayout() {
  const { user } = useAuth();
  const { pathname, search } = useLocation();
  const items = menus[user?.role] || [];
  const current = pathname + search;

  const isActive = (to) => {
    if (to.includes("?")) {
      return current === to || (to.endsWith("=overview") && current === "/admin");
    }
    return pathname === to;
  };

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <div className="container-x grid gap-6 py-8 lg:grid-cols-[15rem_1fr]">
        <aside>
          <p className="mb-3 hidden px-3 text-xs font-semibold uppercase tracking-wider text-stone-500 lg:block">
            {user?.role} panel
          </p>
          <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
            {items.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${
                  isActive(to)
                    ? "bg-brand-600 text-white"
                    : "bg-white text-stone-700 hover:bg-brand-50 lg:bg-transparent"
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}