export const MIN = 60_000;
export interface BreakLike { startedAt: string; endedAt?: string }

/** Total break minutes; an open break counts up to `nowMs`. */
export function calculateBreakMinutes(breaks: BreakLike[], nowMs: number): number {
  return breaks.reduce((t, b) => {
    const s = Date.parse(b.startedAt), e = b.endedAt ? Date.parse(b.endedAt) : nowMs;
    return t + Math.max(0, e - s) / MIN;
  }, 0);
}
/** Actual work = elapsed − breaks (when breaks are excluded). */
export function calculateWorkedMinutes(startedAt: string, nowMs: number, breaks: BreakLike[], excludeBreaks = true): number {
  const elapsed = Math.max(0, nowMs - Date.parse(startedAt)) / MIN;
  return Math.max(0, elapsed - (excludeBreaks ? calculateBreakMinutes(breaks, nowMs) : 0));
}
export const calculateRemainingMinutes = (required: number, worked: number) => Math.max(0, required - worked);
export function calculateExpectedCompletion(startedAt: string, required: number, breakMinutes: number, excludeBreaks = true): Date {
  return new Date(Date.parse(startedAt) + (required + (excludeBreaks ? breakMinutes : 0)) * MIN);
}
export const calculateOvertime = (worked: number, required: number) => Math.max(0, worked - required);
export const calculateShortfall = (worked: number, required: number) => Math.max(0, required - worked);
export const calculateHalfDayDuration = (required: number, configured = 0) => (configured > 0 ? configured : Math.round(required / 2));

export const formatDuration = (minutes: number) => {
  const m = Math.max(0, Math.floor(minutes + 1e-6));
  return `${String(Math.floor(m / 60)).padStart(2, "0")}h ${String(m % 60).padStart(2, "0")}m`;
};
export const formatClock = (minutes: number) => {
  const s = Math.max(0, Math.floor(minutes * 60 + 1e-6));
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`;
};
