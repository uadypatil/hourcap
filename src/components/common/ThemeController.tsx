import { CssBaseline, ThemeProvider, createTheme, useMediaQuery } from "@mui/material";
import { useEffect, useMemo, type ReactNode } from "react";
import { useSettings } from "../../hooks/useSettings";

export function ThemeController({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  const sysDark = useMediaQuery("(prefers-color-scheme: dark)");
  const pref = settings?.theme ?? "system";
  const dark = pref === "dark" || (pref === "system" && sysDark);
  useEffect(() => { document.documentElement.classList.toggle("dark", dark); }, [dark]);
  const theme = useMemo(() => createTheme({
    palette: { mode: dark ? "dark" : "light", primary: { main: dark ? "#4db6ac" : "#00796b" }, background: { default: dark ? "#0f1514" : "#f6f8f8", paper: dark ? "#171e1d" : "#ffffff" } },
    shape: { borderRadius: 14 },
    typography: { fontFamily: '"Roboto", ui-sans-serif, system-ui, sans-serif', button: { textTransform: "none", fontWeight: 600 } },
    components: { MuiButton: { defaultProps: { disableElevation: true } }, MuiCard: { defaultProps: { variant: "outlined" } }, MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } } },
  }), [dark]);
  return <ThemeProvider theme={theme}><CssBaseline enableColorScheme />{children}</ThemeProvider>;
}
