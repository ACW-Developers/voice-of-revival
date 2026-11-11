import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function stripe(path: string, init?: { method?: string; body?: URLSearchParams }): Promise<any> {
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
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: ev } = await supabaseAdmin
      .from("events")
      .select("*")
      .eq("id", data.eventId)
      .eq("published", true)
      .maybeSingle();
    if (!ev) throw new Error("Event not found.");
    if (ev.price_cents <= 0) throw new Error("This event is free — no ticket purchase needed.");
    if (ev.capacity - ev.tickets_sold < data.quantity) throw new Error("Not enough tickets left.");
    const origin = new URL(data.origin).origin;
    const body = new URLSearchParams({
      mode: "payment",
      success_url: `${origin}/tickets/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/#events`,
      "line_items[0][quantity]": String(data.quantity),
      "line_items[0][price_data][currency]": ev.currency,
      "line_items[0][price_data][unit_amount]": String(ev.price_cents),
      "line_items[0][price_data][product_data][name]": `Ticket — ${ev.title}`,
      "metadata[event_id]": ev.id,
      "metadata[quantity]": String(data.quantity),
    });
    const session = await stripe("checkout/sessions", { method: "POST", body });
    return { url: session.url as string };
  });

export const confirmTicket = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ sessionId: z.string().min(10).max(255) }).parse(d))
  .handler(async ({ data }) => {
    const s = await stripe(`checkout/sessions/${encodeURIComponent(data.sessionId)}`);
    if (s.payment_status !== "paid") return { paid: false as const };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const eventId = s.metadata?.event_id as string;
    const quantity = Number(s.metadata?.quantity ?? 1);
    let { data: ticket } = await supabaseAdmin
      .from("tickets")
      .select("*")
      .eq("stripe_session_id", s.id)
      .maybeSingle();
    if (!ticket) {
      const ins = await supabaseAdmin
        .from("tickets")
        .insert({
          event_id: eventId,
          stripe_session_id: s.id,
          buyer_name: s.customer_details?.name ?? null,
          buyer_email: s.customer_details?.email ?? null,
          quantity,
          amount_cents: s.amount_total,
          currency: s.currency,
        })
        .select("*")
        .single();
      ticket = ins.data;
      if (ticket) {
        const { data: ev } = await supabaseAdmin.from("events").select("tickets_sold").eq("id", eventId).single();
        if (ev) await supabaseAdmin.from("events").update({ tickets_sold: ev.tickets_sold + quantity }).eq("id", eventId);
      } else {
        ticket = (await supabaseAdmin.from("tickets").select("*").eq("stripe_session_id", s.id).single()).data;
      }
    }
    const { data: ev } = await supabaseAdmin
      .from("events")
      .select("title, starts_at, venue")
      .eq("id", eventId)
      .single();
    return { paid: true as const, ticket: ticket!, event: ev! };
  });
