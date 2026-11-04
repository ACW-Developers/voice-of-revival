import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Menu, X, Music2, Users, Heart, Sparkles, Mic2, HandHeart, Calendar, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/vor_logo.png.asset.json";
import worship from "@/assets/worship_cross.jpg.asset.json";
import groupA from "@/assets/ministers_jj.jpg.asset.json";
import groupB from "@/assets/ministers_DSC04498.jpg.asset.json";
import groupC from "@/assets/ministers_DSC04460.jpg.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Voice of Revival — Different Voices. One Sound for His Glory." },
      { name: "description", content: "A Christ-centred worship movement uniting believers, empowering Christian creatives and spreading the hope of the Gospel." },
      { property: "og:title", content: "Voice of Revival — Gospel Worship Movement" },
      { property: "og:description", content: "Different voices. One purpose. One sound for His glory." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const NAV = [
  ["home", "Home"],
  ["about", "About"],
  ["vision", "Vision & Mission"],
  ["artists", "Artists"],
  ["events", "Events"],
  ["contact", "Contact"],
] as const;

const MINISTERS = ["Jacques & Kamariza", "Aime Frank", "Bonke", "Kadogo"];

const btn = "inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm font-bold uppercase tracking-widest transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]";
const btnPrimary = `${btn} bg-red-gradient text-primary-foreground shadow-glow hover:brightness-110`;
const btnGhost = `${btn} border border-foreground/40 text-foreground hover:bg-foreground hover:text-background`;

function Heading({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-4 font-display text-4xl uppercase leading-[1.05] md:text-6xl">{title}</h2>
      {children && <p className="mt-6 text-lg text-muted-foreground">{children}</p>}
    </div>
  );
}

function Nav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 py-3">
        <a href="#home" aria-label="Voice of Revival home" className="shrink-0">
          <img src={logo.url} alt="Voice of Revival" className="h-10 w-auto" />
        </a>
        <ul className="hidden items-center gap-7 lg:flex">
          {NAV.map(([id, label]) => (
            <li key={id}>
              <a href={`#${id}`} className="text-sm font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground">{label}</a>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-3">
          <a href="#support" className={`${btnPrimary} hidden px-5 py-2.5 sm:inline-flex`}>Support Us</a>
          <button className="p-2 lg:hidden" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(!open)}>
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </nav>
      <div className={`grid overflow-hidden transition-all duration-300 lg:hidden ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <ul className="min-h-0 space-y-1 px-5">
          {NAV.map(([id, label]) => (
            <li key={id}><a href={`#${id}`} onClick={() => setOpen(false)} className="block py-3 font-semibold uppercase tracking-wider">{label}</a></li>
          ))}
          <li className="pb-5 pt-2"><a href="#support" onClick={() => setOpen(false)} className={`${btnPrimary} w-full`}>Support Us</a></li>
        </ul>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section id="home" className="relative flex min-h-screen items-center overflow-hidden">
      <img src={worship.url} alt="Worshippers raising hands before a stage with a glowing cross" className="absolute inset-0 h-full w-full object-cover" fetchPriority="high" />
      <div className="absolute inset-0 bg-hero-overlay" />
      <div className="relative mx-auto max-w-5xl px-5 pt-24 text-center">
        <p className="eyebrow animate-rise">A Christ-centred worship movement</p>
        <h1 className="animate-rise mt-6 font-display text-5xl uppercase leading-[1] md:text-8xl" style={{ animationDelay: "0.1s" }}>
          Different Voices. One Purpose.<br /><span className="text-primary">One Sound</span> for His Glory.
        </h1>
        <p className="animate-rise mx-auto mt-8 max-w-2xl text-lg text-foreground/85" style={{ animationDelay: "0.25s" }}>
          A Christ-centred worship movement bringing people together through authentic worship, nurturing Christian talent, and spreading the hope of the Gospel through music, fellowship, and meaningful service.
        </p>
        <div className="animate-rise mt-10 flex flex-col justify-center gap-4 sm:flex-row" style={{ animationDelay: "0.4s" }}>
          <a href="#about" className={btnPrimary}>Discover Our Movement</a>
          <a href="#events" className={btnGhost}>Join Us in Worship</a>
        </div>
      </div>
    </section>
  );
}

function About() {
  return (
    <section id="about" className="py-24 md:py-32">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 lg:grid-cols-2">
        <div className="relative">
          <img src={groupA.url} alt="The founding ministers of Voice of Revival" loading="lazy" className="w-full object-cover" />
          <div className="absolute -bottom-6 -right-6 -z-10 hidden h-full w-full border-2 border-primary md:block" />
        </div>
        <div>
          <p className="eyebrow">Our Introduction</p>
          <h2 className="mt-4 font-display text-4xl uppercase leading-[1.05] md:text-6xl">A Movement United by Worship.</h2>
          <p className="mt-6 text-lg text-muted-foreground">
            Voice of Revival is a worship movement founded by five ministers — Jacques & Kamariza, Aime Frank, Bonke, and Kadogo. We exist to glorify Christ, unite believers, empower Christian creatives, and inspire transformation through music, fellowship, and service.
          </p>
          <p className="mt-4 text-lg text-muted-foreground">
            For us, worship goes beyond the stage. It is an expression of faith, of unity, and of God's love lived out in every community.
          </p>
          <blockquote className="mt-10 border-l-4 border-primary pl-6 font-display text-2xl uppercase leading-snug md:text-3xl">
            "Together, we raise our voices in worship, strengthen one another in faith, and bring hope to every community we touch."
          </blockquote>
        </div>
      </div>
    </section>
  );
}

const VISION = [
  { icon: Users, t: "Unity in Diversity", d: "Bringing together Christian artists, songwriters, and musicians from diverse backgrounds to collaborate, grow, and fulfil their God-given purpose." },
  { icon: Music2, t: "Connecting Through Music", d: "Connecting people to Christ and inspiring communities through exceptional Christian music and transformative worship experiences." },
  { icon: Heart, t: "Kingdom Impact", d: "Extending the love and hope of Christ beyond the stage through compassion, fellowship, and practical support for underserved communities." },
];
const MISSION = [
  { icon: Sparkles, t: "Empowering Christian Creatives", d: "Providing Christian artists with a platform, opportunities, and resources to develop their gifts and fulfil their God-given potential." },
  { icon: Mic2, t: "Building Fellowship Through Music", d: "Connecting communities through vibrant gospel music, accessible live concerts, and shared worship experiences that nurture faith and Christian values." },
  { icon: HandHeart, t: "Serving Practical Needs", d: "Demonstrating Christ's love through meaningful community outreach and support for vulnerable individuals and low-income families." },
];

function Pillars({ items, solid }: { items: typeof VISION; solid?: boolean }) {
  return (
    <div className="mt-12 grid gap-px bg-border md:grid-cols-3">
      {items.map(({ icon: Icon, t, d }, i) => (
        <div key={t} className={`group p-8 transition-colors md:p-10 ${solid ? "bg-card hover:bg-muted" : "bg-background hover:bg-card"}`}>
          <div className="flex items-center justify-between">
            <Icon className="h-8 w-8 text-primary" />
            <span className="font-display text-5xl text-foreground/10 transition-colors group-hover:text-primary/40">0{i + 1}</span>
          </div>
          <h3 className="mt-8 font-display text-2xl uppercase">{t}</h3>
          <p className="mt-3 text-muted-foreground">{d}</p>
        </div>
      ))}
    </div>
  );
}

function Vision() {
  return (
    <section id="vision" className="border-y border-border bg-card py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:items-end">
          <div>
            <p className="eyebrow">Our Vision</p>
            <h2 className="mt-4 font-display text-4xl uppercase leading-[1.05] md:text-6xl">A Generation United Through Worship, Transformed by Christ.</h2>
          </div>
          <p className="text-lg text-muted-foreground">To build a vibrant, Christ-centred worship movement that unites people, empowers Christian creatives, and extends the hope of the Gospel to communities through music and meaningful service.</p>
        </div>
        <Pillars items={VISION} />
        <div className="mt-24">
          <p className="eyebrow">Our Mission</p>
          <h2 className="mt-4 font-display text-4xl uppercase md:text-5xl">How We Live It Out</h2>
        </div>
        <Pillars items={MISSION} solid />
      </div>
    </section>
  );
}

function Artists() {
  return (
    <section id="artists" className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5">
        <Heading eyebrow="Artists & Ministers" title="The Voices Behind the Movement">
          Meet the ministers united by a shared calling to worship, serve, and inspire through music.
        </Heading>
        <div className="mt-14 grid gap-4 md:grid-cols-2">
          {[groupB, groupC].map((g, i) => (
            <div key={i} className="group overflow-hidden">
              <img src={g.url} alt="Voice of Revival ministers" loading="lazy" className="aspect-[3/2] w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            </div>
          ))}
        </div>
        <ul className="mt-10 grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
          {MINISTERS.map((m) => (
            <li key={m} className="bg-background p-6 text-center transition-colors hover:bg-card">
              <p className="font-display text-2xl uppercase">{m}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.25em] text-primary">Founding Minister</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Events() {
  return (
    <section id="events" className="border-y border-border bg-card py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5">
        <Heading eyebrow="Gather With Us" title="Come Worship, Connect & Experience the Revival.">
          Worship gatherings, gospel concerts, fellowship events, and community activities — moments to encounter Christ together.
        </Heading>
        <div className="mx-auto mt-14 max-w-2xl border border-dashed border-primary/50 p-10 text-center">
          <Calendar className="mx-auto h-10 w-10 text-primary" />
          <h3 className="mt-5 font-display text-3xl uppercase">New Gatherings Coming Soon</h3>
          <p className="mt-3 text-muted-foreground">Our next worship experiences are being prepared. Stay connected and be the first to hear when dates are announced.</p>
          <a href="#contact" className={`${btnPrimary} mt-8`}>Stay Connected</a>
        </div>
      </div>
    </section>
  );
}

function MusicSection() {
  return (
    <section id="music" className="relative overflow-hidden py-24 md:py-32">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 lg:grid-cols-2">
        <div>
          <p className="eyebrow">Music & Worship</p>
          <h2 className="mt-4 font-display text-4xl uppercase leading-[1.05] md:text-6xl">The Sound of Revival</h2>
          <p className="mt-6 text-lg text-muted-foreground">
            Discover the heart of Voice of Revival through uplifting gospel music, powerful worship, and inspiring expressions of faith. Every song is an opportunity to draw closer to Christ, strengthen our fellowship, and share a message of hope that reaches beyond the stage.
          </p>
          <a href="#contact" className={`${btnGhost} mt-10`}>Explore Our Music</a>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {["Releases", "Worship Videos", "Live Performances", "Coming Soon"].map((t, i) => (
            <div key={t} className={`flex aspect-square flex-col justify-end border border-border p-5 ${i === 0 ? "bg-red-gradient" : "bg-card"}`}>
              <Music2 className="mb-auto h-6 w-6" />
              <p className="font-display text-xl uppercase">{t}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Support() {
  return (
    <section id="support" className="relative overflow-hidden py-28 md:py-40">
      <img src={worship.url} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
      <div className="absolute inset-0 bg-background/85" />
      <div className="relative mx-auto max-w-3xl px-5 text-center">
        <p className="eyebrow">Support the Movement</p>
        <h2 className="mt-4 font-display text-5xl uppercase md:text-7xl">Be Part of the Movement.</h2>
        <p className="mt-6 text-lg text-foreground/85">
          Every great movement grows through people who believe in its purpose. Join us in spreading the message of Christ through worship, empowering Christian creatives, and extending hope to communities in need. Your support, partnership, and prayers help us take this vision beyond the stage and make a meaningful Kingdom impact.
        </p>
        <a href="#contact" onClick={() => setTimeout(() => { const s = document.getElementById("subject") as HTMLInputElement | null; if (s) s.value = "Partnership / Donation"; }, 50)} className={`${btnPrimary} mt-10`}>Donate Now</a>
      </div>
    </section>
  );
}

const schema = z.object({
  name: z.string().trim().min(1, "Please enter your name").max(100),
  email: z.string().trim().email("Please enter a valid email").max(255),
  subject: z.string().trim().min(1, "Please add a subject").max(150),
  message: z.string().trim().min(1, "Please write a message").max(2000),
});

function Contact() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const parsed = schema.safeParse(Object.fromEntries(new FormData(form)));
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [i.path[0], i.message])));
      return;
    }
    setErrors({});
    setSending(true);
    const { error } = await supabase.from("contact_messages").insert(parsed.data);
    setSending(false);
    if (error) return toast.error("Sorry, your message couldn't be sent. Please try again.");
    form.reset();
    toast.success("Thank you! Your message has been received.");
  }
  const field = "w-full border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none";
  return (
    <section id="contact" className="py-24 md:py-32">
      <div className="mx-auto grid max-w-7xl gap-14 px-5 lg:grid-cols-2">
        <div>
          <p className="eyebrow">Contact & Get Involved</p>
          <h2 className="mt-4 font-display text-4xl uppercase leading-[1.05] md:text-6xl">Let's Connect and Grow Together.</h2>
          <p className="mt-6 text-lg text-muted-foreground">Enquire about worship gatherings, explore collaboration and partnership, or become part of our growing community. We'd love to hear from you.</p>
          <div className="mt-8 flex items-center gap-3 text-muted-foreground"><Mail className="h-5 w-5 text-primary" /> Send us a message using the form.</div>
        </div>
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          {(["name", "email", "subject"] as const).map((n) => (
            <div key={n}>
              <label htmlFor={n} className="mb-1.5 block text-xs font-bold uppercase tracking-widest">{n}</label>
              <input id={n} name={n} type={n === "email" ? "email" : "text"} className={field} aria-invalid={!!errors[n]} />
              {errors[n] && <p className="mt-1 text-sm text-destructive">{errors[n]}</p>}
            </div>
          ))}
          <div>
            <label htmlFor="message" className="mb-1.5 block text-xs font-bold uppercase tracking-widest">Message</label>
            <textarea id="message" name="message" rows={5} className={field} aria-invalid={!!errors.message} />
            {errors.message && <p className="mt-1 text-sm text-destructive">{errors.message}</p>}
          </div>
          <button type="submit" disabled={sending} className={`${btnPrimary} w-full disabled:opacity-60`}>{sending ? "Sending…" : "Send Message"}</button>
        </form>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 md:grid-cols-3">
        <div>
          <img src={logo.url} alt="Voice of Revival" className="h-14 w-auto" loading="lazy" />
          <p className="mt-4 text-sm text-muted-foreground">A Christ-centred worship movement — different voices, one purpose, one sound for His glory.</p>
        </div>
        <ul className="grid grid-cols-2 gap-3 text-sm">
          {NAV.slice(1).map(([id, label]) => (
            <li key={id}><a href={`#${id}`} className="text-muted-foreground hover:text-foreground">{label}</a></li>
          ))}
        </ul>
        <div className="md:text-right">
          <a href="#support" className={btnPrimary}>Donate Now</a>
        </div>
      </div>
      <p className="border-t border-border py-6 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} Voice of Revival. All rights reserved.</p>
    </footer>
  );
}

function Index() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <About />
        <Vision />
        <Artists />
        <Events />
        <MusicSection />
        <Support />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
