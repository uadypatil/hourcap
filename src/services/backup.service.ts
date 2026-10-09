import { dataRepository } from "../repositories";
import type { AttendanceRecord, BackupFile, BreakSession, LeaveRecord, User, WorkSession, WorkSettings } from "../types";
import { downloadJson } from "../utils/formatDate";

const isStr = (v: unknown): v is string => typeof v === "string";
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const dateOk = (v: unknown) => isStr(v) && /^\d{4}-\d{2}-\d{2}$/.test(v);
const isoOk = (v: unknown) => isStr(v) && !Number.isNaN(Date.parse(v));
const rec = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const list = (v: unknown) => { if (!Array.isArray(v)) throw new Error("Invalid backup: expected arrays of records."); return v; };

/** Whitelists fields and validates types so imported JSON can't inject unexpected data. */
export function parseBackup(text: string): BackupFile {
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { throw new Error("This file is not valid JSON."); }
  if (!rec(raw) || raw.version !== 1) throw new Error("Unsupported backup version.");
  const bad = () => new Error("Backup contains invalid records.");
  const workSessions = list(raw.workSessions).map((r): WorkSession => {
    if (!rec(r) || !isStr(r.id) || !dateOk(r.date) || !isoOk(r.startedAt) || !isNum(r.requiredMinutes)) throw bad();
    if (r.endedAt !== undefined && (!isoOk(r.endedAt) || Date.parse(r.endedAt as string) < Date.parse(r.startedAt as string))) throw bad();
    if (!["WORKING", "ON_BREAK", "COMPLETED", "ENDED_EARLY"].includes(r.status as string)) throw bad();
    return { id: r.id, date: r.date as string, startedAt: r.startedAt as string, endedAt: r.endedAt as string | undefined, requiredMinutes: r.requiredMinutes, workedMinutes: isNum(r.workedMinutes) ? r.workedMinutes : undefined, breakMinutes: isNum(r.breakMinutes) ? r.breakMinutes : undefined, halfDay: !!r.halfDay, status: r.status as WorkSession["status"], expectedCompletionAt: isoOk(r.expectedCompletionAt) ? (r.expectedCompletionAt as string) : undefined, createdAt: isoOk(r.createdAt) ? (r.createdAt as string) : new Date().toISOString(), updatedAt: isoOk(r.updatedAt) ? (r.updatedAt as string) : new Date().toISOString() };
  });
  const breakSessions = list(raw.breakSessions).map((r): BreakSession => {
    if (!rec(r) || !isStr(r.id) || !isStr(r.workSessionId) || !isoOk(r.startedAt)) throw bad();
    if (r.endedAt !== undefined && (!isoOk(r.endedAt) || Date.parse(r.endedAt as string) < Date.parse(r.startedAt as string))) throw bad();
    return { id: r.id, workSessionId: r.workSessionId, startedAt: r.startedAt as string, endedAt: r.endedAt as string | undefined, durationMinutes: isNum(r.durationMinutes) ? r.durationMinutes : undefined };
  });
  const attendance = list(raw.attendance).map((r): AttendanceRecord => {
    if (!rec(r) || !isStr(r.id) || !dateOk(r.date) || !["FULL_DAY", "HALF_DAY", "LEAVE", "WEEK_OFF", "NOT_RECORDED"].includes(r.status as string)) throw bad();
    const now = new Date().toISOString();
    return { id: r.id, date: r.date as string, status: r.status as AttendanceRecord["status"], workSessionId: isStr(r.workSessionId) ? r.workSessionId : undefined, leaveId: isStr(r.leaveId) ? r.leaveId : undefined, manual: !!r.manual, weekOffOverride: !!r.weekOffOverride, createdAt: isStr(r.createdAt) ? r.createdAt : now, updatedAt: now };
  });
  const leaves = list(raw.leaves).map((r): LeaveRecord => {
    if (!rec(r) || !isStr(r.id) || !dateOk(r.date) || !["FULL_DAY", "HALF_DAY"].includes(r.type as string)) throw bad();
    const now = new Date().toISOString();
    return { id: r.id, date: r.date as string, type: r.type as LeaveRecord["type"], reason: isStr(r.reason) ? r.reason.slice(0, 500) : undefined, createdAt: isStr(r.createdAt) ? r.createdAt : now, updatedAt: now };
  });
  const out: BackupFile = { version: 1, exportedAt: isStr(raw.exportedAt) ? raw.exportedAt : new Date().toISOString(), workSessions, breakSessions, attendance, leaves };
  if (rec(raw.user) && isStr(raw.user.id) && isStr(raw.user.name)) {
    const u = raw.user; const now = new Date().toISOString();
    out.user = { id: u.id as string, name: (u.name as string).slice(0, 80), email: isStr(u.email) ? u.email : undefined, passwordHash: isStr(u.passwordHash) ? u.passwordHash : undefined, salt: isStr(u.salt) ? u.salt : undefined, createdAt: isStr(u.createdAt) ? u.createdAt : now, updatedAt: now } satisfies User;
  }
  if (rec(raw.settings) && isNum(raw.settings.dailyRequiredMinutes) && rec(raw.settings.weeklySchedule) && rec(raw.settings.notifications)) out.settings = { ...(raw.settings as unknown as WorkSettings), id: "settings" };
  return out;
}
export const backupService = {
  async export() { downloadJson("hourcap-backup.json", { version: 1, exportedAt: new Date().toISOString(), ...(await dataRepository.exportAll()) }); },
  async import(file: File, replace: boolean) { const b = parseBackup(await file.text()); await dataRepository.importAll(b, replace); return b; },
  clearAll: () => dataRepository.clearAll(),
};
