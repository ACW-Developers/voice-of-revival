import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getReceipt } from "@/lib/receipts.functions";
import { PaymentReceiptView } from "@/components/payment-receipt";
export const Route = createFileRoute("/receipts/$token")({
  head: () => ({ meta: [ {title:"Payment Receipt - Voice of Revival"}, {name:"description",content:"Your private Voice of Revival payment receipt and admission QR codes."}, {property:"og:title",content:"Payment Receipt - Voice of Revival"}, {property:"og:description",content:"Private payment confirmation."}, {property:"og:type",content:"website"}, {name:"twitter:card",content:"summary"}, {name:"robots",content:"noindex, nofollow"}, {name:"referrer",content:"no-referrer"} ] }),
  component: ReceiptPage,
});
function ReceiptPage() {
  const {token} = Route.useParams(); const read = useServerFn(getReceipt);
  const q = useQuery({queryKey:["receipt",token],queryFn:()=>read({data:{token}}),retry:false});
  return <main className="min-h-screen bg-background px-5 py-12">{q.data ? <PaymentReceiptView receipt={q.data}/> : <p className="text-center" role={q.isError ? "alert" : "status"}>{q.isError ? "Receipt unavailable. Check your private link." : "Preparing your receipt…"}</p>}<div className="mt-8 text-center"><Link to="/" className="text-primary">Return to Voice of Revival</Link></div></main>;
}