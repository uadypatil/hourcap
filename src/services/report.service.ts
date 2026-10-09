import type { DayInfo } from "../types";

export interface MonthReport {
  calendarDays: number; workingDays: number; completed: number; halfDays: number; leaves: number; weekOffs: number; unrecorded: number;
  requiredMinutes: number; workedMinutes: number; breakMinutes: number; overtimeMinutes: number; shortfallMinutes: number; averageMinutes: number;
}
export function buildMonthReport(days: DayInfo[]): MonthReport {
  const sum = (f: (d: DayInfo) => number) => days.reduce((t, d) => t + f(d), 0);
  const count = (st: DayInfo["status"]) => days.filter((d) => d.status === st).length;
  const worked = sum((d) => d.workedMinutes);
  const workedDays = days.filter((d) => d.workedMinutes > 0).length;
  return {
    calendarDays: days.length, workingDays: days.filter((d) => !d.isWeekOffDay).length,
    completed: count("FULL_DAY"), halfDays: count("HALF_DAY"), leaves: count("LEAVE"), weekOffs: count("WEEK_OFF"),
    unrecorded: days.filter((d) => d.status === "NOT_RECORDED" && !d.isFuture && !d.isToday && !d.isWeekOffDay).length,
    requiredMinutes: sum((d) => d.requiredMinutes), workedMinutes: worked, breakMinutes: sum((d) => d.breakMinutes),
    overtimeMinutes: sum((d) => d.overtimeMinutes), shortfallMinutes: sum((d) => d.shortfallMinutes), averageMinutes: workedDays ? worked / workedDays : 0,
  };
}
