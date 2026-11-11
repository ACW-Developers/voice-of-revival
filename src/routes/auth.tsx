import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/vor_logo.png";
import photo from "@/assets/auth_ministers.jpg";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign In — Voice of Revival" },
      { name: "description", content: "Sign in or create your Voice of Revival account." },
      { property: "og:title", content: "Sign In — Voice of Revival" },
      { property: "og:description", content: "Access your Voice of Revival account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

function AuthPage() {
  const [mode, setMode] = useState<"in" | "up" | "reset">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "reset") {
      const r = z.string().trim().email().safeParse(email);
      if (!r.success) return toast.error("Enter a valid email");
      setBusy(true);
      const { error } = await supabase.auth.resetPasswordForEmail(r.data, { redirectTo: `${window.location.origin}/reset-password` });
      setBusy(false);
      return error ? toast.error(error.message) : toast.success("Check your email for a reset link.");
    }
    const r = schema.safeParse({ email, password });
    if (!r.success) return toast.error(r.error.issues[0]!.message);
    setBusy(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword(r.data);
      setBusy(false);
      if (error) return toast.error(error.message);
      navigate({ to: "/admin" });
    } else {
      const { error } = await supabase.auth.signUp({ ...r.data, options: { emailRedirectTo: window.location.origin } });
      setBusy(false);
      if (error) return toast.error(error.message);
      toast.success("Account created — check your email to confirm, then sign in.");
      setMode("in");
    }
    return undefined;
  }

  const field = "w-full rounded-lg border border-input bg-muted/40 py-3 pl-11 pr-11 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30";

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        <img src={photo} alt="Voice of Revival ministers" className="absolute inset-0 h-full w-full animate-[ken-burns_20s_ease-out_forwards] object-cover" />
        <div className="absolute inset-0 bg-hero-overlay" />
        <div className="absolute inset-x-0 bottom-0 animate-rise p-12">
          <img src={logo} alt="Voice of Revival" className="h-16 w-auto" />
          <h1 className="mt-6 font-display text-5xl uppercase leading-tight text-photo-foreground">Welcome to Voice of Revival</h1>
          <p className="mt-3 max-w-md text-photo-foreground/85">Different voices. One sound for His glory. Sign in to manage events and tickets.</p>
        </div>
      </div>

      <div className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-md animate-rise rounded-xl border border-border bg-card p-8 shadow-2xl sm:p-10">
          <img src={logo} alt="" className="mx-auto h-14 w-auto" />
          <h2 className="mt-5 text-center font-display text-3xl uppercase">Voice of Revival</h2>
          <p className="mt-1 text-center text-sm text-muted-foreground">
            {mode === "reset" ? "Reset your password" : "Your Voice of Revival account"}
          </p>

          {mode !== "reset" && (
            <div className="mt-7 grid grid-cols-2 rounded-lg bg-muted p-1">
              {(["in", "up"] as const).map((m) => (
                <button key={m} type="button" onClick={() => setMode(m)}
                  className={`rounded-md py-2.5 text-sm font-semibold transition-all duration-300 ${mode === m ? "bg-background text-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}>
                  {m === "in" ? "Sign In" : "Create Account"}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={submit} className="mt-7 space-y-5" noValidate>
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-semibold">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={field} placeholder="you@example.com" />
              </div>
            </div>
            {mode !== "reset" && (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-semibold">Password</label>
                  {mode === "in" && <button type="button" onClick={() => setMode("reset")} className="text-xs text-primary hover:underline">Forgot password?</button>}
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input id="password" type={show ? "text" : "password"} autoComplete={mode === "in" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} className={field} placeholder="••••••••" />
                  <button type="button" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow(!show)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}
            <button type="submit" disabled={busy} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-red-gradient text-sm font-bold uppercase tracking-widest text-primary-foreground shadow-glow transition hover:brightness-110 disabled:opacity-60">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "in" ? "Sign In" : mode === "up" ? "Create Account" : "Send Reset Link"}
            </button>
            {mode === "reset" && <button type="button" onClick={() => setMode("in")} className="w-full text-sm text-muted-foreground hover:text-foreground">Back to sign in</button>}
          </form>

          <Link to="/" className="mt-7 flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-primary"><ArrowLeft className="h-3 w-3" /> Go to Home</Link>
          <p className="mt-2 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} Voice of Revival</p>
        </div>
      </div>
    </div>
  );
}
