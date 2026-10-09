import { BottomNavigation, BottomNavigationAction, Paper } from "@mui/material";
import { BarChart3, CalendarDays, Clock, Plane, Settings } from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

const NAV = [
  { to: "/app", label: "Today", icon: Clock, end: true },
  { to: "/app/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/app/reports", label: "Reports", icon: BarChart3 },
  { to: "/app/leaves", label: "Leaves", icon: Plane },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

export default function AppShell() {
  const { pathname } = useLocation(), nav = useNavigate();
  const current = NAV.findIndex((n) => (n.end ? pathname === n.to : pathname.startsWith(n.to)));
  return (
    <div className="min-h-screen md:flex">
      <a href="#main" className="skip">Skip to content</a>
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-1 border-r border-line bg-surface p-4 md:flex">
        <NavLink to="/" className="mb-6 flex items-center gap-2 px-2 text-xl font-bold text-brand"><img src="/favicon.svg" alt="" width={28} height={28} />HourCap</NavLink>
        <nav aria-label="Primary" className="flex flex-col gap-1">
          {NAV.map(({ to, label, icon: I, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? "bg-brand-soft text-brand" : "text-muted hover:bg-brand-soft/60"}`}>
              <I size={20} aria-hidden /> {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-28 md:px-8 md:pb-10"><Outlet /></main>
      <Paper component="nav" aria-label="Primary" square elevation={8} className="fixed inset-x-0 bottom-0 z-40 md:hidden" sx={{ pb: "env(safe-area-inset-bottom)" }}>
        <BottomNavigation showLabels value={current < 0 ? false : current} onChange={(_, v) => nav(NAV[v].to)}>
          {NAV.map(({ label, icon: I }) => <BottomNavigationAction key={label} label={label} icon={<I size={20} aria-hidden />} sx={{ minWidth: 0 }} />)}
        </BottomNavigation>
      </Paper>
    </div>
  );
}
