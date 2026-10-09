import { db } from "../db/db";
import type { AttendanceRecord, BreakSession, LeaveRecord, User, WorkSession, WorkSettings } from "../types";

export const userRepository = {
  get: () => db.users.toCollection().first(),
  put: (u: User) => db.users.put(u),
};
export const settingsRepository = {
  get: () => db.settings.get("settings"),
  save: (s: WorkSettings) => db.settings.put(s),
};
export const workRepository = {
  byDate: (date: string) => db.workSessions.where("date").equals(date).first(),
  get: (id: string) => db.workSessions.get(id),
  put: (s: WorkSession) => db.workSessions.put(s),
  range: (from: string, to: string) => db.workSessions.where("date").between(from, to, true, true).toArray(),
};
export const breakRepository = {
  bySession: (id: string) => db.breakSessions.where("workSessionId").equals(id).toArray(),
  bySessions: (ids: string[]) => db.breakSessions.where("workSessionId").anyOf(ids).toArray(),
  put: (b: BreakSession) => db.breakSessions.put(b),
};
export const leaveRepository = {
  byDate: (date: string) => db.leaves.where("date").equals(date).first(),
  get: (id: string) => db.leaves.get(id),
  range: (from: string, to: string) => db.leaves.where("date").between(from, to, true, true).toArray(),
  all: () => db.leaves.orderBy("date").reverse().toArray(),
  put: (l: LeaveRecord) => db.leaves.put(l),
  delete: (id: string) => db.leaves.delete(id),
};
export const attendanceRepository = {
  byDate: (date: string) => db.attendance.where("date").equals(date).first(),
  range: (from: string, to: string) => db.attendance.where("date").between(from, to, true, true).toArray(),
  put: (a: AttendanceRecord) => db.attendance.put(a),
  delete: (id: string) => db.attendance.delete(id),
};
export const appStateRepository = {
  get: async <T,>(key: string) => (await db.appState.get(key))?.value as T | undefined,
  set: (key: string, value: unknown) => db.appState.put({ key, value }),
  delete: (key: string) => db.appState.delete(key),
};
type Dump = { user?: User; settings?: WorkSettings; workSessions: WorkSession[]; breakSessions: BreakSession[]; attendance: AttendanceRecord[]; leaves: LeaveRecord[] };
export const dataRepository = {
  exportAll: async (): Promise<Dump> => ({
    user: await db.users.toCollection().first(), settings: await db.settings.get("settings"),
    workSessions: await db.workSessions.toArray(), breakSessions: await db.breakSessions.toArray(),
    attendance: await db.attendance.toArray(), leaves: await db.leaves.toArray(),
  }),
  /** replace=true wipes records first; merge removes same-date records then imported ones win. */
  importAll: (d: Dump, replace: boolean) =>
    db.transaction("rw", db.tables, async () => {
      if (replace) await Promise.all([db.workSessions, db.breakSessions, db.attendance, db.leaves].map((t) => t.clear()));
      else {
        const old = await db.workSessions.where("date").anyOf(d.workSessions.map((s) => s.date)).toArray();
        await db.workSessions.bulkDelete(old.map((s) => s.id));
        await db.breakSessions.where("workSessionId").anyOf(old.map((s) => s.id)).delete();
        await db.attendance.where("date").anyOf(d.attendance.map((s) => s.date)).delete();
        await db.leaves.where("date").anyOf(d.leaves.map((s) => s.date)).delete();
      }
      if (d.user) await db.users.put(d.user);
      if (d.settings) await db.settings.put(d.settings);
      await db.workSessions.bulkPut(d.workSessions); await db.breakSessions.bulkPut(d.breakSessions);
      await db.attendance.bulkPut(d.attendance); await db.leaves.bulkPut(d.leaves);
    }),
  clearAll: () => db.transaction("rw", db.tables, () => Promise.all(db.tables.map((t) => t.clear()))),
  atomic: <T,>(fn: () => Promise<T>) => db.transaction("rw", db.tables, fn),
};
