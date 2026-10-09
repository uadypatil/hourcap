import { Button, IconButton } from "@mui/material";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useSeo } from "../../components/common/useSeo";
import { useToast } from "../../components/common/ToastProvider";
import { useLive } from "../../hooks/useLive";
import { leaveRepository } from "../../repositories";
import { attendanceService } from "../../services/attendance.service";
import { formatLongDate } from "../../utils/formatDate";
import LeaveDialog from "./LeaveDialog";

export default function LeavesPage() {
  useSeo({ title: "Leaves — HourCap", description: "Leave records.", path: "/app/leaves", noindex: true });
  const { data } = useLive(() => leaveRepository.all(), []);
  const [open, setOpen] = useState(false), toast = useToast();
  const del = async (id: string) => { try { await attendanceService.removeLeave(id); toast("Leave removed.", "success"); } catch { toast("Unable to remove leave. Please try again.", "error"); } };
  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between"><h1 className="text-2xl font-bold">Leaves</h1><Button variant="contained" onClick={() => setOpen(true)}>Add leave</Button></header>
      {!data ? <div role="status" className="h-24 animate-pulse rounded-2xl bg-line" /> : data.length === 0 ? <p className="rounded-2xl border border-dashed border-line p-8 text-center text-muted">No leaves recorded yet.</p> : (
        <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
          {data.map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-3 p-4">
              <div><p className="font-medium">{formatLongDate(l.date)} · {l.type === "FULL_DAY" ? "Full Day" : "Half Day"}</p><p className="text-sm text-muted">{l.reason || "No reason given"}</p></div>
              <IconButton aria-label={`Delete leave on ${l.date}`} onClick={() => del(l.id)}><Trash2 size={18} /></IconButton>
            </li>))}
        </ul>)}
      {open && <LeaveDialog open onClose={() => setOpen(false)} />}
    </div>
  );
}
