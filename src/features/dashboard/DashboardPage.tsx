import { Button, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControlLabel, LinearProgress, Switch } from "@mui/material";
import { Coffee, Play, Square } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSeo } from "../../components/common/useSeo";
import { useSettings } from "../../hooks/useSettings";
import { useWorkSession } from "../../hooks/useWorkSession";
import { formatClock, formatDuration } from "../../services/workTimeCalculation.service";
import { formatLongDate, formatTime, toDateKey } from "../../utils/formatDate";
import { Stat } from "./Stat";

export default function DashboardPage() {
  useSeo({ title: "Today — HourCap", description: "Today's work timer.", path: "/app", noindex: true });
  const { settings, loading: sl } = useSettings();
  const w = useWorkSession(settings), nav = useNavigate();
  const [half, setHalf] = useState(false), [confirmEnd, setConfirmEnd] = useState(false), [cfg, setCfg] = useState(false);
  if (sl || w.loading || !settings) return <div role="status" className="animate-pulse space-y-4"><div className="h-8 w-48 rounded bg-line" /><div className="h-72 rounded-3xl bg-line" /></div>;
  const { session: s, view: v } = w;
  const state = !s ? "NOT STARTED" : s.endedAt ? "WORK COMPLETED" : s.status === "ON_BREAK" ? "ON BREAK" : "WORKING";
  const done = !!s?.endedAt, onBreak = s?.status === "ON_BREAK", reached = !!s && !done && !!v && v.remaining === 0;
  const pct = s && v ? Math.min(100, (v.worked / s.requiredMinutes) * 100) : 0;
  const tryStart = () => (w.configured ? w.start(half) : setCfg(true));

  const Actions = (
    <div className="sticky bottom-20 z-10 flex flex-col gap-2 rounded-2xl bg-app/90 p-2 backdrop-blur sm:flex-row md:static md:bg-transparent md:p-0">
      {!s && <Button size="large" variant="contained" startIcon={<Play size={20} />} onClick={tryStart} fullWidth sx={{ py: 1.8, fontSize: 18 }}>CAPTURE FROM NOW</Button>}
      {s && !done && !onBreak && <>
        <Button size="large" variant="contained" startIcon={<Coffee size={20} />} onClick={() => w.takeBreak()} fullWidth sx={{ py: 1.5 }}>TAKE BREAK</Button>
        <Button size="large" variant="outlined" color="error" startIcon={<Square size={18} />} onClick={() => (v && v.remaining > 0 ? setConfirmEnd(true) : w.endDay())} fullWidth sx={{ py: 1.5 }}>END WORK DAY</Button>
      </>}
      {onBreak && <Button size="large" variant="contained" startIcon={<Play size={20} />} onClick={() => w.resume()} fullWidth sx={{ py: 1.8 }}>RESUME WORK</Button>}
    </div>
  );

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div><p className="text-sm text-muted">Today</p><h1 className="text-2xl font-bold">{formatLongDate(toDateKey())}</h1></div>
        <Chip label={state} color={done ? "default" : onBreak ? "warning" : s ? "primary" : "default"} role="status" sx={{ fontWeight: 700 }} />
      </header>

      <section aria-label="Work timer" className="rounded-3xl border border-line bg-surface p-6 md:p-8">
        {!s ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-muted">Required work</p>
            <p className="tabular text-5xl font-bold">{settings.dailyRequiredMinutes ? formatDuration(half ? settings.halfDayMinutes || settings.dailyRequiredMinutes / 2 : settings.dailyRequiredMinutes) : "—"}</p>
            <p className="text-muted">Your day starts the moment you press the button — no fixed office hours.</p>
            <FormControlLabel control={<Switch checked={half} onChange={(e) => setHalf(e.target.checked)} />} label="Half-day" />
          </div>
        ) : done && v ? (
          <div className="text-center"><p className="text-sm text-muted">{v.shortfall > 0 ? "Shortfall" : "Overtime"}</p><p className="tabular text-5xl font-bold">{formatDuration(v.shortfall > 0 ? v.shortfall : v.overtime)}</p></div>
        ) : v && (
          <div className="space-y-3 text-center">
            <p className="text-sm text-muted">{onBreak ? "Break duration" : reached ? "Required work complete · overtime" : "Remaining"}</p>
            <p className="tabular text-5xl font-bold md:text-6xl" aria-live="off">{formatClock(onBreak ? v.currentBreakMin : reached ? v.overtime : v.remaining)}</p>
            <LinearProgress variant="determinate" value={pct} aria-label="Work progress" sx={{ height: 8, borderRadius: 4 }} />
          </div>
        )}
      </section>

      {s && v && (
        <section aria-label="Details" className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Worked" value={formatDuration(v.worked)} />
          <Stat label={done ? "Completed" : "Expected completion"} value={formatTime(done ? s.endedAt : v.completion)} />
          <Stat label="Started" value={formatTime(s.startedAt)} />
          <Stat label={`Break${v.breakCount > 1 ? `s (${v.breakCount})` : ""}`} value={formatDuration(v.breakMin)} />
          <Stat label="Required" value={formatDuration(s.requiredMinutes)} />
          {done && <Stat label="Overtime" value={formatDuration(v.overtime)} />}
          {done && v.shortfall > 0 && <Stat label="Shortfall" value={formatDuration(v.shortfall)} />}
        </section>
      )}
      {done ? <Button component={Link} to="/app/calendar" variant="outlined">View calendar</Button> : Actions}
      <p className="text-xs text-muted">Reminders use your device’s notification permission. Delivery while the app is closed or the device sleeps depends on browser/PWA behavior; times are always recalculated from timestamps.</p>

      <Dialog open={cfg} onClose={() => setCfg(false)}><DialogTitle>Configuration missing</DialogTitle>
        <DialogContent><DialogContentText>Please configure your required working hours.</DialogContentText></DialogContent>
        <DialogActions><Button onClick={() => setCfg(false)}>Later</Button><Button variant="contained" onClick={() => nav("/app/settings")}>GO TO SETTINGS</Button></DialogActions></Dialog>
      <Dialog open={confirmEnd} onClose={() => setConfirmEnd(false)}><DialogTitle>End work day?</DialogTitle>
        <DialogContent><DialogContentText>You have {v ? formatDuration(v.remaining) : ""} of required work remaining. Are you sure you want to end the work day?</DialogContentText></DialogContent>
        <DialogActions><Button onClick={() => setConfirmEnd(false)}>Continue Working</Button><Button color="error" onClick={() => { setConfirmEnd(false); w.endDay(); }}>End Anyway</Button></DialogActions></Dialog>
    </div>
  );
}
