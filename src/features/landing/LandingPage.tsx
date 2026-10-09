import { Button, TextField } from "@mui/material";
import { BarChart3, CalendarDays, Coffee, Download, Lock, Timer, WifiOff } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSeo } from "../../components/common/useSeo";
import { formatDuration } from "../../services/workTimeCalculation.service";
import faq from "./faq.json";

const FEATURES = [
  { i: Timer, t: "Work time tracker", d: "Start from any moment with one tap. No fixed office start time — your day begins when you say so." },
  { i: Coffee, t: "Break tracker", d: "Track unlimited breaks. Break time shifts your finish time automatically." },
  { i: CalendarDays, t: "Attendance tracker", d: "Monthly calendar with full days, half days, leaves and week-offs at a glance." },
  { i: BarChart3, t: "Work hours report", d: "Required, worked, break, overtime and shortfall hours for every month." },
  { i: WifiOff, t: "Offline-first PWA", d: "Installable and fully functional without internet, powered by IndexedDB." },
  { i: Lock, t: "Private by design", d: "No servers, no sign-up, no tracking. Export or erase your data anytime." },
];

function Calculator() {
  const [start, setStart] = useState("08:17"), [h, setH] = useState(8), [m, setM] = useState(30), [brk, setBrk] = useState(30);
  const out = useMemo(() => {
    const [sh, sm] = start.split(":").map(Number); if (Number.isNaN(sh)) return "—";
    const t = (sh * 60 + sm + h * 60 + m + brk) % 1440;
    return new Date(2000, 0, 1, Math.floor(t / 60), t % 60).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }, [start, h, m, brk]);
  const n = (f: (v: number) => void) => (e: React.ChangeEvent<HTMLInputElement>) => f(Math.max(0, Number(e.target.value) || 0));
  return (
    <div className="rounded-3xl border border-line bg-surface p-6 shadow-sm" role="group" aria-labelledby="calc-h">
      <h2 id="calc-h" className="text-xl font-semibold">Work hours calculator</h2>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <TextField label="Start time" type="time" value={start} onChange={(e) => setStart(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} className="col-span-2" />
        <TextField label="Hours" type="number" value={h} onChange={n(setH)} /><TextField label="Minutes" type="number" value={m} onChange={n(setM)} />
        <TextField label="Break (min)" type="number" value={brk} onChange={n(setBrk)} className="col-span-2" />
      </div>
      <p className="mt-5 text-sm text-muted">Expected finish for {formatDuration(h * 60 + m)} of work + {brk}m break</p>
      <p className="tabular text-4xl font-bold text-brand" aria-live="polite">{out}</p>
    </div>
  );
}

export default function LandingPage() {
  useSeo({ title: "HourCap — Work Time Tracker, Work Hours Calculator & Break Timer", description: "Free offline work time tracker. Calculate work hours, track breaks and attendance, get finish-time reminders and monthly reports. No sign-up, data stays on your device.", path: "/" });
  return (
    <div className="min-h-screen">
      <a href="#main" className="skip">Skip to content</a>
      <header className="sticky top-0 z-30 border-b border-line bg-app/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold text-brand"><img src="/favicon.svg" alt="" width={28} height={28} />HourCap</Link>
          <nav aria-label="Main" className="flex items-center gap-4 text-sm"><a href="#features" className="hidden sm:inline">Features</a><a href="#how" className="hidden sm:inline">How it works</a><a href="#faq" className="hidden sm:inline">FAQ</a>
            <Button component={Link} to="/app" variant="contained" size="small">Open app</Button></nav>
        </div>
      </header>
      <main id="main">
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-2 md:py-24">
          <div className="space-y-6">
            <p className="inline-block rounded-full bg-brand-soft px-3 py-1 text-sm font-medium text-brand">Free · Offline · Private</p>
            <h1 className="text-4xl leading-tight font-bold md:text-5xl">The work time tracker that starts when <span className="text-brand">you</span> do</h1>
            <p className="text-lg text-muted">HourCap is a work hours calculator, break tracker and attendance tracker in one calm, installable app. Press <strong>CAPTURE FROM NOW</strong>, and know exactly when your required hours end.</p>
            <div className="flex flex-wrap gap-3"><Button component={Link} to="/app" variant="contained" size="large" startIcon={<Timer size={20} />}>Start tracking free</Button>
              <Button href="#how" variant="outlined" size="large">See how it works</Button></div>
            <p className="flex items-center gap-2 text-sm text-muted"><Download size={16} aria-hidden /> Installable on Windows, macOS, Android and iOS</p>
          </div>
          <Calculator />
        </section>

        <section id="features" className="bg-surface py-16"><div className="mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-bold">Everything you need for office hours tracking</h2>
          <p className="mt-2 max-w-2xl text-muted">A productivity timer for employees, developers, freelancers and remote or hybrid workers.</p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{FEATURES.map(({ i: I, t, d }) => (
            <li key={t}><article className="h-full rounded-2xl border border-line p-5"><I className="text-brand" aria-hidden /><h3 className="mt-3 text-lg font-semibold">{t}</h3><p className="mt-1 text-sm text-muted">{d}</p></article></li>))}</ul>
        </div></section>

        <section id="how" className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-3xl font-bold">How the employee work timer works</h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-4">{["Set your required daily hours, e.g. 8h 30m.", "Tap CAPTURE FROM NOW when you begin.", "Take breaks — each is recorded separately.", "Get reminders and a clear finish time."].map((s, i) => (
            <li key={s} className="rounded-2xl border border-line bg-surface p-5"><span className="grid h-8 w-8 place-items-center rounded-full bg-brand text-white">{i + 1}</span><p className="mt-3">{s}</p></li>))}</ol>
          <p className="mt-6 rounded-2xl bg-brand-soft p-4 font-medium">Expected completion = start time + required work + break time. <span className="text-muted">08:17 + 8h 30m + 30m break = 05:17 PM.</span></p>
        </section>

        <section className="bg-surface py-16"><div className="mx-auto max-w-6xl space-y-3 px-4">
          <h2 className="text-3xl font-bold">Built for how people actually work</h2>
          <p className="max-w-3xl text-muted">Use HourCap as a work hour calculator for flexible shifts, a timesheet-style attendance tracker for hybrid weeks, a break timer for deep-work sessions, or a personal office hours tracker that shows overtime and shortfall every month. It is a personal productivity timer — not employee surveillance software.</p>
          <ul className="flex flex-wrap gap-2 pt-2 text-sm">{["work time tracker", "work hours calculator", "employee work timer", "office hours tracker", "break tracker", "attendance tracker", "work hour calculator", "productivity timer", "overtime calculator", "monthly timesheet"].map((k) => <li key={k} className="rounded-full border border-line px-3 py-1">{k}</li>)}</ul>
        </div></section>

        <section id="faq" className="mx-auto max-w-3xl px-4 py-16">
          <h2 className="text-3xl font-bold">Frequently asked questions</h2>
          <div className="mt-6 divide-y divide-line rounded-2xl border border-line bg-surface">{faq.map((f) => (
            <details key={f.q} className="group p-5"><summary className="cursor-pointer list-none font-semibold marker:hidden">{f.q}</summary><p className="mt-2 text-muted">{f.a}</p></details>))}</div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20"><div className="rounded-3xl bg-brand p-10 text-center text-white">
          <h2 className="text-3xl font-bold">Know when your day ends — instantly</h2>
          <Button component={Link} to="/app" variant="contained" size="large" sx={{ mt: 3, bgcolor: "#fff", color: "#00695c", "&:hover": { bgcolor: "#e0f2f1" } }}>Open HourCap</Button></div></section>
      </main>
      <footer className="border-t border-line py-8 text-center text-sm text-muted">© {new Date().getFullYear()} HourCap · Local-first work time tracker · Your data never leaves your device.</footer>
    </div>
  );
}
