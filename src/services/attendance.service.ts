import { attendanceRepository, breakRepository, dataRepository, leaveRepository, workRepository } from "../repositories";
import type { AttendanceRecord, DayInfo, LeaveRecord, WorkSettings } from "../types";
import { pad, toDateKey, uid, weekdayOf } from "../utils/formatDate";
import { calculateBreakMinutes, calculateHalfDayDuration, calculateOvertime, calculateShortfall, calculateWorkedMinutes } from "./workTimeCalculation.service";
import { RuleError } from "./workSession.service";

const iso = () => new Date().toISOString();
const put = async (date: string, patch: Partial<AttendanceRecord>) => {
  const cur = await attendanceRepository.byDate(date);
  await attendanceRepository.put({ id: cur?.id ?? uid(), date, status: "NOT_RECORDED", createdAt: cur?.createdAt ?? iso(), ...cur, ...patch, updatedAt: iso() });
};

export const attendanceService = {
  /** Merges sessions, breaks, leaves and attendance into one DayInfo per calendar day. */
  async getMonth(year: number, month: number, s: WorkSettings): Promise<DayInfo[]> {
    const last = new Date(year, month + 1, 0).getDate();
    const from = `${year}-${pad(month + 1)}-01`, to = `${year}-${pad(month + 1)}-${pad(last)}`;
    const [sessions, leaves, atts] = await Promise.all([workRepository.range(from, to), leaveRepository.range(from, to), attendanceRepository.range(from, to)]);
    const breaks = await breakRepository.bySessions(sessions.map((x) => x.id));
    const today = toDateKey(), now = Date.now(), half = calculateHalfDayDuration(s.dailyRequiredMinutes, s.halfDayMinutes);
    return Array.from({ length: last }, (_, i) => {
      const date = `${year}-${pad(month + 1)}-${pad(i + 1)}`;
      const sess = sessions.find((x) => x.date === date), leave = leaves.find((x) => x.date === date), att = atts.find((x) => x.date === date);
      const sb = sess ? breaks.filter((b) => b.workSessionId === sess.id) : [];
      const isWeekOffDay = s.weeklySchedule[weekdayOf(date)] === "WEEK_OFF" && !att?.weekOffOverride;
      const active = sess && !sess.endedAt;
      let status: DayInfo["status"] = att && ["FULL_DAY", "HALF_DAY", "LEAVE"].includes(att.status) ? att.status : active ? "WORKING" : isWeekOffDay ? "WEEK_OFF" : "NOT_RECORDED";
      if (leave?.type === "FULL_DAY") status = "LEAVE";
      const isFuture = date > today;
      let required = 0;
      if (status === "FULL_DAY" || status === "WORKING") required = sess?.requiredMinutes ?? s.dailyRequiredMinutes;
      else if (status === "HALF_DAY") required = sess?.requiredMinutes ?? half;
      else if (status === "NOT_RECORDED" && !isFuture) required = s.dailyRequiredMinutes;
      const worked = sess ? (sess.workedMinutes ?? calculateWorkedMinutes(sess.startedAt, now, sb, s.breakExcludedFromWork)) : status === "FULL_DAY" || status === "HALF_DAY" ? required : 0;
      const brk = sess ? (sess.breakMinutes ?? calculateBreakMinutes(sb, now)) : 0;
      const open = status === "WORKING";
      return {
        date, status, isWeekOffDay, isFuture, isToday: date === today, requiredMinutes: required, workedMinutes: worked, breakMinutes: brk,
        overtimeMinutes: open ? 0 : calculateOvertime(worked, required), shortfallMinutes: open || (date === today && !sess) ? 0 : calculateShortfall(worked, required),
        startedAt: sess?.startedAt, endedAt: sess?.endedAt, breakCount: sb.length, leave, attendance: att, manual: !!att?.manual && !sess,
      };
    });
  },
  /** Mark leave. Full-day leave conflicts with an existing work session unless it is removed first (Rule 7). */
  async markLeave(date: string, type: LeaveRecord["type"], reason: string) {
    return dataRepository.atomic(async () => {
      if (type === "FULL_DAY" && (await workRepository.byDate(date))) throw new RuleError("A work session exists for this date. A full-day leave cannot coexist with it.");
      const cur = await leaveRepository.byDate(date);
      const leave: LeaveRecord = { id: cur?.id ?? uid(), date, type, reason: reason.trim() || undefined, createdAt: cur?.createdAt ?? iso(), updatedAt: iso() };
      await leaveRepository.put(leave);
      await put(date, { status: type === "FULL_DAY" ? "LEAVE" : "HALF_DAY", leaveId: leave.id, manual: !(await workRepository.byDate(date)) });
    });
  },
  async removeLeave(id: string) {
    return dataRepository.atomic(async () => {
      const leave = await leaveRepository.get(id);
      if (!leave) return;
      await leaveRepository.delete(id);
      const att = await attendanceRepository.byDate(leave.date);
      if (att) await (att.workSessionId || att.weekOffOverride ? attendanceRepository.put({ ...att, leaveId: undefined, status: att.workSessionId ? att.status : "NOT_RECORDED", updatedAt: iso() }) : attendanceRepository.delete(att.id));
    });
  },
  async markManual(date: string, status: "FULL_DAY" | "HALF_DAY") {
    if (await workRepository.byDate(date)) throw new RuleError("This day already has a work session.");
    await put(date, { status, manual: true });
  },
  async clearMark(date: string) {
    const att = await attendanceRepository.byDate(date);
    if (att?.workSessionId) throw new RuleError("Days with a work session can't be cleared.");
    if (att?.leaveId) await this.removeLeave(att.leaveId);
    else if (att) await (att.weekOffOverride ? put(date, { status: "NOT_RECORDED", manual: false }) : attendanceRepository.delete(att.id));
  },
  setWeekOffOverride: (date: string, override: boolean) => put(date, { weekOffOverride: override }),
};
