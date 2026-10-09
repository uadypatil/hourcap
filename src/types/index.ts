export type DayMode = "WORKING" | "WEEK_OFF";
export type Weekday = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
export type ThemePref = "light" | "dark" | "system";

export interface User { id: string; name: string; email?: string; passwordHash?: string; salt?: string; createdAt: string; updatedAt: string }

export interface WorkSettings {
  id: string;
  dailyRequiredMinutes: number; // 0 = not configured
  halfDayMinutes: number;
  breakExcludedFromWork: boolean;
  notifications: { tenMinutesBefore: boolean; fiveMinutesBefore: boolean; completion: boolean };
  weeklySchedule: Record<Weekday, DayMode>;
  theme: ThemePref;
  updatedAt: string;
}

export type SessionStatus = "WORKING" | "ON_BREAK" | "COMPLETED" | "ENDED_EARLY";
export interface WorkSession {
  id: string; date: string; startedAt: string; endedAt?: string;
  requiredMinutes: number; workedMinutes?: number; breakMinutes?: number;
  halfDay?: boolean; status: SessionStatus; expectedCompletionAt?: string;
  createdAt: string; updatedAt: string;
}
export interface BreakSession { id: string; workSessionId: string; startedAt: string; endedAt?: string; durationMinutes?: number }
export interface LeaveRecord { id: string; date: string; type: "FULL_DAY" | "HALF_DAY"; reason?: string; createdAt: string; updatedAt: string }
export type AttendanceStatus = "FULL_DAY" | "HALF_DAY" | "LEAVE" | "WEEK_OFF" | "NOT_RECORDED";
export interface AttendanceRecord {
  id: string; date: string; status: AttendanceStatus; workSessionId?: string; leaveId?: string;
  manual?: boolean; weekOffOverride?: boolean; createdAt: string; updatedAt: string;
}
export interface AppStateRow { key: string; value: unknown }

export type DayStatus = AttendanceStatus | "WORKING";
export interface DayInfo {
  date: string; status: DayStatus; isWeekOffDay: boolean; isFuture: boolean; isToday: boolean;
  requiredMinutes: number; workedMinutes: number; breakMinutes: number; overtimeMinutes: number; shortfallMinutes: number;
  startedAt?: string; endedAt?: string; breakCount: number; leave?: LeaveRecord; attendance?: AttendanceRecord; manual?: boolean;
}
export interface BackupFile {
  version: 1; exportedAt: string; user?: User; settings?: WorkSettings;
  workSessions: WorkSession[]; breakSessions: BreakSession[]; attendance: AttendanceRecord[]; leaves: LeaveRecord[];
}
