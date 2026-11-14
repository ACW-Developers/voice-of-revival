import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { CheckoutReceipt } from "@/components/checkout-receipt";
export const Route = createFileRoute("/tickets/success")({
  validateSearch:z.object({session_id:z.string().optional()}),
  head:()=>({meta:[{title:"Your Ticket - Voice of Revival"},{name:"description",content:"Your Voice of Revival event ticket, receipt and unique admission QR code."},{property:"og:title",content:"Your Ticket - Voice of Revival"},{property:"og:description",content:"Private event ticket and receipt."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary"},{name:"robots",content:"noindex, nofollow"},{name:"referrer",content:"no-referrer"}]}),
  component:()=>{const {session_id}=Route.useSearch();return <CheckoutReceipt kind="ticket" sessionId={session_id}/>;},
});