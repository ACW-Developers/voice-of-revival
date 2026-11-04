import { useEffect, useState } from "react";
import { z } from "zod";
import { HandHeart, Info, Lock } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const EVENT = "vor:open-donation";
export const openDonation = () => window.dispatchEvent(new Event(EVENT));
export const DONATION_AMOUNTS = [1, 2, 5, 10, 20, 50, 100] as const;

const schema = (anonymous: boolean) =>
  z.object({
    name: anonymous ? z.string().optional() : z.string().trim().min(2, "Please enter your name").max(100),
    email: z.string().trim().email("Please enter a valid email").max(255),
    phone: z.string().trim().max(30).regex(/^[+\d\s()-]*$/, "Please enter a valid phone number").optional(),
    amount: z.number({ invalid_type_error: "Choose an amount" }).min(1, "Minimum donation is $1").max(100000),
    message: z.string().max(1000).optional(),
    consent: z.literal(true, { errorMap: () => ({ message: "Please accept the privacy notice" }) }),
  });

export function DonationModal({ logo }: { logo: string }) {
  const [open, setOpen] = useState(false);
  const [frequency, setFrequency] = useState<"once" | "monthly">("once");
  const [preset, setPreset] = useState<number | "custom">(20);
  const [custom, setCustom] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [consent, setConsent] = useState(false);
  const [fields, setFields] = useState({ name: "", email: "", phone: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState(false);

  useEffect(() => {
    const h = () => { setNotice(false); setOpen(true); };
    window.addEventListener(EVENT, h);
    return () => window.removeEventListener(EVENT, h);
  }, []);

  const amount = preset === "custom" ? Number(custom) : preset;
  const set = (k: keyof typeof fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFields((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = schema(anonymous).safeParse({ ...fields, amount: Number.isFinite(amount) && amount > 0 ? amount : NaN, consent });
    if (!r.success) {
      const errs: Record<string, string> = {};
      r.error.issues.forEach((i) => (errs[String(i.path[0])] ??= i.message));
      setErrors(errs);
      setNotice(false);
      return;
    }
    setErrors({});
    setNotice(true);
  };

  const err = (k: string) => errors[k] && <p className="mt-1 text-xs text-destructive">{errors[k]}</p>;
  const pill = (active: boolean) =>
    cn(
      "rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5",
      active ? "border-primary bg-primary text-primary-foreground shadow-glow" : "border-border bg-background/60 hover:border-primary/60",
    );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[92vh] w-[calc(100%-1.5rem)] max-w-lg overflow-y-auto rounded-2xl border-border/60 bg-card/95 p-6 backdrop-blur-xl sm:p-8 [&~*]:backdrop-blur-sm">
        <div className="flex flex-col items-center text-center">
          <img src={logo} alt="Voice of Revival" className="h-14 w-auto" />
          <DialogTitle className="mt-4 font-display text-2xl">Support the Movement</DialogTitle>
          <DialogDescription className="mt-1 text-sm">Partner with Voice of Revival in worship, creativity and Kingdom impact.</DialogDescription>
        </div>

        <form onSubmit={submit} noValidate className="mt-6 space-y-5">
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
            {(["once", "monthly"] as const).map((f) => (
              <button key={f} type="button" onClick={() => setFrequency(f)} aria-pressed={frequency === f}
                className={cn("rounded-lg py-2 text-sm font-semibold transition-all", frequency === f ? "bg-background shadow-sm" : "text-muted-foreground")}>
                {f === "once" ? "One-time" : "Monthly"}
              </button>
            ))}
          </div>

          <div>
            <Label className="mb-2 block">Choose an amount</Label>
            <div className="grid grid-cols-4 gap-2">
              {DONATION_AMOUNTS.map((a) => (
                <button key={a} type="button" aria-pressed={preset === a} onClick={() => setPreset(a)} className={pill(preset === a)}>${a}</button>
              ))}
              <button type="button" aria-pressed={preset === "custom"} onClick={() => setPreset("custom")} className={pill(preset === "custom")}>Other</button>
            </div>
            {preset === "custom" && (
              <div className="relative mt-3 animate-in fade-in slide-in-from-top-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input type="number" min={1} inputMode="decimal" placeholder="Enter amount" value={custom} onChange={(e) => setCustom(e.target.value)} className="pl-7" autoFocus />
              </div>
            )}
            {err("amount")}
          </div>

          <label className="flex items-center gap-3 text-sm">
            <Checkbox checked={anonymous} onCheckedChange={(v) => setAnonymous(v === true)} /> Give anonymously
          </label>

          <div className="space-y-3">
            {!anonymous && (
              <div className="animate-in fade-in"><Input placeholder="Full name" value={fields.name} onChange={set("name")} maxLength={100} />{err("name")}</div>
            )}
            <div><Input type="email" placeholder="Email address" value={fields.email} onChange={set("email")} maxLength={255} />{err("email")}</div>
            <div><Input type="tel" placeholder="Phone (optional)" value={fields.phone} onChange={set("phone")} maxLength={30} />{err("phone")}</div>
            <Textarea placeholder="Prayer request or dedication (optional)" value={fields.message} onChange={set("message")} maxLength={1000} rows={3} />
          </div>

          <div>
            <label className="flex items-start gap-3 text-xs text-muted-foreground">
              <Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5" />
              I agree that Voice of Revival may use my details to process and acknowledge my gift, in line with its privacy practices.
            </label>
            {err("consent")}
          </div>

          <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-gradient py-4 text-base font-bold text-primary-foreground shadow-glow transition-all hover:brightness-110">
            <HandHeart className="h-5 w-5" />
            Donate {amount > 0 ? `$${amount}` : ""}{frequency === "monthly" ? " monthly" : ""}
          </button>

          {notice && (
            <div role="status" className="flex gap-3 rounded-xl border border-primary/40 bg-primary/10 p-4 text-sm animate-in fade-in">
              <Info className="h-5 w-5 shrink-0 text-primary" />
              <p>Online giving is being set up and no payment has been taken. Please reach us through the contact form to arrange your gift in the meantime.</p>
            </div>
          )}
          <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground"><Lock className="h-3.5 w-3.5" /> Secure payments coming soon</p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
