import { appStateRepository, attendanceRepository, breakRepository, dataRepository, leaveRepository, workRepository } from "../repositories";
import type { AttendanceRecord, BreakSession, WorkSession, WorkSettings } from "../types";
import { toDateKey, uid } from "../utils/formatDate";
import { isConfigured } from "./settings.service";
import { calculateBreakMinutes, calculateExpectedCompletion, calculateHalfDayDuration, calculateWorkedMinutes } from "./workTimeCalculation.service";
import { notificationService } from "./notification.service";

export class RuleError extends Error {}
const iso = () => new Date().toISOString();

async function upsertAttendance(date: string, patch: Partial<AttendanceRecord>) {
  const cur = await attendanceRepository.byDate(date);
  await attendanceRepository.put({ id: cur?.id ?? uid(), date, status: "NOT_RECORDED", createdAt: cur?.createdAt ?? iso(), ...cur, ...patch, updatedAt: iso() });
}
const completion = (s: WorkSession, breaks: BreakSession[], st: WorkSettings, now: number) =>
  calculateExpectedCompletion(s.startedAt, s.requiredMinutes, calculateBreakMinutes(breaks, now), st.breakExcludedFromWork);

export const workSessionService = {
  async start(settings: WorkSettings, opts: { halfDay?: boolean } = {}) {
    if (!isConfigured(settings)) throw new RuleError("Please configure your required working hours.");
    const date = toDateKey(), now = iso();
    return dataRepository.atomic(async () => {
      if (await workRepository.byDate(date)) throw new RuleError("A work session already exists for today.");
      const leave = await leaveRepository.byDate(date);
      if (leave?.type === "FULL_DAY") throw new RuleError("Today is marked as leave. Remove the leave first to start work.");
      const halfDay = !!opts.halfDay || leave?.type === "HALF_DAY";
      const required = halfDay ? calculateHalfDayDuration(settings.dailyRequiredMinutes, settings.halfDayMinutes) : settings.dailyRequiredMinutes;
      const s: WorkSession = { id: uid(), date, startedAt: now, requiredMinutes: required, halfDay, status: "WORKING", createdAt: now, updatedAt: now };
      s.expectedCompletionAt = completion(s, [], settings, Date.parse(now)).toISOString();
      await workRepository.put(s);
      await upsertAttendance(date, { status: "NOT_RECORDED", workSessionId: s.id });
      return s;
    });
  },
  async startBreak(sessionId: string) {
    return dataRepository.atomic(async () => {
      const s = await workRepository.get(sessionId);
      if (!s || s.status !== "WORKING") throw new RuleError("Breaks can only start while working.");
      if ((await breakRepository.bySession(sessionId)).some((b) => !b.endedAt)) throw new RuleError("A break is already active.");
      const now = iso();
      await breakRepository.put({ id: uid(), workSessionId: sessionId, startedAt: now });
      await workRepository.put({ ...s, status: "ON_BREAK", updatedAt: now });
    });
  },
  async resume(sessionId: string, settings: WorkSettings) {
    const next = await dataRepository.atomic(async () => {
      const s = await workRepository.get(sessionId);
      const breaks = await breakRepository.bySession(sessionId);
      const open = breaks.find((b) => !b.endedAt);
      if (!s || s.status !== "ON_BREAK" || !open) throw new RuleError("No active break to resume.");
      const now = Date.now();
      if (now < Date.parse(open.startedAt)) throw new RuleError("A break cannot end before it starts.");
      const closed = { ...open, endedAt: new Date(now).toISOString(), durationMinutes: (now - Date.parse(open.startedAt)) / 60000 };
      await breakRepository.put(closed);
      const all = breaks.map((b) => (b.id === closed.id ? closed : b));
      const upd: WorkSession = { ...s, status: "WORKING", updatedAt: iso(), expectedCompletionAt: completion(s, all, settings, now).toISOString() };
      await workRepository.put(upd);
      return upd;
    });
    await notificationService.rebase(sessionId, Date.parse(next.expectedCompletionAt!), Date.now());
  },
  async endDay(sessionId: string, settings: WorkSettings) {
    return dataRepository.atomic(async () => {
      const s = await workRepository.get(sessionId);
      if (!s || s.endedAt) throw new RuleError("This work session has already ended.");
      let breaks = await breakRepository.bySession(sessionId);
      const nowMs = Math.max(Date.now(), Date.parse(s.startedAt));
      const open = breaks.find((b) => !b.endedAt);
      if (open) {
        const closed = { ...open, endedAt: new Date(nowMs).toISOString(), durationMinutes: (nowMs - Date.parse(open.startedAt)) / 60000 };
        await breakRepository.put(closed); breaks = breaks.map((b) => (b.id === closed.id ? closed : b));
      }
      const worked = calculateWorkedMinutes(s.startedAt, nowMs, breaks, settings.breakExcludedFromWork);
      const done: WorkSession = {
        ...s, endedAt: new Date(nowMs).toISOString(), workedMinutes: worked, breakMinutes: calculateBreakMinutes(breaks, nowMs),
        status: worked >= s.requiredMinutes ? "COMPLETED" : "ENDED_EARLY", updatedAt: iso(),
      };
      await workRepository.put(done);
      await upsertAttendance(s.date, { status: s.halfDay ? "HALF_DAY" : "FULL_DAY", workSessionId: s.id });
      await appStateRepository.delete(`notified:${s.id}`);
      return done;
    });
  },
  async today() {
    const session = await workRepository.byDate(toDateKey());
    return { session: session ?? null, breaks: session ? await breakRepository.bySession(session.id) : [] };
  },
};
