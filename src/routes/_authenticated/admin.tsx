import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff, LogOut, Pencil, Plus, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { formatDate, formatPrice } from "@/components/events-section";
import logo from "@/assets/vor_logo.png";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — Voice of Revival" },
      { name: "description", content: "Manage Voice of Revival events and tickets." },
      { property: "og:title", content: "Admin Dashboard — Voice of Revival" },
      { property: "og:description", content: "Manage events and tickets." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

type Ev = Tables<"events">;
const schema = z.object({
  title: z.string().trim().min(1, "Title is required").max(150),
  description: z.string().trim().max(3000),
  poster_url: z.string(),
  starts_at: z.string().min(1, "Date is required"),
  venue: z.string().trim().min(1, "Venue is required").max(200),
  price: z.coerce.number().min(0).max(100000),
  currency: z.string().trim().length(3),
  capacity: z.coerce.number().int().min(0).max(1000000),
  published: z.boolean(),
});
type Form = Omit<z.input<typeof schema>, "price" | "capacity"> & { price: number | string; capacity: number | string };
const empty: Form = { title: "", description: "", poster_url: "", starts_at: "", venue: "", price: 0, currency: "usd", capacity: 100, published: false };

const toLocal = (iso: string) => {
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

function Admin() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [editing, setEditing] = useState<{ id?: string; form: Form } | null>(null);

  const role = useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data } = await supabase.rpc("has_role", { _user_id: u.user!.id, _role: "admin" });
      return { isAdmin: !!data, email: u.user?.email };
    },
  });
  const events = useQuery({
    queryKey: ["admin-events"],
    enabled: !!role.data?.isAdmin,
    queryFn: async () => (await supabase.from("events").select("*").order("starts_at", { ascending: false })).data ?? [],
  });
  const tickets = useQuery({
    queryKey: ["admin-tickets"],
    enabled: !!role.data?.isAdmin,
    queryFn: async () => (await supabase.from("tickets").select("*, events(title)").order("created_at", { ascending: false }).limit(50)).data ?? [],
  });

  const refresh = () => { qc.invalidateQueries({ queryKey: ["admin-events"] }); qc.invalidateQueries({ queryKey: ["public-events"] }); };

  async function signOut() {
    await qc.cancelQueries(); qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  async function save() {
    if (!editing) return;
    const r = schema.safeParse(editing.form);
    if (!r.success) return toast.error(r.error.issues[0]!.message);
    const { price, ...rest } = r.data;
    const row = { ...rest, poster_url: rest.poster_url || null, currency: rest.currency.toLowerCase(), price_cents: Math.round(price * 100), starts_at: new Date(rest.starts_at).toISOString(), updated_at: new Date().toISOString() };
    const { error } = editing.id
      ? await supabase.from("events").update(row).eq("id", editing.id)
      : await supabase.from("events").insert(row);
    if (error) return toast.error(error.message);
    toast.success("Event saved"); setEditing(null); refresh();
    return undefined;
  }
  async function togglePublish(ev: Ev) {
    const { error } = await supabase.from("events").update({ published: !ev.published }).eq("id", ev.id);
    error ? toast.error(error.message) : refresh();
  }
  async function remove(ev: Ev) {
    if (!confirm(`Delete "${ev.title}"? This also removes its ticket records.`)) return;
    const { error } = await supabase.from("events").delete().eq("id", ev.id);
    error ? toast.error(error.message) : (toast.success("Deleted"), refresh());
  }

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setEditing((e) => e && { ...e, form: { ...e.form, [k]: v } });
  const input = "w-full rounded-lg border border-input bg-muted/40 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-3"><img src={logo} alt="Voice of Revival" className="h-9 w-auto" /><span className="hidden font-display uppercase sm:inline">Admin</span></Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-muted-foreground md:inline">{role.data?.email}</span>
            <button onClick={signOut} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 hover:bg-muted"><LogOut className="h-4 w-4" /> Sign out</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-10">
        {role.isLoading ? null : !role.data?.isAdmin ? (
          <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-8 text-center">
            <h1 className="font-display text-3xl uppercase">No admin access</h1>
            <p className="mt-3 text-muted-foreground">Your account isn't an administrator. Contact the Voice of Revival team for access.</p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div><p className="eyebrow">Dashboard</p><h1 className="mt-2 font-display text-4xl uppercase">Events & Tickets</h1></div>
              <button onClick={() => setEditing({ form: empty })} className="inline-flex items-center gap-2 rounded-lg bg-red-gradient px-5 py-3 text-sm font-bold uppercase tracking-widest text-primary-foreground shadow-glow"><Plus className="h-4 w-4" /> New Event</button>
            </div>

            <div className="mt-8 grid gap-4">
              {events.data?.length === 0 && <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">No events yet — create your first one.</p>}
              {events.data?.map((ev) => (
                <div key={ev.id} className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center">
                  {ev.poster_url ? <img src={ev.poster_url} alt="" className="h-20 w-full rounded-md object-cover sm:w-32" /> : <div className="h-20 w-full rounded-md bg-muted sm:w-32" />}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate font-bold">{ev.title}</h3>
                      <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${ev.published ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{ev.published ? "Published" : "Draft"}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{formatDate(ev.starts_at)} · {ev.venue}</p>
                    <p className="text-sm text-muted-foreground">{formatPrice(ev.price_cents, ev.currency)} · {ev.tickets_sold}/{ev.capacity} sold</p>
                  </div>
                  <div className="flex gap-2">
                    <button title={ev.published ? "Unpublish" : "Publish"} onClick={() => togglePublish(ev)} className="rounded-md border border-border p-2.5 hover:bg-muted">{ev.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                    <button title="Edit" onClick={() => setEditing({ id: ev.id, form: { title: ev.title, description: ev.description, poster_url: ev.poster_url ?? "", starts_at: toLocal(ev.starts_at), venue: ev.venue, price: ev.price_cents / 100, currency: ev.currency, capacity: ev.capacity, published: ev.published } })} className="rounded-md border border-border p-2.5 hover:bg-muted"><Pencil className="h-4 w-4" /></button>
                    <button title="Delete" onClick={() => remove(ev)} className="rounded-md border border-border p-2.5 text-destructive hover:bg-muted"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </div>

            <h2 className="mt-14 font-display text-2xl uppercase">Recent ticket sales</h2>
            <div className="mt-4 overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted text-xs uppercase tracking-widest text-muted-foreground"><tr><th className="p-3">Code</th><th className="p-3">Event</th><th className="p-3">Buyer</th><th className="p-3">Qty</th><th className="p-3">Paid</th><th className="p-3">Date</th></tr></thead>
                <tbody>
                  {tickets.data?.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No tickets sold yet.</td></tr>}
                  {tickets.data?.map((t) => (
                    <tr key={t.id} className="border-t border-border">
                      <td className="p-3 font-mono font-bold text-primary">{t.ticket_code}</td>
                      <td className="p-3">{(t.events as { title: string } | null)?.title}</td>
                      <td className="p-3">{t.buyer_name ?? "—"}<div className="text-xs text-muted-foreground">{t.buyer_email}</div></td>
                      <td className="p-3">{t.quantity}</td>
                      <td className="p-3">{formatPrice(t.amount_cents, t.currency)}</td>
                      <td className="p-3 whitespace-nowrap">{formatDate(t.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-md" onClick={() => setEditing(null)}>
          <div className="max-h-[90vh] w-full max-w-2xl animate-rise overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-2xl sm:p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between"><h2 className="font-display text-2xl uppercase">{editing.id ? "Edit event" : "New event"}</h2><button aria-label="Close" onClick={() => setEditing(null)}><X className="h-5 w-5" /></button></div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2 text-sm font-semibold">Title<input className={`${input} mt-1.5`} value={editing.form.title} onChange={(e) => set("title", e.target.value)} /></label>
              <label className="sm:col-span-2 text-sm font-semibold">Description<textarea rows={4} className={`${input} mt-1.5`} value={editing.form.description} onChange={(e) => set("description", e.target.value)} /></label>
              <label className="sm:col-span-2 text-sm font-semibold">Poster image
                <input type="file" accept="image/*" className={`${input} mt-1.5`} onChange={async (e) => { const f = e.target.files?.[0]; if (f) { try { set("poster_url", await shrinkImage(f)); } catch { toast.error("Could not read that image"); } } }} />
                {editing.form.poster_url && <span className="mt-2 flex items-center gap-3"><img src={editing.form.poster_url} alt="" className="h-20 w-32 rounded-md object-cover" /><button type="button" className="text-xs underline" onClick={() => set("poster_url", "")}>Remove</button></span>}
              </label>
              <label className="text-sm font-semibold">Date & time<input type="datetime-local" className={`${input} mt-1.5`} value={editing.form.starts_at} onChange={(e) => set("starts_at", e.target.value)} /></label>
              <label className="text-sm font-semibold">Venue<input className={`${input} mt-1.5`} value={editing.form.venue} onChange={(e) => set("venue", e.target.value)} /></label>
              <label className="text-sm font-semibold">Ticket price (0 = free)<input type="number" min={0} step="0.01" className={`${input} mt-1.5`} value={String(editing.form.price)} onChange={(e) => set("price", e.target.value)} /></label>
              <label className="text-sm font-semibold">Currency<input maxLength={3} className={`${input} mt-1.5 uppercase`} value={editing.form.currency} onChange={(e) => set("currency", e.target.value)} /></label>
              <label className="text-sm font-semibold">Total tickets<input type="number" min={0} className={`${input} mt-1.5`} value={String(editing.form.capacity)} onChange={(e) => set("capacity", e.target.value)} /></label>
              <label className="flex items-center gap-3 self-end pb-2 text-sm font-semibold"><input type="checkbox" className="h-4 w-4 accent-primary" checked={editing.form.published} onChange={(e) => set("published", e.target.checked)} /> Published (visible on site)</label>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setEditing(null)} className="rounded-lg border border-border px-5 py-2.5 text-sm hover:bg-muted">Cancel</button>
              <button onClick={save} className="rounded-lg bg-red-gradient px-6 py-2.5 text-sm font-bold uppercase tracking-widest text-primary-foreground shadow-glow">Save event</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function shrinkImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 1200 / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      resolve(c.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
