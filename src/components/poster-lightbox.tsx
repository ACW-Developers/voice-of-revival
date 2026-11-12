import { useState } from "react";
import { ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

export function PosterLightbox({ src, title, className = "" }: { src: string; title: string; className?: string }) {
  const [open, setOpen] = useState(false);
  return <>
    <Button variant="ghost" aria-label={`View poster: ${title}`} onClick={() => setOpen(true)} className={`group/poster relative h-full w-full overflow-hidden rounded-none p-0 ${className}`}>
      <img src={src} alt={title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover/poster:scale-105" />
      <span className="absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-md bg-photo-background/70 text-photo-foreground"><ZoomIn /></span>
    </Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[94svh] w-[calc(100%-2rem)] max-w-4xl overflow-auto rounded-lg bg-background p-5">
        <DialogTitle className="pr-8">{title}</DialogTitle>
        <DialogDescription className="sr-only">Full event poster</DialogDescription>
        <img src={src} alt={title} className="max-h-[78svh] w-full object-contain" />
      </DialogContent>
    </Dialog>
  </>;
}