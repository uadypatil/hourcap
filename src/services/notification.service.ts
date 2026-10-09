import { appStateRepository } from "../repositories";
import type { WorkSettings } from "../types";
import { MIN } from "./workTimeCalculation.service";

type Key = "ten" | "five" | "done";
const LEAD: Record<Key, number> = { ten: 10 * MIN, five: 5 * MIN, done: 0 };
const MSG: Record<Key, string> = { ten: "10 minutes of work remaining.", five: "5 minutes of work remaining.", done: "Your required work time is complete." };
const fkey = (id: string) => `notified:${id}`;

async function show(body: string) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  const reg = await navigator.serviceWorker?.getRegistration();
  if (reg) reg.showNotification("HourCap", { body, icon: "/icons/icon-192.png", tag: "hourcap" });
  else new Notification("HourCap", { body, icon: "/icons/icon-192.png" });
}
const due = (completionMs: number, now: number): Key[] => (["ten", "five", "done"] as Key[]).filter((k) => now >= completionMs - LEAD[k]);

export const notificationService = {
  supported: () => typeof Notification !== "undefined",
  permission: () => (typeof Notification === "undefined" ? "unsupported" : Notification.permission),
  async requestPermission() { return typeof Notification === "undefined" ? "unsupported" : Notification.requestPermission(); },
  /** Call on each UI tick / wake. Only the latest due reminder fires; missed earlier ones are marked silently. */
  async check(sessionId: string, completionMs: number, now: number, prefs: WorkSettings["notifications"]) {
    const fired = (await appStateRepository.get<Key[]>(fkey(sessionId))) ?? [];
    const pending = due(completionMs, now).filter((k) => !fired.includes(k));
    if (!pending.length) return;
    await appStateRepository.set(fkey(sessionId), [...fired, ...pending]);
    const latest = pending[pending.length - 1];
    const enabled = { ten: prefs.tenMinutesBefore, five: prefs.fiveMinutesBefore, done: prefs.completion }[latest];
    if (enabled && now - (completionMs - LEAD[latest]) < 30 * MIN) await show(MSG[latest]);
  },
  /** After a break the completion moves; mark currently-due reminders as already handled. */
  async rebase(sessionId: string, completionMs: number, now: number) { await appStateRepository.set(fkey(sessionId), due(completionMs, now)); },
};
