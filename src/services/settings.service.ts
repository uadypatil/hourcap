import { settingsRepository } from "../repositories";
import type { WorkSettings } from "../types";

export const defaultSettings = (): WorkSettings => ({
  id: "settings", dailyRequiredMinutes: 0, halfDayMinutes: 0, breakExcludedFromWork: true,
  notifications: { tenMinutesBefore: true, fiveMinutesBefore: true, completion: true },
  weeklySchedule: { monday: "WORKING", tuesday: "WORKING", wednesday: "WORKING", thursday: "WORKING", friday: "WORKING", saturday: "WEEK_OFF", sunday: "WEEK_OFF" },
  theme: "system", updatedAt: new Date().toISOString(),
});
export const isConfigured = (s?: WorkSettings) => !!s && s.dailyRequiredMinutes > 0;
export const settingsService = {
  get: async () => (await settingsRepository.get()) ?? defaultSettings(),
  save: (s: WorkSettings) => settingsRepository.save({ ...s, updatedAt: new Date().toISOString() }),
};
