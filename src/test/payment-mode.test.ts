import { describe, expect, it } from "vitest";
import { requireLivePayment } from "../lib/payment-mode";

describe("live payments", () => {
  it("accepts a live Stripe checkout", () => {
    const session = { livemode: true, id: "live-session" };
    expect(requireLivePayment(session)).toBe(session);
  });
  it("rejects test-mode checkouts and receipts", () => {
    expect(() => requireLivePayment({ livemode: false })).toThrow("Live payments");
  });
  it("rejects an unverified payment mode", () => {
    expect(() => requireLivePayment({})).toThrow("Live payments");
  });
});