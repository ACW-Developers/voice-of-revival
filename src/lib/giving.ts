import { z } from "zod";

export const donationSchema = z.object({
  name: z.string().trim().max(100), email: z.string().trim().email().max(255),
  phone: z.string().trim().max(30).regex(/^[+\d\s()-]*$/), message: z.string().trim().max(1000),
  anonymous: z.boolean(), amount: z.number().finite().min(1).max(100000).refine(n => Math.abs(n * 100 - Math.round(n * 100)) < 0.00001, "Use at most two decimal places"),
  frequency: z.enum(["once", "monthly"]), consent: z.literal(true),
}).superRefine((d, ctx) => { if (!d.anonymous && d.name.length < 2) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["name"], message: "Please enter your name" }); });

export const contactSchema = z.object({ name: z.string().trim().min(1).max(100), email: z.string().trim().email().max(255), subject: z.string().trim().min(1).max(150), message: z.string().trim().min(1).max(2000) });
export function enquiryUrl(input: z.input<typeof contactSchema>) {
  const d = contactSchema.parse(input);
  return `https://wa.me/16025836044?text=${encodeURIComponent(`Voice of Revival enquiry\nName: ${d.name}\nEmail: ${d.email}\nSubject: ${d.subject}\n\n${d.message}`)}`;
}
type Sale = { quantity: number; amount_cents: number; currency: string; created_at: string };
export function ticketAnalytics(rows: Sale[]) {
  const revenue: Record<string, number> = {};
  const daily: Record<string, { orders: number; tickets: number; revenue: Record<string, number> }> = {};
  let tickets = 0;
  for (const r of rows) {
    tickets += r.quantity;
    revenue[r.currency] = (revenue[r.currency] ?? 0) + r.amount_cents;
    const day = r.created_at.slice(0,10);
    const d = daily[day] ??= { orders: 0, tickets: 0, revenue: {} };
    d.orders++; d.tickets += r.quantity; d.revenue[r.currency] = (d.revenue[r.currency] ?? 0) + r.amount_cents;
  }
  return { orders: rows.length, tickets, revenue, daily: Object.entries(daily).sort(([a],[b]) => b.localeCompare(a)) };
}