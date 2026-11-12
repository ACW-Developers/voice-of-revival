import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { RefreshCw, Ticket, Receipt, HandHeart, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { syncDonations } from "@/lib/donations.functions";
import { ticketAnalytics } from "@/lib/giving";
import { formatDate, formatPrice } from "@/components/events-section";
import { Button } from "@/components/ui/button";

async function allTickets() {
  const rows = [];
  for(let from=0;;from+=1000) {
    const {data,error}=await supabase.from("tickets").select("quantity,amount_cents,currency,created_at").order("id").range(from,from+999);
    if(error) throw error;
    rows.push(...data);
    if(data.length<1000) return rows;
  }
}
function money(values: Record<string,number>) { return Object.entries(values).map(([currency,cents])=>formatPrice(cents,currency)).join(" · ") || "$0.00"; }

export function AdminAnalytics() {
  const sync = useServerFn(syncDonations);
  const [syncError,setSyncError]=useState("");
  const tickets = useQuery({queryKey:["ticket-analytics"],queryFn:allTickets});
  const donations = useQuery({queryKey:["admin-donations"],queryFn:async()=>{
    try { await sync(); setSyncError(""); } catch(e) { setSyncError(e instanceof Error ? e.message : "Payment history could not refresh"); }
    const rows=[];
    for(let from=0;;from+=1000) {
      const {data,error}=await supabase.from("donations").select("*,donation_orders(name,email,anonymous,frequency,message)").order("paid_at",{ascending:false}).range(from,from+999);
      if(error) throw error;
      rows.push(...data);
      if(data.length<1000) return rows;
    }
  }});
  const totals=ticketAnalytics(tickets.data ?? []);
  const gifts=donations.data ?? [];
  const giftTotal=gifts.reduce((sum,d)=>sum+d.amount_cents,0);
  const donors=new Set(gifts.map(d=>d.donation_orders?.email)).size;
  const donorTotals = new Map<string, {name: string; cents: number; count: number}>();
  for (const gift of gifts) {
    const email = gift.donation_orders?.email ?? "";
    const total = donorTotals.get(email) ?? { name: gift.donation_orders?.anonymous ? "Anonymous" : gift.donation_orders?.name ?? "Donor", cents: 0, count: 0 };
    total.cents += gift.amount_cents; total.count++;
    donorTotals.set(email, total);
  }
  const cards=[{label:"Ticket purchases",value:totals.orders,icon:ShoppingBag},{label:"Tickets purchased",value:totals.tickets,icon:Ticket},{label:"Ticket revenue",value:money(totals.revenue),icon:Receipt},{label:"Donations received",value:giftTotal ? formatPrice(giftTotal,"usd") : "$0.00",icon:HandHeart}];
  return <section className="mt-8 border-y border-border py-8">
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3"><h2 className="font-display text-2xl uppercase">Giving & Ticket Analytics</h2><Button variant="outline" size="icon" title="Refresh payment history" aria-label="Refresh payment history" disabled={donations.isFetching || tickets.isFetching} onClick={()=>{void tickets.refetch();void donations.refetch();}}><RefreshCw className={donations.isFetching ? "animate-spin" : ""}/></Button></div>
    {(tickets.isError || donations.isError || syncError) && <p role="alert" className="mt-3 text-sm text-destructive">{syncError || "Some financial data could not load. Please refresh."}</p>}
    <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{cards.map(c=><div key={c.label} className="min-w-0 border-l-2 border-primary pl-5"><c.icon className="h-5 w-5 text-primary"/><p className="mt-4 text-sm text-muted-foreground">{c.label}</p><p className="mt-1 break-words text-2xl font-bold">{tickets.isLoading || donations.isLoading ? "—" : c.value}</p></div>)}</div>
    <div className="mt-10 grid gap-10 lg:grid-cols-2">
      <div className="min-w-0"><h3 className="font-semibold">Daily ticket sales <span className="text-xs font-normal text-muted-foreground">UTC</span></h3><div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-border text-muted-foreground"><tr><th className="py-3">Date</th><th>Purchases</th><th>Tickets</th><th>Revenue</th></tr></thead><tbody>{totals.daily.map(([date,d])=><tr key={date} className="border-b border-border"><td className="py-3">{date}</td><td>{d.orders}</td><td>{d.tickets}</td><td>{money(d.revenue)}</td></tr>)}</tbody></table>{!totals.daily.length && <p className="py-6 text-muted-foreground">No ticket sales yet.</p>}</div></div>
      <div className="min-w-0"><h3 className="font-semibold">Donation history <span className="ml-2 text-xs font-normal text-muted-foreground">{gifts.length} gifts · {donors} donors</span></h3><div className="mt-4 max-h-96 overflow-auto"><table className="w-full text-left text-sm"><thead className="border-b border-border text-muted-foreground"><tr><th className="py-3">Donor</th><th>Received</th><th>Date</th></tr></thead><tbody>{gifts.map(d=><tr key={d.id} className="border-b border-border"><td className="py-3 pr-4"><p className="font-semibold">{d.donation_orders?.anonymous ? "Anonymous" : d.donation_orders?.name}</p><p className="break-all text-xs text-muted-foreground">{d.donation_orders?.email}</p><p className="text-xs text-primary">{d.donation_orders?.frequency === "monthly" ? "Monthly" : "One-time"}</p>{d.donation_orders?.message && <p className="mt-1 max-w-xs whitespace-pre-wrap text-xs text-muted-foreground">{d.donation_orders.message}</p>}</td><td className="pr-4">{formatPrice(d.amount_cents,d.currency)}</td><td className="text-xs">{formatDate(d.paid_at)}</td></tr>)}</tbody></table>{!gifts.length && <p className="py-6 text-muted-foreground">No confirmed donations yet.</p>}</div></div>
    </div>
    {donorTotals.size > 0 && <div className="mt-8"><h3 className="font-semibold">Cumulative giving by donor</h3><div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from(donorTotals,([email,total])=><div key={email} className="min-w-0 border-l border-border pl-4"><p className="font-semibold">{total.name}</p><p className="break-all text-xs text-muted-foreground">{email}</p><p className="mt-1 text-sm">{formatPrice(total.cents,"usd")} · {total.count} gifts</p></div>)}</div></div>}
  </section>;
}