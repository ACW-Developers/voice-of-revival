import { useState } from "react";
import { toast } from "sonner";
import { Copy, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function PaymentSecretCard() {
  const [secret, setSecret] = useState("");
  const [busy, setBusy] = useState(false);

  async function generate() {
    if (!confirm("Create a new payment key? The old key stops working everywhere until you update your hosting settings.")) return;
    setBusy(true);
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    const value = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    const { error } = await supabase.rpc("configure_payment_recording", { p_secret: value });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setSecret(value);
    toast.success("New payment key saved");
  }

  return (
    <section className="mt-8 rounded-lg border border-border bg-card p-5">
      <h2 className="flex items-center gap-2 font-display text-xl uppercase">
        <KeyRound className="h-5 w-5 text-primary" /> Payment recording key
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Generate a key, copy it, then add it to Netlify as <code>PAYMENT_RECORDING_SECRET</code> and redeploy.
        It is shown only once.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={generate}
          disabled={busy}
          className="rounded-lg bg-red-gradient px-5 py-2.5 text-sm font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-60"
        >
          {busy ? "Saving..." : "Generate new key"}
        </button>
        {secret && (
          <>
            <code className="break-all rounded bg-muted px-3 py-2 text-xs">{secret}</code>
            <button
              onClick={() => navigator.clipboard.writeText(secret).then(() => toast.success("Copied"))}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
            >
              <Copy className="h-4 w-4" /> Copy
            </button>
          </>
        )}
      </div>
    </section>
  );
}
