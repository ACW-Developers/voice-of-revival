import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Camera, CameraOff, ScanLine, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { validateEntry } from "@/lib/receipts.functions";
import { admissionToken, entryAllowed, type EntryResult } from "@/lib/receipts";
import { Button } from "./ui/button";
export function TicketScanner() {
  const events=useQuery({queryKey:["scan-events"],queryFn:async()=>{const {data,error}=await supabase.from("events").select("id,title").order("starts_at",{ascending:false});if(error)throw error;return data;}});
  const [eventId,setEventId]=useState("");const [input,setInput]=useState("");const [token,setToken]=useState("");
  const [result,setResult]=useState<EntryResult|null>(null);const [error,setError]=useState("");const [busy,setBusy]=useState(false);const [camera,setCamera]=useState(false);
  const video=useRef<HTMLVideoElement>(null);const stop=useRef<(()=>void)|null>(null);
  const verify=useServerFn(validateEntry);
  const selected=eventId || events.data?.[0]?.id || "";
  const stopCamera=()=>{stop.current?.();stop.current=null;setCamera(false);};
  useEffect(()=>()=>{stop.current?.();},[]);
  async function check(value:string,redeem=false) {
    if(busy)return;stopCamera();setBusy(true);setError("");if(!redeem)setResult(null);
    try{const parsed=admissionToken(value);setToken(parsed);const response=await verify({data:{token:parsed,eventId:selected,redeem}});setResult(response);}
    catch(e){setError(e instanceof Error ? e.message : "Ticket verification failed.");}
    finally{setBusy(false);}
  }
  async function startCamera(){
    if(!selected)return;setError("");setResult(null);setCamera(true);
    try{const {BrowserQRCodeReader}=await import("@zxing/browser");const reader=new BrowserQRCodeReader();
      const controls=await reader.decodeFromConstraints({video:{facingMode:"environment"}},video.current ?? undefined,(decoded)=>{
        if(decoded){stop.current?.();void check(decoded.getText());}
      });stop.current=()=>controls.stop();
    }catch{setCamera(false);setError("Camera unavailable. Allow camera access on an HTTPS page, or enter the admission QR value below.");}
  }
  const labels:Record<EntryResult["status"],string>={valid:"Valid ticket — ready to admit",redeemed:"Entry confirmed",already_redeemed:"Already redeemed — do not admit",wrong_event:"Ticket belongs to a different event",invalid:"Ticket not found",void:"Payment invalid — do not admit"};
  return <section className="mt-10 border-y border-border py-8"><div className="flex items-center gap-3"><ShieldCheck className="text-primary"/><h2 className="font-display text-2xl uppercase">Event-day check-in</h2></div>
    <div className="mt-5 grid gap-6 lg:grid-cols-2"><div className="space-y-4"><label className="block text-sm font-semibold">Event<select className="mt-2 w-full rounded-md border border-input bg-background px-3 py-3" value={selected} onChange={e=>{stopCamera();setEventId(e.target.value);setResult(null);}}>{events.data?.map(e=><option key={e.id} value={e.id}>{e.title}</option>)}</select></label>
      <div className="flex gap-3"><Button disabled={!selected||busy} onClick={()=>camera?stopCamera():void startCamera()}>{camera?<CameraOff/>:<Camera/>}{camera?"Stop camera":"Scan QR code"}</Button></div>
      <video ref={video} muted playsInline className={camera?"aspect-video w-full rounded-lg bg-muted object-cover":"hidden"}/>
      <form className="flex flex-col gap-3 sm:flex-row" onSubmit={e=>{e.preventDefault();void check(input);}}><input aria-label="Admission QR value" placeholder="Admission QR value" value={input} onChange={e=>setInput(e.target.value)} className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-3"/><Button variant="outline" disabled={busy||!selected||!input}><ScanLine/> Verify</Button></form>
    </div><div aria-live="polite" className="border-l-2 border-primary pl-6">{error&&<p role="alert" className="text-destructive">{error}</p>}{busy&&<p>Verifying securely…</p>}{result&&<><h3 className={`text-xl font-bold ${["valid","redeemed"].includes(result.status)?"text-primary":"text-destructive"}`}>{labels[result.status]}</h3>{result.name&&<p className="mt-4 font-semibold">{result.name}</p>}<p className="break-all text-sm text-muted-foreground">{result.email}</p>{result.event&&<p className="mt-3">{result.event} · Admission {result.seat} of {result.quantity}</p>}{result.redeemed_at&&<p className="mt-3 text-sm">Redeemed {new Date(result.redeemed_at).toLocaleString()}</p>}{entryAllowed(result.status)&&<Button className="mt-5" disabled={busy} onClick={()=>void check(token,true)}><ShieldCheck/> Confirm entry</Button>}</>}{!result&&!error&&!busy&&<p className="text-muted-foreground">Awaiting ticket</p>}</div></div>
  </section>;
}