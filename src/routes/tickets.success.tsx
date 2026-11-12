import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2, Printer } from "lucide-react";
import { z } from "zod";
import { confirmTicket } from "@/lib/events.functions";
import { formatDate, formatPrice } from "@/components/events-section";
import logo from "@/assets/vor_logo.png";

export const Route = createFileRoute("/tickets/success")({
  validateSearch: z.object({ session_id: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Your Ticket - Voice of Revival" },
      { name: "description", content: "Your Voice of Revival event ticket and receipt." },
      { property: "og:title", content: "Your Ticket - Voice of Revival" },
      { property: "og:description", content: "Event ticket and receipt." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Success,
});

function Success() {
  const { session_id } = Route.useSearch();
  const confirm = useServerFn(confirmTicket);
  const q = useQuery({
    queryKey: ["ticket", session_id],
    enabled: !!session_id,
    queryFn: () => confirm({ data: { sessionId: session_id! } }),
    retry: 1,
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-12">
      <div className="w-full max-w-lg">
        {q.isLoading ? (
          <div className="text-center">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Confirming your payment…</p>
          </div>
        ) : !session_id || q.isError || !q.data?.paid ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <h1 className="font-display text-3xl uppercase">Payment not confirmed</h1>
            <p className="mt-3 text-muted-foreground">
              We couldn't confirm a completed payment. If you were charged, please contact us.
            </p>
            <Link to="/" className="mt-6 inline-block text-primary hover:underline">
              Back to home
            </Link>
          </div>
        ) : (
          <div className="animate-rise overflow-hidden rounded-xl border border-border bg-card shadow-2xl print:shadow-none">
            <div className="bg-red-gradient p-6 text-center text-primary-foreground">
              <CheckCircle2 className="mx-auto h-10 w-10" />
              <h1 className="mt-3 font-display text-3xl uppercase">Payment Confirmed</h1>
              <p className="text-sm opacity-90">Your digital ticket & receipt</p>
            </div>
            <div className="space-y-5 p-8">
              <div className="flex items-center justify-between gap-4">
                <img src={logo} alt="Voice of Revival" className="h-10 w-auto" />
                <div className="text-right">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    Ticket code
                  </p>
                  <p className="font-mono text-xl font-bold tracking-widest text-primary">
                    {q.data.ticket.ticket_code}
                  </p>
                </div>
              </div>
              <div className="border-t border-dashed border-border pt-5">
                <h2 className="font-display text-2xl uppercase">{q.data.event.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatDate(q.data.event.starts_at)} · {q.data.event.venue}
                </p>
              </div>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-muted-foreground">Name</dt>
                  <dd className="font-semibold">{q.data.ticket.buyer_name ?? "-"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="break-all font-semibold">{q.data.ticket.buyer_email ?? "-"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Tickets</dt>
                  <dd className="font-semibold">{q.data.ticket.quantity}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Amount paid</dt>
                  <dd className="font-semibold">
                    {formatPrice(q.data.ticket.amount_cents, q.data.ticket.currency)}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-muted-foreground">Purchased</dt>
                  <dd className="font-semibold">{formatDate(q.data.ticket.created_at)}</dd>
                </div>
              </dl>
              <p className="text-xs text-muted-foreground">
                Show this ticket code at the entrance. Stripe also emails a payment receipt.
              </p>
              <div className="flex gap-3 print:hidden">
                <button
                  onClick={() => window.print()}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-border py-3 text-sm font-bold uppercase tracking-widest hover:bg-muted"
                >
                  <Printer className="h-4 w-4" /> Print / Save
                </button>
                <Link
                  to="/"
                  className="inline-flex flex-1 items-center justify-center rounded-lg bg-red-gradient py-3 text-sm font-bold uppercase tracking-widest text-primary-foreground"
                >
                  Home
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
