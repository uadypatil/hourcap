import { IconButton } from "@mui/material";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useSeo } from "../../components/common/useSeo";
import { useLive } from "../../hooks/useLive";
import { useSettings } from "../../hooks/useSettings";
import { attendanceService } from "../../services/attendance.service";
import { buildMonthReport } from "../../services/report.service";
import { formatDuration } from "../../services/workTimeCalculation.service";
import { Stat } from "../dashboard/Stat";

export default function ReportsPage() {
  useSeo({ title: "Monthly report — HourCap", description: "Monthly work report.", path: "/app/reports", noindex: true });
  const { settings } = useSettings();
  const [cur, setCur] = useState(() => { const n = new Date(); return { y: n.getFullYear(), m: n.getMonth() }; });
  const { data: days } = useLive(async () => (settings ? attendanceService.getMonth(cur.y, cur.m, settings) : []), [cur, settings]);
  const move = (d: number) => setCur(({ y, m }) => { const n = new Date(y, m + d, 1); return { y: n.getFullYear(), m: n.getMonth() }; });
  const r = days ? buildMonthReport(days) : null, D = formatDuration;
  const counts: [string, number][] = r ? [["Calendar days", r.calendarDays], ["Working days", r.workingDays], ["Completed", r.completed], ["Half days", r.halfDays], ["Leaves", r.leaves], ["Week offs", r.weekOffs], ["Unrecorded", r.unrecorded]] : [];
  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{new Date(cur.y, cur.m).toLocaleDateString([], { month: "long", year: "numeric" })} report</h1>
        <div><IconButton aria-label="Previous month" onClick={() => move(-1)}><ChevronLeft /></IconButton><IconButton aria-label="Next month" onClick={() => move(1)}><ChevronRight /></IconButton></div>
      </header>
      {!r ? <div role="status" className="h-40 animate-pulse rounded-2xl bg-line" /> : <>
        <section aria-label="Hours" className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <Stat label="Required hours" value={D(r.requiredMinutes)} /><Stat label="Worked hours" value={D(r.workedMinutes)} /><Stat label="Break hours" value={D(r.breakMinutes)} />
          <Stat label="Overtime" value={D(r.overtimeMinutes)} /><Stat label="Shortfall" value={D(r.shortfallMinutes)} /><Stat label="Average work / day" value={D(r.averageMinutes)} />
        </section>
        <section aria-label="Attendance" className="grid grid-cols-2 gap-3 md:grid-cols-4">{counts.map(([k, v]) => <Stat key={k} label={k} value={String(v)} />)}</section>
        <p className="text-xs text-muted">Required hours cover elapsed working days; full-day leaves and week-offs are excused, half days use the half-day duration.</p></>}
    </div>
  );
}
