import { useState, useEffect } from "react";
import { Camera, Sparkles, Tag, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "revinted_onboarding_done";

const steps = [
  {
    icon: <Camera className="h-10 w-10" />,
    accent: "bg-accent text-black border-black",
    title: "Carica le foto",
    description:
      "Scatta o carica da 1 a 5 foto dell'oggetto. Più angolazioni fornisci, più precisa sarà la stima. Supportiamo JPG, PNG, WebP e HEIC.",
    step: 1,
  },
  {
    icon: <Sparkles className="h-10 w-10" />,
    accent: "bg-pop text-black border-black",
    title: "L'AI fa il lavoro",
    description:
      "Il nostro motore analizza il brand, l'epoca, le condizioni e la storia dell'oggetto. Ti restituisce una stima di mercato attuale e una proiezione futura a 5 anni.",
    step: 2,
  },
  {
    icon: <Tag className="h-10 w-10" />,
    accent: "bg-black text-white border-black",
    title: "Annuncio pronto",
    description:
      "Genera titolo SEO, descrizione informale, hashtag e prezzo suggerito ottimizzati per Vinted. Un clic e sei pronto a vendere.",
    step: 3,
  },
];

export function OnboardingModal() {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) {
      // Small delay so the dashboard has time to render
      const t = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      handleClose();
    }
  };

  if (!open) return null;

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in-95 duration-300">
        <div className="rounded-[32px] border-2 border-black bg-card shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-8">
          {/* Close */}
          <button
            onClick={handleClose}
            className="absolute right-5 top-5 grid h-8 w-8 place-items-center rounded-full border-2 border-black hover:bg-muted transition-colors"
            aria-label="Chiudi"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Header */}
          <div className="text-center">
            <span className="pill bg-accent text-black border-black text-[10px]">
              Benvenuto su ReVinted
            </span>
          </div>

          {/* Step Icon */}
          <div className="mt-8 flex justify-center">
            <div
              className={cn(
                "grid h-24 w-24 place-items-center rounded-[24px] border-2 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-300",
                step.accent
              )}
            >
              {step.icon}
            </div>
          </div>

          {/* Content */}
          <div className="mt-8 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Step {step.step} di {steps.length}
            </p>
            <h2 className="mt-3 font-display text-3xl font-black uppercase tracking-tighter">
              {step.title}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-foreground/80">
              {step.description}
            </p>
          </div>

          {/* Progress dots */}
          <div className="mt-8 flex justify-center gap-2">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={cn(
                  "h-2 rounded-full transition-all duration-300 border-2 border-black",
                  i === currentStep ? "w-8 bg-accent" : "w-2 bg-muted"
                )}
                aria-label={`Step ${i + 1}`}
              />
            ))}
          </div>

          {/* CTA */}
          <Button
            onClick={handleNext}
            className="mt-8 h-14 w-full rounded-full text-base font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all"
          >
            {currentStep < steps.length - 1 ? (
              <>
                Avanti
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Inizia adesso
              </>
            )}
          </Button>

          {currentStep === 0 && (
            <button
              onClick={handleClose}
              className="mt-4 w-full text-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Lo so già, salta il tutorial
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
