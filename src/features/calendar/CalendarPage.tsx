import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton } from "@mui/material";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { STATUS } from "../../components/common/format";
import { useSeo } from "../../components/common/useSeo";
import { useToast } from "../../components/common/ToastProvider";
import { useLive } from "../../hooks/useLive";
import { useSettings } from "../../hooks/useSettings";
import { attendanceService } from "../../services/attendance.service";
import { RuleError } from "../../services/workSession.service";
import { formatDuration } from "../../services/workTimeCalculation.service";
import type { DayInfo } from "../../types";
import { formatLongDate, formatTime, fromDateKey } from "../../utils/formatDate";
import LeaveDialog from "../leaves/LeaveDialog";

export default function CalendarPage() {
  useSeo({ title: "Calendar — HourCap", description: "Monthly attendance calendar.", path: "/app/calendar", noindex: true });
  const { settings } = useSettings(), toast = useToast();
  const [cur, setCur] = useState(() => { const n = new Date(); return { y: n.getFullYear(), m: n.getMonth() }; });
  const [sel, setSel] = useState<string | null>(null), [leave, setLeave] = useState(false);
  const { data: days } = useLive(() => (settings ? attendanceService.getMonth(cur.y, cur.m, settings) : Promise.resolve([] as DayInfo[])), [cur, settings]);
  const move = (d: number) => setCur(({ y, m }) => { const n = new Date(y, m + d, 1); return { y: n.getFullYear(), m: n.getMonth() }; });
  const lead = (new Date(cur.y, cur.m, 1).getDay() + 6) % 7;
  const day = days?.find((d) => d.date === sel);
  const act = async (fn: () => Promise<unknown>) => { try { await fn(); } catch (e) { toast(e instanceof RuleError ? e.message : "Unable to save. Your existing local data is still safe.", "error"); } };
  const Row = ({ k, v }: { k: string; v: string }) => <div className="flex justify-between border-b border-line py-2 text-sm"><dt className="text-muted">{k}</dt><dd className="tabular font-medium">{v}</dd></div>;

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{new Date(cur.y, cur.m).toLocaleDateString([], { month: "long", year: "numeric" })}</h1>
        <div><IconButton aria-label="Previous month" onClick={() => move(-1)}><ChevronLeft /></IconButton><IconButton aria-label="Next month" onClick={() => move(1)}><ChevronRight /></IconButton></div>
      </header>
      <div className="rounded-2xl border border-line bg-surface p-3">
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted" aria-hidden>{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d}>{d}</div>)}</div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {Array.from({ length: lead }, (_, i) => <div key={i} />)}
          {days?.map((d) => (
            <button key={d.date} onClick={() => setSel(d.date)} aria-label={`${formatLongDate(d.date)}, ${STATUS[d.status].label}`}
              className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-xl text-sm hover:bg-brand-soft ${d.isToday ? "ring-2 ring-brand" : ""}`}>
              <span>{Number(d.date.slice(8))}</span><span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS[d.status].color }} />
            </button>))}
        </div>
      </div>
      <ul className="flex flex-wrap gap-3 text-sm" aria-label="Legend">
        {(["FULL_DAY", "HALF_DAY", "LEAVE", "WEEK_OFF", "NOT_RECORDED"] as const).map((s) => <li key={s} className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full" style={{ background: STATUS[s].color }} />{STATUS[s].label}</li>)}
      </ul>

      <Dialog open={!!day} onClose={() => setSel(null)} fullWidth maxWidth="xs">
        {day && <>
          <DialogTitle>{formatLongDate(day.date)}</DialogTitle>
          <DialogContent>
            <dl><Row k="Status" v={STATUS[day.status].label.toUpperCase()} />
              {day.startedAt && <><Row k="Work started" v={formatTime(day.startedAt)} /><Row k="Work completed" v={formatTime(day.endedAt)} /></>}
              <Row k="Required" v={formatDuration(day.requiredMinutes)} /><Row k="Actual work" v={formatDuration(day.workedMinutes)} />
              <Row k="Break" v={formatDuration(day.breakMinutes)} /><Row k="Overtime" v={formatDuration(day.overtimeMinutes)} /><Row k="Break sessions" v={String(day.breakCount)} />
              {day.leave && <Row k="Leave" v={`${day.leave.type === "FULL_DAY" ? "Full" : "Half"}${day.leave.reason ? ` · ${day.leave.reason}` : ""}`} />}</dl>
            {day.manual && <p className="mt-2 text-xs text-muted">Marked manually (no timer data).</p>}
          </DialogContent>
          <DialogActions className="!flex-wrap">
            {!day.startedAt && !day.isFuture && day.status !== "LEAVE" && <>
              <Button onClick={() => act(() => attendanceService.markManual(day.date, "FULL_DAY"))}>Mark full day</Button>
              <Button onClick={() => act(() => attendanceService.markManual(day.date, "HALF_DAY"))}>Mark half day</Button></>}
            {!day.startedAt && <Button onClick={() => setLeave(true)}>Mark leave</Button>}
            {day.attendance?.weekOffOverride ? <Button onClick={() => act(() => attendanceService.setWeekOffOverride(day.date, false))}>Restore week off</Button>
              : fromDateKey(day.date) && day.isWeekOffDay && <Button onClick={() => act(() => attendanceService.setWeekOffOverride(day.date, true))}>Mark as working day</Button>}
            {(day.manual || day.leave) && <Button color="error" onClick={() => act(() => attendanceService.clearMark(day.date))}>Clear</Button>}
            <Button onClick={() => setSel(null)}>Close</Button>
          </DialogActions></>}
      </Dialog>
      {leave && sel && <LeaveDialog open date={sel} onClose={() => setLeave(false)} />}
    </div>
  );
}
