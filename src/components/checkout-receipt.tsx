import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { RefreshCw } from "lucide-react";
import { confirmTicket } from "@/lib/events.functions";
import { confirmDonation } from "@/lib/donations.functions";
import { getReceipt } from "@/lib/receipts.functions";
import { PaymentReceiptView } from "./payment-receipt";
import { Button } from "./ui/button";
export function CheckoutReceipt({sessionId,kind}:{sessionId?:string;kind:"ticket"|"donation"}) {
  const confirm=useServerFn(kind==="ticket" ? confirmTicket : confirmDonation);
  const read=useServerFn(getReceipt);
  const q=useQuery({queryKey:["paid-receipt",kind,sessionId],enabled:!!sessionId,retry:2,retryDelay:1500,queryFn:async()=>{
    if(!sessionId) throw new Error("Missing checkout reference.");
    const result=await confirm({data:{sessionId}});
    if(!result.paid) return null;
    return read({data:{token:result.receiptToken}});
  }});
  return <main className="min-h-screen bg-background px-5 py-12">
    {q.data ? <PaymentReceiptView receipt={q.data}/> : <div className="mx-auto max-w-lg text-center py-12"><h1 className="font-display text-3xl uppercase">{q.isFetching ? "Preparing your receipt" : "Payment confirmation pending"}</h1><p className="mt-5 text-muted-foreground">{q.isFetching ? "Checking your payment securely…" : q.error instanceof Error ? q.error.message : "A completed payment could not be confirmed yet. If you were charged, do not pay again. Refresh or contact Voice of Revival."}</p>{sessionId && <Button className="mt-6" variant="outline" disabled={q.isFetching} onClick={()=>void q.refetch()}><RefreshCw/> Check again</Button>}</div>}
    <div className="mt-8 text-center"><Link to="/" className="text-primary">Return to Voice of Revival</Link></div>
  </main>;
}