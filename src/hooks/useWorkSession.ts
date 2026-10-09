import { useCallback, useEffect, useMemo } from "react";
import { useToast } from "../components/common/ToastProvider";
import { notificationService } from "../services/notification.service";
import { isConfigured } from "../services/settings.service";
import { RuleError, workSessionService } from "../services/workSession.service";
import { calculateBreakMinutes, calculateExpectedCompletion, calculateOvertime, calculateRemainingMinutes, calculateShortfall, calculateWorkedMinutes } from "../services/workTimeCalculation.service";
import type { WorkSettings } from "../types";
import { useLive } from "./useLive";
import { useNow } from "./useNow";

export function useWorkSession(settings: WorkSettings | undefined) {
  const { data, error } = useLive(() => workSessionService.today(), []);
  const toast = useToast();
  const session = data?.session ?? null, breaks = data?.breaks ?? [];
  const active = !!session && !session.endedAt;
  const now = useNow(active);
  const excl = settings?.breakExcludedFromWork ?? true;

  const view = useMemo(() => {
    if (!session) return null;
    const at = session.endedAt ? Date.parse(session.endedAt) : now;
    const breakMin = calculateBreakMinutes(breaks, at);
    const worked = calculateWorkedMinutes(session.startedAt, at, breaks, excl);
    const completion = calculateExpectedCompletion(session.startedAt, session.requiredMinutes, breakMin, excl);
    const open = breaks.find((b) => !b.endedAt);
    return {
      worked, breakMin, completion, remaining: calculateRemainingMinutes(session.requiredMinutes, worked),
      overtime: calculateOvertime(worked, session.requiredMinutes), shortfall: calculateShortfall(worked, session.requiredMinutes),
      currentBreakMin: open ? (at - Date.parse(open.startedAt)) / 60000 : 0, breakCount: breaks.length,
    };
  }, [session, breaks, now, excl]);

  // Reminders are derived from the completion timestamp on every tick/wake; nothing depends on a long-lived timer.
  const completionMs = view && session?.status === "WORKING" ? view.completion.getTime() : 0;
  useEffect(() => {
    if (!settings || !session || !completionMs) return;
    notificationService.check(session.id, completionMs, now, settings.notifications).catch(() => {});
  }, [now, completionMs, session, settings]);

  const run = useCallback(async (fn: () => Promise<unknown>, ok?: string) => {
    try { await fn(); if (ok) toast(ok, "success"); return true; }
    catch (e) { toast(e instanceof RuleError ? e.message : "Unable to save today's session. Your existing local data is still safe. Please try again.", "error"); return false; }
  }, [toast]);

  return {
    loading: !data && !error, error, session, breaks, view, now, configured: isConfigured(settings),
    start: (halfDay: boolean) => settings && run(() => workSessionService.start(settings, { halfDay }), "Work started."),
    takeBreak: () => session && run(() => workSessionService.startBreak(session.id), "Break started."),
    resume: () => session && settings && run(() => workSessionService.resume(session.id, settings), "Welcome back."),
    endDay: () => session && settings && run(() => workSessionService.endDay(session.id, settings), "Work day ended."),
  };
}
