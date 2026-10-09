import { Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField } from "@mui/material";
import { useState } from "react";
import { useToast } from "../../components/common/ToastProvider";
import { attendanceService } from "../../services/attendance.service";
import { RuleError } from "../../services/workSession.service";
import { toDateKey } from "../../utils/formatDate";

export default function LeaveDialog({ open, date: d, onClose }: { open: boolean; date?: string; onClose: () => void }) {
  const toast = useToast();
  const [date, setDate] = useState(d ?? toDateKey()), [type, setType] = useState<"FULL_DAY" | "HALF_DAY">("FULL_DAY"), [reason, setReason] = useState("");
  const save = async () => {
    try { await attendanceService.markLeave(d ?? date, type, reason); toast("Leave saved.", "success"); setReason(""); onClose(); }
    catch (e) { toast(e instanceof RuleError ? e.message : "Unable to save leave. Your existing local data is still safe.", "error"); }
  };
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs"><DialogTitle>Add leave</DialogTitle>
      <DialogContent className="space-y-4 !pt-2">
        <TextField label="Date" type="date" value={d ?? date} onChange={(e) => setDate(e.target.value)} disabled={!!d} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
        <TextField select label="Leave type" value={type} onChange={(e) => setType(e.target.value as typeof type)} fullWidth>
          <MenuItem value="FULL_DAY">Full Day</MenuItem><MenuItem value="HALF_DAY">Half Day</MenuItem></TextField>
        <TextField label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} fullWidth multiline slotProps={{ htmlInput: { maxLength: 500 } }} />
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Cancel</Button><Button variant="contained" onClick={save} disabled={!(d ?? date)}>Save</Button></DialogActions></Dialog>
  );
}
