import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — Voice of Revival" },
      { name: "description", content: "Choose a new password for your Voice of Revival account." },
      { property: "og:title", content: "Reset Password — Voice of Revival" },
      { property: "og:description", content: "Choose a new password." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Reset,
});

function Reset() {
  const [pw, setPw] = useState("");
  const navigate = useNavigate();
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) return toast.error("Password must be at least 8 characters");
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    navigate({ to: "/admin" });
    return undefined;
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5">
      <form onSubmit={save} className="w-full max-w-sm space-y-4 rounded-xl border border-border bg-card p-8">
        <h1 className="font-display text-3xl uppercase">New Password</h1>
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} className="w-full rounded-lg border border-input bg-muted/40 px-4 py-3 text-sm" placeholder="New password" />
        <button className="w-full rounded-lg bg-red-gradient py-3 text-sm font-bold uppercase tracking-widest text-primary-foreground">Save</button>
      </form>
    </div>
  );
}
