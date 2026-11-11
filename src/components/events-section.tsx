import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Calendar, MapPin, Ticket, Loader2, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { createTicketCheckout } from "@/lib/events.functions";
import type { Tables } from "@/integrations/supabase/types";

type Ev = Tables<"events">;

export const formatPrice = (cents: number, cur: string) =>
  cents <= 0
    ? "Free"
    : new Intl.NumberFormat("en-US", { style: "currency", currency: cur.toUpperCase() }).format(cents / 100);

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

function EventCard({ ev, poster }: { ev: Ev; poster: string }) {
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const checkout = useServerFn(createTicketCheckout);
  const left = Math.max(0, ev.capacity - ev.tickets_sold);
  const soldOut = left === 0;
  const free = ev.price_cents <= 0;

  async function buy() {
    setBusy(true);
    try {
      const { url } = await checkout({ data: { eventId: ev.id, quantity: qty, origin: window.location.origin } });
      window.location.href = url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start checkout");
      setBusy(false);
    }
  }

  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-border bg-background transition-all duration-500 hover:-translate-y-1 hover:border-primary/60 hover:shadow-glow">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img src={ev.poster_url || poster} alt={ev.title} loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <span className="absolute left-3 top-3 rounded-md bg-background/85 px-3 py-1 text-xs font-bold uppercase tracking-widest backdrop-blur">
          {formatPrice(ev.price_cents, ev.currency)}
        </span>
        <span className={`absolute right-3 top-3 rounded-md px-3 py-1 text-xs font-bold uppercase tracking-widest ${soldOut ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"}`}>
          {soldOut ? "Sold out" : `${left} left`}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-display text-2xl uppercase leading-tight">{ev.title}</h3>
        <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground"><Calendar className="h-4 w-4 text-primary" />{formatDate(ev.starts_at)}</p>
        <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4 text-primary" />{ev.venue}</p>
        <p className="mt-4 line-clamp-4 flex-1 text-sm text-muted-foreground">{ev.description}</p>
        {!free && !soldOut && (
          <div className="mt-6 flex items-center gap-3">
            <div className="flex items-center rounded-md border border-border">
              <button aria-label="Fewer tickets" className="p-2.5 hover:text-primary" onClick={() => setQty(Math.max(1, qty - 1))}><Minus className="h-4 w-4" /></button>
              <span className="w-8 text-center font-bold">{qty}</span>
              <button aria-label="More tickets" className="p-2.5 hover:text-primary" onClick={() => setQty(Math.min(10, left, qty + 1))}><Plus className="h-4 w-4" /></button>
            </div>
            <button onClick={buy} disabled={busy}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-red-gradient px-5 text-sm font-bold uppercase tracking-widest text-primary-foreground shadow-glow transition hover:brightness-110 disabled:opacity-60">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ticket className="h-4 w-4" />} Get Tickets
            </button>
          </div>
        )}
        {free && <p className="mt-6 text-sm font-bold uppercase tracking-widest text-primary">Free entry — all welcome</p>}
      </div>
    </article>
  );
}

export function EventsSection({ poster, heading }: { poster: string; heading: React.ReactNode }) {
  const { data, isLoading } = useQuery({
    queryKey: ["public-events"],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").eq("published", true).order("starts_at");
      if (error) throw error;
      return data;
    },
  });
  return (
    <section id="events" className="border-b border-border bg-card py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5">
        {heading}
        {isLoading ? (
          <div className="mt-14 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : data && data.length > 0 ? (
          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((ev) => <EventCard key={ev.id} ev={ev} poster={poster} />)}
          </div>
        ) : (
          <div className="mx-auto mt-14 max-w-2xl rounded-lg border border-dashed border-primary/50 p-6 text-center sm:p-10">
            <Calendar className="mx-auto h-10 w-10 text-primary" />
            <h3 className="mt-5 font-display text-3xl uppercase">New Gatherings Coming Soon</h3>
            <p className="mt-3 text-muted-foreground">Our next worship experiences are being prepared. Stay connected and be the first to hear when dates are announced.</p>
          </div>
        )}
      </div>
    </section>
  );
}
