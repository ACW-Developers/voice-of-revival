import { Cross } from "lucide-react";

const MESSAGES = [
  "Murakaza neza mu Ijwi ry'Ububyutse",
  "Imana ni nziza igihe cyose",
  "Yesu ni Umwami w'abami",
  "Twese hamwe tuyiramye",
  "Urukundo rw'Imana ruraduhagije",
  "Haleluya! Uwiteka arakomeye",
  "Ububyutse butangirira muri twe",
];

export function GospelMarquee() {
  const row = [...MESSAGES, ...MESSAGES];
  return (
    <div
      className="marquee relative overflow-hidden border-y border-border bg-red-gradient py-5"
      aria-label="Kinyarwanda gospel welcome messages"
    >
      <div className="marquee-track flex w-max items-center gap-10 whitespace-nowrap">
        {row.map((m, i) => (
          <span
            key={i}
            aria-hidden={i >= MESSAGES.length}
            className="flex items-center gap-10 font-display text-xl uppercase tracking-wider text-primary-foreground md:text-2xl"
          >
            {m}
            <Cross className="h-4 w-4 opacity-70" />
          </span>
        ))}
      </div>
    </div>
  );
}
