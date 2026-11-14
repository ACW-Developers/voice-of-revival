import { useEffect, useState } from "react";
import { Download, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import type { PaymentReceipt } from "@/lib/receipts";
import { receiptPdf, deliverReceipt } from "@/lib/receipt-pdf";
import { formatDate, formatPrice } from "./events-section";
import logo from "@/assets/vor_logo.png";

export function PaymentReceiptView({ receipt }: { receipt: PaymentReceipt }) {
  const [codes, setCodes] = useState<string[]>([]);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    void Promise.all([receiptPdf(receipt), import("qrcode").then(async (qr) => {
      const payloads = receipt.kind === "ticket" ? receipt.admissions.map(a => `vor:ticket:${a.token}`) : [`${window.location.origin}/receipts/${receipt.access_token}`];
      return Promise.all(payloads.map(p => qr.toDataURL(p, { width: 240, margin: 2 })));
    })]).then(([pdf, images]) => { if (active) { setBlob(pdf); setCodes(images); } }).catch(() => { if (active) setError("Receipt download could not prepare. Reload to try again."); });
    return () => { active = false; };
  }, [receipt]);
  const d = receipt.details;
  return <article className="mx-auto w-full max-w-2xl border border-border bg-card p-6 sm:p-10 rounded-lg">
    <div className="flex items-center justify-between gap-4"><img src={logo} alt="Voice of Revival" className="w-36" /><CheckCircle2 className="text-primary" /></div>
    <p className="mt-8 text-xs font-bold uppercase text-primary">{receipt.status === "paid" ? "Payment confirmed" : receipt.status.replaceAll("_", " ")}</p>
    <h1 className="mt-2 font-display text-3xl uppercase">{receipt.kind === "ticket" ? "Your event ticket" : "Thank you for your gift"}</h1>
    <p className="mt-3 text-lg font-semibold">{d.event?.title ?? "Voice of Revival"}</p>
    <dl className="mt-6 grid grid-cols-1 gap-5 text-sm sm:grid-cols-2">
      <div><dt className="text-muted-foreground">Name</dt><dd>{d.buyer_name ?? d.donor?.name ?? "Guest"}</dd></div>
      <div><dt className="text-muted-foreground">Email</dt><dd className="break-all">{d.buyer_email ?? d.donor?.email}</dd></div>
      <div><dt className="text-muted-foreground">Amount received</dt><dd className="font-bold">{formatPrice(d.amount_cents,d.currency)}</dd></div>
      <div><dt className="text-muted-foreground">Paid</dt><dd>{formatDate(d.paid_at ?? d.created_at)}</dd></div>
      {d.event && <><div><dt className="text-muted-foreground">Event date</dt><dd>{formatDate(d.event.starts_at)}</dd></div><div><dt className="text-muted-foreground">Venue</dt><dd>{d.event.venue}</dd></div></>}
    </dl>
    <div className="mt-8 grid gap-4 sm:grid-cols-2">{codes.map((code,i) => <div key={code} className="border-t border-border pt-5"><img src={code} alt={receipt.kind === "ticket" ? `Admission ${i+1} QR code` : "Private receipt QR code"} className="h-44 w-44"/><p className="mt-2 text-sm font-semibold">{receipt.kind === "ticket" ? `Admission ${i+1} of ${d.quantity} · ${receipt.admissions[i]?.redeemed_at ? "Redeemed" : "Not redeemed"}` : "Receipt verification"}</p></div>)}</div>
    <p className="mt-6 break-all text-xs text-muted-foreground">Receipt {receipt.id}</p>
    {error && <p role="alert" className="mt-3 text-destructive">{error}</p>}
    <Button className="mt-6 w-full" disabled={!blob} onClick={() => { if (blob) void deliverReceipt(blob,`voice-of-revival-${receipt.kind}-${receipt.id}.pdf`); }}>{blob ? <Download/> : <Loader2 className="animate-spin"/>} Download {receipt.kind === "ticket" ? "ticket & receipt" : "receipt"}</Button>
  </article>;
}