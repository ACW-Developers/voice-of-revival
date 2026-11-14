import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { CheckoutReceipt } from "@/components/checkout-receipt";
export const Route=createFileRoute("/donations/success")({
  validateSearch:z.object({session_id:z.string().optional()}),
  head:()=>({meta:[{title:"Donation Receipt - Voice of Revival"},{name:"description",content:"Your private receipt for a gift supporting Voice of Revival."},{property:"og:title",content:"Donation Receipt - Voice of Revival"},{property:"og:description",content:"Your Voice of Revival donation receipt."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary"},{name:"robots",content:"noindex, nofollow"},{name:"referrer",content:"no-referrer"}]}),
  component:()=>{const {session_id}=Route.useSearch();return <CheckoutReceipt kind="donation" sessionId={session_id}/>;},
});