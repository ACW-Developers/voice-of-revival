import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { FileDown, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import { formatPrice, formatDate } from "./events-section";
import type { PaymentReceipt } from "@/lib/receipts";
export function AdminReceipts() {
  const q=useQuery({queryKey:["admin-receipts"],queryFn:async()=>{
    const rows=[];
    for(let offset=0;;offset+=500){
      const {data,error}=await supabase.from("payment_receipts").select("*").order("created_at",{ascending:false}).order("id").range(offset,offset+499);
      if(error) throw error; rows.push(...data);if(data.length<500)return rows;
    }
  }});
  return <section className="mt-12 border-t border-border pt-8"><div className="flex items-center justify-between gap-4"><h2 className="font-display text-2xl uppercase">Paid tickets & receipt history</h2><Button variant="outline" size="icon" aria-label="Refresh receipts" title="Refresh receipts" onClick={()=>void q.refetch()}><RefreshCw/></Button></div>
    {q.isError && <p role="alert" className="mt-4 text-destructive">Receipt history could not load.</p>}
    <div className="mt-5 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-border text-muted-foreground"><tr><th className="py-3">Buyer / donor</th><th>Type</th><th>Amount</th><th>Status</th><th>Date</th><th>Copy</th></tr></thead><tbody>{q.data?.map(r=>{const d=r.details as unknown as PaymentReceipt["details"];return <tr key={r.id} className="border-b border-border"><td className="py-4 pr-4"><p className="font-semibold">{d.buyer_name ?? d.donor?.name ?? "Guest"}</p><p className="break-all text-xs text-muted-foreground">{d.buyer_email ?? d.donor?.email}</p><p className="text-xs">{d.event?.title}</p></td><td className="pr-4 capitalize">{r.kind}</td><td className="pr-4 whitespace-nowrap">{formatPrice(d.amount_cents,d.currency)}</td><td className="pr-4 capitalize">{r.status.replaceAll("_"," ")}</td><td className="pr-4 whitespace-nowrap">{formatDate(r.created_at)}</td><td><Button asChild variant="outline" size="sm"><Link to="/receipts/$token" params={{token:r.access_token}}><FileDown/> View / download</Link></Button></td></tr>;})}</tbody></table></div>
    {!q.isLoading && !q.data?.length && <p className="mt-5 text-muted-foreground">No paid receipts yet.</p>}
  </section>;
}