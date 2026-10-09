export const pad = (n: number) => String(n).padStart(2, "0");
export const toDateKey = (d: Date = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const fromDateKey = (k: string) => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d); };
export const formatTime = (iso?: string | Date) => iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";
export const formatLongDate = (k: string) => fromDateKey(k).toLocaleDateString([], { day: "2-digit", month: "long", year: "numeric" });
export const uid = () => crypto.randomUUID();
export const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;
export const weekdayOf = (k: string) => WEEKDAYS[fromDateKey(k).getDay()];
export function downloadJson(name: string, data: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  const a = document.createElement("a"); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
}
