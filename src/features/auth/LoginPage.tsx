import { Alert, Button, TextField } from "@mui/material";
import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useSeo } from "../../components/common/useSeo";

export default function LoginPage() {
  useSeo({ title: "Sign in — HourCap", description: "Open your local HourCap work-time tracker.", path: "/login", noindex: true });
  const { loading, user, loggedIn, signUp, login } = useAuth();
  const [name, setName] = useState(""), [pin, setPin] = useState(""), [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  if (loading) return null;
  if (loggedIn) return <Navigate to="/app" replace />;
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr("");
    try { user ? await login(pin) : await signUp(name, pin || undefined); }
    catch (x) { setErr(x instanceof Error ? x.message : "Unable to continue. Please try again."); } finally { setBusy(false); }
  };
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-3xl border border-line bg-surface p-6 shadow-sm" aria-labelledby="t">
        <img src="/favicon.svg" alt="" width={44} height={44} />
        <h1 id="t" className="text-2xl font-bold">{user ? `Welcome back, ${user.name}` : "Create your local profile"}</h1>
        <p className="text-sm text-muted">{user ? "Your data stays on this device." : "No account or server. Your profile and data live only in this browser. A PIN is optional and works as a privacy layer, not server-grade security."}</p>
        {!user && <TextField label="Your name" value={name} onChange={(e) => setName(e.target.value)} required fullWidth autoFocus slotProps={{ htmlInput: { maxLength: 80 } }} />}
        {(user?.passwordHash || !user) && <TextField label={user ? "PIN" : "PIN (optional)"} type="password" value={pin} onChange={(e) => setPin(e.target.value)} required={!!user} fullWidth autoFocus={!!user} slotProps={{ htmlInput: { inputMode: "numeric", autoComplete: "off" } }} />}
        {err && <Alert severity="error">{err}</Alert>}
        <Button type="submit" variant="contained" size="large" fullWidth disabled={busy || (!user && !name.trim())}>{user ? "Unlock" : "Get started"}</Button>
      </form>
    </main>
  );
}
