import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { donationSchema } from "./giving";
import { publicDb, stripe } from "./events.functions";

async function record(action: string, data: Record<string, unknown>) {
  const secret = process.env["TICKET_SECRET"];
  if (!secret) throw new Error("Donations are not configured yet.");
  const { data: result, error } = await publicDb().rpc("manage_donation", {
    p_secret: secret,
    p_action: action,
    p_data: data as never,
  });
  if (error || !result) throw new Error("Could not save donation details.");
  return result as { id: string; amount_cents: number; frequency: string };
}

export const createDonationCheckout = createServerFn({ method: "POST" })
  .inputValidator((d) => donationSchema.parse(d))
  .handler(async ({ data }) => {
    const origin = new URL(getRequest().url).origin;
    const order = await record("create", {
      ...data,
      name: data.anonymous ? "" : data.name,
      amount_cents: Math.round(data.amount * 100),
    });
    const body = new URLSearchParams({
      mode: data.frequency === "monthly" ? "subscription" : "payment",
      customer_email: data.email,
      success_url: `${origin}/donations/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?donation=cancelled#support`,
      "metadata[donation_order_id]": order.id,
      "line_items[0][quantity]": "1",
      "line_items[0][price_data][product]": "prod_Vch8SIn65YtDkW",
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][unit_amount]": String(order.amount_cents),
      "adaptive_pricing[enabled]": "false",
    });
    if (data.frequency === "monthly") {
      body.set("line_items[0][price_data][recurring][interval]", "month");
      body.set("subscription_data[metadata][donation_order_id]", order.id);
    }
    const session = await stripe("checkout/sessions", { method: "POST", body });
    await record("attach", { order_id: order.id, session_id: session.id });
    return { url: z.string().url().parse(session.url) };
  });

export const confirmDonation = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        sessionId: z
          .string()
          .regex(/^cs_[a-zA-Z0-9_]+$/)
          .max(255),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const s = await stripe(`checkout/sessions/${encodeURIComponent(data.sessionId)}`);
    if (s.payment_status !== "paid" || !s.metadata?.donation_order_id)
      return { paid: false as const };
    const invoice = s.invoice ? await stripe(`invoices/${encodeURIComponent(s.invoice)}`) : null;
    const result = await record("paid", {
      order_id: s.metadata.donation_order_id,
      session_id: s.id,
      subscription_id: s.subscription ?? undefined,
      payment_id: invoice?.id ?? s.payment_intent,
      amount_cents: s.amount_total,
      currency: s.currency,
      paid_at: invoice?.status_transitions?.paid_at ?? s.created,
    });
    return { paid: true as const, amount: result.amount_cents, frequency: result.frequency };
  });

// Reconcile paid monthly invoices on authenticated dashboard visits; never count a promised renewal as revenue.
export const syncDonations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleError || !isAdmin) throw new Error("Administrator access required.");
    const orders = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await context.supabase
        .from("donation_orders")
        .select("id,stripe_session_id,subscription_id")
        .order("id")
        .range(from, from + 999);
      if (error) throw new Error("Could not load donation orders.");
      orders.push(...data);
      if (data.length < 1000) break;
    }
    for (const order of orders ?? []) {
      if (!order.stripe_session_id) continue;
      const session = await stripe(
        `checkout/sessions/${encodeURIComponent(order.stripe_session_id)}`,
      );
      if (session.payment_status !== "paid") continue;
      const sub = session.subscription ?? order.subscription_id;
      if (!sub) {
        await record("paid", {
          order_id: order.id,
          session_id: session.id,
          payment_id: session.payment_intent,
          amount_cents: session.amount_total,
          currency: session.currency,
          paid_at: session.created,
        });
        continue;
      }
      await record("attach", { order_id: order.id, subscription_id: sub });
      let after = "";
      for (let page = 0; page < 20; page++) {
        const params = new URLSearchParams({ subscription: sub, status: "paid", limit: "100" });
        if (after) params.set("starting_after", after);
        const invoices = await stripe(`invoices?${params}`);
        for (const invoice of invoices.data) {
          if (invoice.amount_paid > 0)
            await record("paid", {
              order_id: order.id,
              payment_id: invoice.id,
              amount_cents: invoice.amount_paid,
              currency: invoice.currency,
              paid_at: invoice.status_transitions.paid_at,
            });
        }
        if (!invoices.has_more) break;
        after = invoices.data.at(-1)?.id ?? "";
        if (!after || page === 19) throw new Error("Donation history needs another refresh.");
      }
    }
    return { synced: true };
  });
