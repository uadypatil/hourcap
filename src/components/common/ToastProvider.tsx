import { Alert, Snackbar } from "@mui/material";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type Sev = "success" | "error" | "info";
const Ctx = createContext<(m: string, s?: Sev) => void>(() => {});
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [t, setT] = useState<{ m: string; s: Sev; k: number } | null>(null);
  const push = useCallback((m: string, s: Sev = "info") => setT({ m, s, k: Date.now() }), []);
  return (
    <Ctx.Provider value={push}>
      {children}
      <Snackbar key={t?.k} open={!!t} autoHideDuration={5000} onClose={() => setT(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }} sx={{ mb: { xs: 9, md: 0 } }}>
        {t ? <Alert severity={t.s} variant="filled" onClose={() => setT(null)} role="status">{t.m}</Alert> : undefined}
      </Snackbar>
    </Ctx.Provider>
  );
}
