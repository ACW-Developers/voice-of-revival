import { describe, it, expect } from "vitest";
import { donationSchema, enquiryUrl, ticketAnalytics } from "../lib/giving";
const gift = {
  name: "Test donor",
  email: "test@example.com",
  phone: "",
  message: "",
  anonymous: false,
  amount: 20,
  frequency: "once",
  consent: true,
};
describe("giving and administration", () => {
  it("accepts the requested donation presets", () => {
    for (const amount of [1, 2, 5, 10, 20, 50, 100])
      expect(donationSchema.safeParse({ ...gift, amount }).success).toBe(true);
  });
  it("rejects sub-dollar and fractional-cent donations", () => {
    expect(donationSchema.safeParse({ ...gift, amount: 0.99 }).success).toBe(false);
    expect(donationSchema.safeParse({ ...gift, amount: 1.001 }).success).toBe(false);
  });
  it("requires consent", () => {
    expect(donationSchema.safeParse({ ...gift, consent: false }).success).toBe(false);
  });
  it("allows an anonymous donor without a name", () => {
    expect(donationSchema.safeParse({ ...gift, name: "", anonymous: true }).success).toBe(true);
  });
  it("prepares enquiries for the provided WhatsApp number", () => {
    const url = enquiryUrl({
      name: "Test",
      email: "test@example.com",
      subject: "A & B",
      message: "Hello",
    });
    expect(url.startsWith("https://wa.me/16025836044?text=")).toBe(true);
    expect(decodeURIComponent(url)).toContain("A & B");
  });
  it("totals orders and ticket quantities separately and groups daily revenue by currency", () => {
    const result = ticketAnalytics([
      { quantity: 3, amount_cents: 6000, currency: "usd", created_at: "2026-11-12T10:00:00Z" },
      { quantity: 2, amount_cents: 3000, currency: "usd", created_at: "2026-11-12T11:00:00Z" },
      { quantity: 1, amount_cents: 2000, currency: "eur", created_at: "2026-11-11T10:00:00Z" },
    ]);
    expect(result.orders).toBe(3);
    expect(result.tickets).toBe(6);
    expect(result.revenue).toEqual({ usd: 9000, eur: 2000 });
    expect(result.daily[0]?.[1].tickets).toBe(5);
  });
});
