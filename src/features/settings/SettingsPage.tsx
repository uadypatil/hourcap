import { Alert, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControlLabel, Switch, TextField, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSeo } from "../../components/common/useSeo";
import { useToast } from "../../components/common/ToastProvider";
import { useAuth } from "../../hooks/useAuth";
import { useSettings } from "../../hooks/useSettings";
import { backupService } from "../../services/backup.service";
import { notificationService } from "../../services/notification.service";
import { calculateHalfDayDuration } from "../../services/workTimeCalculation.service";
import type { ThemePref, Weekday, WorkSettings } from "../../types";

const DAYS: Weekday[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const Card = ({ t, children }: { t: string; children: React.ReactNode }) => <section className="space-y-4 rounded-2xl border border-line bg-surface p-5"><h2 className="text-lg font-semibold">{t}</h2>{children}</section>;
function Dur({ label, value, onChange }: { label: string; value: number; onChange: (m: number) => void }) {
  const h = Math.floor(value / 60), m = value % 60, clamp = (n: number, max: number) => Math.min(max, Math.max(0, Math.floor(n) || 0));
  return <div className="flex gap-2" role="group" aria-label={label}>
    <TextField label={`${label} (h)`} type="number" size="small" value={h} onChange={(e) => onChange(clamp(+e.target.value, 16) * 60 + m)} slotProps={{ htmlInput: { min: 0, max: 16 } }} />
    <TextField label="min" type="number" size="small" value={m} onChange={(e) => onChange(h * 60 + clamp(+e.target.value, 59))} slotProps={{ htmlInput: { min: 0, max: 59 } }} /></div>;
}

export default function SettingsPage() {
  useSeo({ title: "Settings — HourCap", description: "Settings.", path: "/app/settings", noindex: true });
  const { settings, save } = useSettings(), toast = useToast(), nav = useNavigate(), { logout } = useAuth();
  const [f, setF] = useState<WorkSettings | null>(null), [perm, setPerm] = useState(notificationService.permission());
  const [imp, setImp] = useState<File | null>(null), [clear, setClear] = useState(false), file = useRef<HTMLInputElement>(null);
  useEffect(() => { if (settings && !f) setF(settings); }, [settings, f]);
  if (!f) return <div role="status" className="h-40 animate-pulse rounded-2xl bg-line" />;
  const up = (p: Partial<WorkSettings>) => setF({ ...f, ...p });
  const toggleNotif = async (k: keyof WorkSettings["notifications"], on: boolean) => {
    if (on && perm !== "granted") setPerm(await notificationService.requestPermission());
    up({ notifications: { ...f.notifications, [k]: on } });
  };
  const doImport = async (replace: boolean) => {
    if (!imp) return;
    try { await backupService.import(imp, replace); toast(replace ? "Backup restored (replaced)." : "Backup merged.", "success"); setF(null); }
    catch (e) { toast(e instanceof Error ? e.message : "Import failed. Your existing data is unchanged.", "error"); }
    setImp(null);
  };
  const onSave = async () => {
    if (f.dailyRequiredMinutes <= 0) return toast("Enter a required daily duration greater than zero.", "error");
    const half = f.halfDayMinutes > 0 ? f.halfDayMinutes : calculateHalfDayDuration(f.dailyRequiredMinutes);
    if (half >= f.dailyRequiredMinutes) return toast("Half-day duration must be shorter than a full day.", "error");
    if (await save({ ...f, halfDayMinutes: half })) nav("/app");
  };
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Settings</h1>
      {f.dailyRequiredMinutes <= 0 && <Alert severity="info">Set your required daily work duration to start tracking.</Alert>}
      <Card t="Work configuration">
        <Dur label="Required daily work" value={f.dailyRequiredMinutes} onChange={(m) => up({ dailyRequiredMinutes: m })} />
        <Dur label="Half-day duration" value={f.halfDayMinutes || calculateHalfDayDuration(f.dailyRequiredMinutes)} onChange={(m) => up({ halfDayMinutes: m })} />
        <FormControlLabel control={<Switch checked={f.breakExcludedFromWork} onChange={(e) => up({ breakExcludedFromWork: e.target.checked })} />} label="Exclude breaks from work time (completion shifts by break length)" />
      </Card>
      <Card t="Weekly schedule"><div className="grid grid-cols-1 gap-1 sm:grid-cols-2">{DAYS.map((d) => (
        <FormControlLabel key={d} className="capitalize" label={`${d} — ${f.weeklySchedule[d] === "WORKING" ? "Working" : "Week off"}`}
          control={<Switch checked={f.weeklySchedule[d] === "WORKING"} onChange={(e) => up({ weeklySchedule: { ...f.weeklySchedule, [d]: e.target.checked ? "WORKING" : "WEEK_OFF" } })} />} />))}</div></Card>
      <Card t="Notifications">
        {([["tenMinutesBefore", "10 minute reminder"], ["fiveMinutesBefore", "5 minute reminder"], ["completion", "Completion reminder"]] as const).map(([k, l]) => (
          <FormControlLabel key={k} label={l} control={<Switch checked={f.notifications[k]} onChange={(e) => toggleNotif(k, e.target.checked)} />} />))}
        {perm === "denied" && <Alert severity="warning">Notifications are blocked in your browser settings.</Alert>}
        {perm === "unsupported" && <Alert severity="info">This browser doesn’t support notifications.</Alert>}
        <p className="text-xs text-muted">Reliability depends on browser/PWA permissions and platform behavior; background delivery isn’t guaranteed.</p>
      </Card>
      <Card t="Appearance"><ToggleButtonGroup exclusive value={f.theme} onChange={(_, v: ThemePref | null) => v && up({ theme: v })} aria-label="Theme">
        {(["light", "dark", "system"] as const).map((t) => <ToggleButton key={t} value={t} className="capitalize">{t}</ToggleButton>)}</ToggleButtonGroup></Card>
      <Button variant="contained" size="large" onClick={onSave}>Save settings</Button>

      <Card t="Data management">
        <div className="flex flex-wrap gap-2">
          <Button variant="outlined" onClick={() => backupService.export().catch(() => toast("Export failed.", "error"))}>Export data</Button>
          <Button variant="outlined" onClick={() => file.current?.click()}>Import data</Button>
          <Button variant="outlined" color="error" onClick={() => setClear(true)}>Clear all data</Button>
          <Button onClick={async () => { await logout(); nav("/login"); }}>Log out</Button>
        </div>
        <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => { setImp(e.target.files?.[0] ?? null); e.target.value = ""; }} />
        <p className="text-xs text-muted">All data stays in this browser (IndexedDB). Export regularly to keep a backup.</p>
      </Card>
      <Dialog open={!!imp} onClose={() => setImp(null)}><DialogTitle>Import backup</DialogTitle>
        <DialogContent><DialogContentText>This will replace or merge your existing local data. <b>Merge</b> keeps current records and overwrites the same dates. <b>Replace</b> deletes current records first.</DialogContentText></DialogContent>
        <DialogActions><Button onClick={() => setImp(null)}>Cancel</Button><Button onClick={() => doImport(false)}>Merge</Button><Button color="error" onClick={() => doImport(true)}>Replace</Button></DialogActions></Dialog>
      <Dialog open={clear} onClose={() => setClear(false)}><DialogTitle>Clear all data?</DialogTitle>
        <DialogContent><DialogContentText>Everything, including your profile, is permanently deleted from this device. Export a backup first.</DialogContentText></DialogContent>
        <DialogActions><Button onClick={() => setClear(false)}>Cancel</Button><Button color="error" onClick={async () => { await backupService.clearAll(); location.href = "/"; }}>Delete everything</Button></DialogActions></Dialog>
    </div>
  );
}
