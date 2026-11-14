import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { publicDb } from "./events.functions";
import { tokenSchema, type PaymentReceipt, type EntryResult } from "./receipts";

export const getReceipt = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: tokenSchema }).parse(d))
  .handler(async ({ data }) => {
    const { data: receipt, error } = await publicDb().rpc("get_payment_receipt", { p_token: data.token });
    if (error || !receipt) throw new Error("Receipt not found. Check your private receipt link.");
    return receipt as unknown as PaymentReceipt;
  });

export const validateEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ token: tokenSchema, eventId: tokenSchema, redeem: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: result, error } = await context.supabase.rpc("validate_ticket_entry", {
      p_token: data.token, p_event_id: data.eventId, p_redeem: data.redeem,
    });
    if (error) throw new Error("Unable to validate entry. Administrator access and an online connection are required.");
    return result as unknown as EntryResult;
  });