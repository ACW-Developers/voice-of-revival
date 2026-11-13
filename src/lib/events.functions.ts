import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireLivePayment } from "./payment-mode";

export function publicDb() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  const url = process.env["SUPABASE_URL"];
  if (!key || !url) throw new Error("Website connection is not configured.");
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function stripe(
  path: string,
  init?: { method?: string; body?: URLSearchParams },
): Promise<any> {
  const key = process.env["STRIPE_SECRET_KEY"];
  if (!key) throw new Error("Online ticketing is not configured yet.");
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: init?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    ...(init?.body ? { body: init.body } : {}),
  });
  const json = await res.json();
  if (!res.ok) {
    console.error("Stripe error", json?.error?.message);
    throw new Error("Payment service error. Please try again.");
  }
  return json;
}

export const createTicketCheckout = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        eventId: z.string().uuid(),
        quantity: z.number().int().min(1).max(10),
        origin: z.string().url(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { data: ev } = await publicDb()
      .from("events")
      .select("*")
      .eq("id", data.eventId)
      .eq("published", true)
      .maybeSingle();
    if (!ev) throw new Error("Event not found.");
    if (ev.price_cents <= 0) throw new Error("This event is free - no ticket purchase needed.");
    if (ev.capacity - ev.tickets_sold < data.quantity) throw new Error("Not enough tickets left.");
    const origin = new URL(data.origin).origin;
    const body = new URLSearchParams({
      mode: "payment",
      success_url: `${origin}/tickets/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/#events`,
      "line_items[0][quantity]": String(data.quantity),
      "line_items[0][price_data][currency]": ev.currency,
      "line_items[0][price_data][unit_amount]": String(ev.price_cents),
      "line_items[0][price_data][product_data][name]": `Ticket - ${ev.title}`,
      "metadata[event_id]": ev.id,
      "metadata[quantity]": String(data.quantity),
    });
    const session = requireLivePayment(await stripe("checkout/sessions", { method: "POST", body }));
    return { url: session.url as string };
  });

export const confirmTicket = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ sessionId: z.string().min(10).max(255) }).parse(d))
  .handler(async ({ data }) => {
    const s = requireLivePayment(await stripe(`checkout/sessions/${encodeURIComponent(data.sessionId)}`));
    if (s.payment_status !== "paid") return { paid: false as const };
    const secret = process.env["PAYMENT_RECORDING_SECRET"];
    if (!secret) throw new Error("Ticketing is not configured yet.");
    const { data: r, error } = await publicDb().rpc("record_ticket", {
      p_secret: secret,
      p_session_id: s.id,
      p_event_id: s.metadata?.event_id as string,
      p_quantity: Number(s.metadata?.quantity ?? 1),
      p_amount: s.amount_total,
      p_currency: s.currency,
      p_name: s.customer_details?.name ?? null,
      p_email: s.customer_details?.email ?? null,
    } as never);
    if (error || !r) throw new Error("Could not record your ticket. Please contact us.");
    const out = r as unknown as {
      ticket: Database["public"]["Tables"]["tickets"]["Row"];
      event: { title: string; starts_at: string; venue: string };
    };
    return { paid: true as const, ticket: out.ticket, event: out.event };
  });
