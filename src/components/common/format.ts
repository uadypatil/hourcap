import type { DayStatus } from "../../types";
export const STATUS: Record<DayStatus, { label: string; color: string }> = {
  FULL_DAY: { label: "Full Day", color: "#2e7d32" }, HALF_DAY: { label: "Half Day", color: "#f9a825" }, LEAVE: { label: "Leave", color: "#d32f2f" },
  WEEK_OFF: { label: "Week Off", color: "#1976d2" }, NOT_RECORDED: { label: "Not Recorded", color: "#9e9e9e" }, WORKING: { label: "Working", color: "#00796b" },
};
