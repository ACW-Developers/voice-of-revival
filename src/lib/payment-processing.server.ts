import { publicDb, stripe } from "./events.functions";
import { requireLivePayment } from "./payment-mode";

function recordingSecret() {
  const secret = process.env["PAYMENT_RECORDING_SECRET"];
  if (!secret) throw new Error("Payment receipt configuration is missing. Contact Voice of Revival; do not pay again.");
  return secret;
}
export async function confirmPaidSession(sessionId: string, kind: "ticket" | "donation") {
  const s = requireLivePayment(await stripe(`checkout/sessions/${encodeURIComponent(sessionId)}`));
  if (s.payment_status !== "paid" || s.status !== "complete") return { paid: false as const };
  const secret = recordingSecret(); let paymentId = s.id;
  if (kind === "ticket") {
    if (!s.metadata?.event_id || !/^\d+$/.test(s.metadata?.quantity ?? "")) throw new Error("Not an event checkout.");
    const {error} = await publicDb().rpc("record_ticket", {
      p_secret:secret,p_session_id:s.id,p_event_id:s.metadata.event_id,p_quantity:Number(s.metadata.quantity),
      p_amount:s.amount_total,p_currency:s.currency,p_name:s.customer_details?.name ?? "Guest",p_email:s.customer_details?.email ?? "",
    });
    if (error) throw new Error("Your payment was received but the ticket could not be saved. Please contact Voice of Revival; do not pay again.");
  } else {
    if (!s.metadata?.donation_order_id) throw new Error("Not a donation checkout.");
    const invoice = s.invoice ? requireLivePayment(await stripe(`invoices/${encodeURIComponent(s.invoice)}`)) : null;
    paymentId = invoice?.id ?? s.payment_intent;
    const { error } = await publicDb().rpc("manage_donation", {
      p_secret:secret,p_action:"paid",p_data:{order_id:s.metadata.donation_order_id,session_id:s.id,subscription_id:s.subscription,
        payment_id:paymentId,amount_cents:s.amount_total,currency:s.currency,paid_at:invoice?.status_transitions?.paid_at ?? s.created},
    });
    if (error) throw new Error("Your gift was received but the receipt could not be saved. Please contact Voice of Revival; do not pay again.");
  }
  const {data:token,error} = await publicDb().rpc("receipt_for_payment", {p_secret:secret,p_kind:kind,p_payment_id:paymentId});
  if (error || !token) throw new Error("Receipt is not ready. Please refresh; do not pay again.");
  return { paid:true as const, receiptToken:token };
}
export async function processStripeEvent(event: { type:string; data:{object:Record<string, any>} }) {
  const object = requireLivePayment(event.data.object);
  if (["checkout.session.completed","checkout.session.async_payment_succeeded"].includes(event.type)) {
    await confirmPaidSession(object.id, object.metadata?.donation_order_id ? "donation" : "ticket");
  } else if (event.type === "invoice.paid") {
    const invoice = requireLivePayment(await stripe(`invoices/${encodeURIComponent(object.id)}`));
    const subscriptionId = invoice.subscription ?? invoice.parent?.subscription_details?.subscription;
    if (!subscriptionId || invoice.amount_paid <= 0) return;
    const subscription = requireLivePayment(await stripe(`subscriptions/${encodeURIComponent(subscriptionId)}`));
    const orderId = subscription.metadata?.donation_order_id;
    if (!orderId) return;
    const {error} = await publicDb().rpc("manage_donation", {p_secret:recordingSecret(),p_action:"paid",p_data:{
      order_id:orderId,subscription_id:subscriptionId,payment_id:invoice.id,amount_cents:invoice.amount_paid,currency:invoice.currency,paid_at:invoice.status_transitions.paid_at,
    }});
    if (error) throw new Error("Invoice recording failed");
  } else if (["charge.refunded","charge.dispute.created","charge.dispute.closed"].includes(event.type)) {
    const charge = event.type === "charge.refunded" ? object : await stripe(`charges/${encodeURIComponent(object.charge)}`);
    const params = new URLSearchParams({payment_intent:charge.payment_intent,limit:"1"});
    const sessions = await stripe(`checkout/sessions?${params}`);
    const s = sessions.data?.[0]; if (!s) return;
    let status = "disputed";
    if (event.type === "charge.refunded") status = charge.amount_refunded === charge.amount ? "refunded" : "partially_refunded";
    if (event.type === "charge.dispute.closed") status = object.status === "won" ? "paid" : "disputed";
    const {error} = await publicDb().rpc("update_payment_status",{p_secret:recordingSecret(),p_payment_id:s.metadata?.donation_order_id ? (charge.invoice ?? charge.payment_intent) : s.id,p_status:status});
    if(error) throw new Error("Payment status recording failed");
  }
}