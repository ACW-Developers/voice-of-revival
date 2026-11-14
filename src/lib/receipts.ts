import { z } from "zod";

export const tokenSchema = z.string().uuid();
export function admissionToken(input: string) {
  const match = /^vor:ticket:([a-f\d-]{36})$/i.exec(input.trim());
  return tokenSchema.parse(match?.[1] ?? input.trim());
}
export type PaymentReceipt = {
  id: string; access_token: string; kind: "ticket" | "donation"; status: string; created_at: string;
  details: {
    amount_cents: number; currency: string; created_at: string; paid_at?: string;
    buyer_name?: string; buyer_email?: string; quantity?: number; ticket_code?: string;
    event?: { id: string; title: string; starts_at: string; venue: string };
    donor?: { name: string; email: string; frequency: string };
  };
  admissions: { token: string; seat: number; redeemed_at: string | null }[];
};
export type EntryResult = {
  status: "invalid" | "wrong_event" | "void" | "valid" | "redeemed" | "already_redeemed";
  name?: string; email?: string; event?: string; seat?: number; quantity?: number; code?: string; redeemed_at?: string;
};
export function entryAllowed(status: EntryResult["status"]) { return status === "valid"; }