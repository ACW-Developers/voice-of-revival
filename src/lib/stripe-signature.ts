export async function verifyStripeSignature(body: string, header: string, secret: string, now = Math.floor(Date.now()/1000)) {
  const parts = header.split(",").map(p=>p.split("="));
  const timestamp = parts.find(([k])=>k==="t")?.[1];
  if (!timestamp || !/^\d+$/.test(timestamp) || Math.abs(now-Number(timestamp))>300) return false;
  const key = await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const bytes = await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(`${timestamp}.${body}`));
  const expected = Array.from(new Uint8Array(bytes),v=>v.toString(16).padStart(2,"0")).join("");
  return parts.filter(([k])=>k==="v1").some(([,value])=>{
    if (!value || value.length!==expected.length) return false;
    let mismatch=0; for(let i=0;i<expected.length;i++) mismatch |= expected.charCodeAt(i)^value.charCodeAt(i);
    return mismatch===0;
  });
}