import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearSession, getStoredSession } from "../services/auth";

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/orders", label: "Orders" },
  { to: "/support", label: "Support" }
];

export function RootLayout() {
  const navigate = useNavigate();
  const session = getStoredSession();

  const onLogout = () => {
    clearSession();
    navigate("/login", { replace: true });
  };

  return (
    <div className="grid min-h-screen grid-cols-1 bg-slate-50 text-slate-900 antialiased md:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="flex flex-col gap-6 border-b border-slate-200 bg-white px-[18px] py-[18px] md:border-r md:border-b-0 md:py-6">
        <div className="grid gap-1">
          <div className="text-[1.05rem] font-bold">Customer Portal</div>
          {session !== undefined && <div className="text-sm text-slate-500">{session.user.name}</div>}
        </div>
        <nav className="grid grid-cols-1 gap-2 sm:grid-cols-3 md:grid-cols-1" aria-label="Primary navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                [
                  "rounded-lg px-3 py-2.5 text-center no-underline transition-colors md:text-left",
                  isActive ? "bg-cyan-800 text-white" : "text-slate-600 hover:bg-slate-100"
                ].join(" ")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button
          className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 font-bold text-slate-600 transition-colors hover:bg-slate-100 md:mt-auto"
          type="button"
          onClick={onLogout}
        >
          Sign out
        </button>
      </aside>
      <main className="w-full max-w-6xl px-[18px] py-[22px] md:px-8 md:py-8">
        <Outlet />
      </main>
    </div>
  );
}
