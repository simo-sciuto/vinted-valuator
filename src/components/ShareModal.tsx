import { useRef, useState, useCallback } from "react";
import { toPng } from "html-to-image";
import { Download, Share2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ShareModalProps {
  trigger: React.ReactNode;
  filename?: string;
  title?: string;
  children: (ref: React.RefObject<HTMLDivElement>) => React.ReactNode;
}

export function ShareModal({ trigger, filename = "revinted", title = "Condividi risultato", children }: ShareModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [capturing, setCapturing] = useState(false);

  const handleShare = useCallback(async () => {
    if (!cardRef.current || capturing) return;
    setCapturing(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `${filename}.png`, { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "ReVinted" });
      } else {
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `${filename}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (e) {
      console.error("Share failed:", e);
    } finally {
      setCapturing(false);
    }
  }, [filename, capturing]);

  const canNativeShare = typeof navigator !== "undefined" && !!navigator.canShare;

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-[540px] border-4 border-black rounded-[32px] p-6 gap-5">
        <DialogHeader>
          <DialogTitle className="font-display font-black uppercase text-xl tracking-tighter">{title}</DialogTitle>
        </DialogHeader>
        <div className="overflow-hidden rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          {children(cardRef)}
        </div>
        <Button
          onClick={handleShare}
          disabled={capturing}
          className="w-full h-12 rounded-2xl bg-black text-white font-black uppercase tracking-wide border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-1 transition-all disabled:opacity-60"
        >
          {capturing ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Elaborazione…</>
          ) : canNativeShare ? (
            <><Share2 className="mr-2 h-4 w-4" /> Condividi</>
          ) : (
            <><Download className="mr-2 h-4 w-4" /> Scarica immagine</>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
