import { createFileRoute } from "@tanstack/react-router";
import { verifyStripeSignature } from "@/lib/stripe-signature";
export const Route = createFileRoute("/api/public/stripe-webhook")({server:{handlers:{POST:async({request})=>{
  const secret=process.env["STRIPE_WEBHOOK_SECRET"];
  if(!secret) return new Response("Webhook not configured",{status:503});
  if(Number(request.headers.get("content-length")??0)>1000000) return new Response("Payload too large",{status:413});
  const body=await request.text();
  if(body.length>1000000) return new Response("Payload too large",{status:413});
  if(!await verifyStripeSignature(body,request.headers.get("stripe-signature")??"",secret)) return new Response("Invalid signature",{status:401});
  try {
    const {z}=await import("zod");
    const event=z.object({id:z.string(),type:z.string(),livemode:z.literal(true),data:z.object({object:z.record(z.any())})}).parse(JSON.parse(body));
    const {processStripeEvent}=await import("@/lib/payment-processing.server");
    await processStripeEvent(event);
    return Response.json({received:true});
  } catch { console.error("Stripe webhook processing failed; delivery should retry."); return new Response("Processing failed",{status:500}); }
}}}});