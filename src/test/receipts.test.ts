import { describe, expect, it } from "vitest";
import { admissionToken, entryAllowed } from "../lib/receipts";
import { verifyStripeSignature } from "../lib/stripe-signature";
describe("ticket entry rules",()=>{
  it("allows entry only after a ticket is verified valid",()=>{expect(entryAllowed("valid")).toBe(true);});
  it("prevents duplicate entry from redeemed tickets",()=>{expect(entryAllowed("already_redeemed")).toBe(false);expect(entryAllowed("redeemed")).toBe(false);});
  it("rejects invalid, wrong-event and void tickets",()=>{for(const status of ["invalid","wrong_event","void"] as const)expect(entryAllowed(status)).toBe(false);});
  it("accepts a unique admission token, not a receipt URL or old ticket code",()=>{
    const token="e184b9ea-b8aa-4eb5-9bfb-24de18dba4c3";
    expect(admissionToken(`vor:ticket:${token}`)).toBe(token);
    expect(()=>admissionToken("https://example.org/receipts/"+token)).toThrow();expect(()=>admissionToken("7B33832F7B")).toThrow();
  });
});
describe("secure payment callbacks",()=>{
  async function sign(body:string,time:number){const key=await crypto.subtle.importKey("raw",new TextEncoder().encode("test-signing-secret"),{name:"HMAC",hash:"SHA-256"},false,["sign"]);const signature=await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(`${time}.${body}`));return Array.from(new Uint8Array(signature),b=>b.toString(16).padStart(2,"0")).join("");}
  it("accepts a correctly signed current callback",async()=>{const s=await sign("paid",1000);expect(await verifyStripeSignature("paid",`t=1000,v1=${s}`,"test-signing-secret",1000)).toBe(true);});
  it("rejects altered payloads and missing signatures",async()=>{const s=await sign("paid",1000);expect(await verifyStripeSignature("unpaid",`t=1000,v1=${s}`,"test-signing-secret",1000)).toBe(false);expect(await verifyStripeSignature("paid","","test-signing-secret",1000)).toBe(false);});
  it("rejects stale callbacks beyond five minutes",async()=>{const s=await sign("paid",1000);expect(await verifyStripeSignature("paid",`t=1000,v1=${s}`,"test-signing-secret",1301)).toBe(false);});
});