import { useCallback } from "react";
import { settingsService } from "../services/settings.service";
import type { WorkSettings } from "../types";
import { useLive } from "./useLive";
import { useToast } from "../components/common/ToastProvider";

export function useSettings() {
  const { data, error } = useLive(() => settingsService.get(), []);
  const toast = useToast();
  const save = useCallback(async (s: WorkSettings) => {
    try { await settingsService.save(s); toast("Settings saved.", "success"); return true; }
    catch { toast("Unable to save settings. Your existing local data is still safe. Please try again.", "error"); return false; }
  }, [toast]);
  return { settings: data, loading: !data && !error, error, save };
}
