import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { HandHeart, Loader2 } from "lucide-react";
import { confirmDonation } from "@/lib/donations.functions";
import { formatPrice } from "@/components/events-section";

export const Route = createFileRoute("/donations/success")({
  validateSearch: z.object({ session_id: z.string().optional() }),
  head: () => ({meta:[{title:"Donation Receipt — Voice of Revival"},{name:"description",content:"Confirm your gift supporting Voice of Revival."},{property:"og:title",content:"Donation Receipt — Voice of Revival"},{property:"og:description",content:"Your Voice of Revival donation receipt."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary"},{name:"robots",content:"noindex"}]}),
  component: Receipt,
});
function Receipt() {
  const {session_id} = Route.useSearch();
  const confirm = useServerFn(confirmDonation);
  const q=useQuery({queryKey:["donation-receipt",session_id],enabled:!!session_id,queryFn:()=>{if(!session_id) throw new Error("Missing receipt"); return confirm({data:{sessionId:session_id}});},retry:1});
  return <main className="flex min-h-screen items-center justify-center bg-background px-5 py-12"><div className="w-full max-w-lg text-center">
    {q.isLoading ? <Loader2 className="mx-auto animate-spin text-primary"/> : <>
      <HandHeart className="mx-auto h-12 w-12 text-primary"/>
      <h1 className="mt-6 font-display text-4xl uppercase">{q.data?.paid ? "Thank you for your gift" : "Payment not confirmed"}</h1>
      <p className="mt-5 text-muted-foreground">{q.data?.paid ? `${formatPrice(q.data.amount,"usd")} received${q.data.frequency === "monthly" ? " — monthly donation" : ""}. Your support makes a difference.` : "We could not confirm your donation. If you were charged, contact Voice of Revival before trying again."}</p>
    </>}
    <Link to="/" className="mt-8 inline-block font-semibold text-primary">Return to Voice of Revival</Link>
  </div></main>;
}