import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate, Link } from "react-router-dom";
import {
  LayoutDashboard, Scale, FileText, BadgeCheck, Bell, Search,
  Users, ShieldCheck, LogOut, Menu, X, Building2,
} from "lucide-react";
import { useAuth } from "../auth.jsx";
import { api } from "../api.js";

const roleLabel = { ADMIN: "Administrator", LMO: "Legal Metrology Officer", GATC: "Approved Test Centre", BUSINESS: "Business / User" };

function navFor(role) {
  const items = [
    { to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/app/instruments", label: "Instruments", icon: Scale },
    { to: "/app/applications", label: "Applications", icon: FileText },
    { to: "/app/verifications", label: "Verifications", icon: BadgeCheck },
    { to: "/app/certificates", label: "Certificates", icon: BadgeCheck },
    { to: "/app/alerts", label: "Alerts", icon: Bell, alert: true },
    { to: "/app/search", label: "Search Records", icon: Search },
  ];
  if (role === "ADMIN") items.push({ to: "/app/users", label: "Users & Roles", icon: Users });
  return items;
}

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    api.get("/alerts?unread=true").then((a) => setUnread(a.length)).catch(() => {});
    const t = setInterval(() => {
      api.get("/alerts?unread=true").then((a) => setUnread(a.length)).catch(() => {});
    }, 30000);
    return () => clearInterval(t);
  }, [user]);

  if (!user) return null;

  const items = navFor(user.role);

  const Sidebar = (
    <aside className="flex h-full w-64 flex-col bg-slate-900 text-slate-200">
      <div className="flex items-center gap-2.5 px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">LM</div>
        <div>
          <p className="font-semibold text-white">LM Verify</p>
          <p className="text-[11px] text-slate-400">Legal Metrology</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive ? "bg-brand-700 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`
            }
          >
            <it.icon size={18} />
            <span className="flex-1">{it.label}</span>
            {it.alert && unread > 0 && (
              <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">{unread}</span>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-slate-800 p-4">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-xs font-bold capitalize">
            {user.name?.[0] || "U"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{user.name}</p>
            <p className="truncate text-[11px] text-slate-400">{roleLabel[user.role]}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen">
      <div className="no-print hidden lg:block">{Sidebar}</div>

      {open && (
        <div className="no-print fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/60" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0">{Sidebar}</div>
          <button onClick={() => setOpen(false)} className="absolute left-[270px] top-4 rounded-lg bg-white p-1.5 text-slate-600 shadow">
            <X size={20} />
          </button>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:px-8">
          <div className="flex items-center gap-2">
            <button onClick={() => setOpen(true)} className="rounded-lg p-2 hover:bg-slate-100 lg:hidden">
              <Menu size={20} />
            </button>
            <div>
              <p className="text-sm font-semibold text-slate-900">Unified Verification & Digital Certification System</p>
              <p className="text-xs text-slate-500">Legal Metrology (India) · Act 2009 & Rules 2011</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {["LMO", "GATC"].includes(user.role) && (
              <button
                onClick={() => navigate("/app/verify")}
                className="hidden items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700 sm:inline-flex"
              >
                <BadgeCheck size={16} /> Field Verification
              </button>
            )}
            <Link to="/app/alerts" className="relative rounded-lg p-2 hover:bg-slate-100">
              <Bell size={19} className="text-slate-600" />
              {unread > 0 && (
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
              )}
            </Link>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
        <footer className="no-print border-t border-slate-200 px-4 py-3 text-center text-xs text-slate-400">
          LM Verify · Smart India Hackathon Solution · For demonstration purposes only
        </footer>
      </div>
    </div>
  );
}

export { roleLabel };