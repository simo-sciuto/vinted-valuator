import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import { Camera, Upload, X, Loader2 } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { callAnalyzeItem, createAnalysisRecord, uploadPhotos } from "@/services/analysis";
import { cn } from "@/lib/utils";

const MAX_PHOTOS = 5;
const MAX_SIZE_MB = 8;

const NewAnalysis = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [purchasePrice, setPurchasePrice] = useState("");
  const [step, setStep] = useState<"idle" | "uploading" | "analyzing">("idle");

  const onDrop = useCallback(
    (accepted: File[]) => {
      const filtered = accepted.filter((f) => f.size <= MAX_SIZE_MB * 1024 * 1024);
      if (filtered.length < accepted.length) {
        toast({
          title: "File troppo grande",
          description: `Ogni foto può pesare al massimo ${MAX_SIZE_MB}MB.`,
          variant: "destructive",
        });
      }
      setFiles((prev) => [...prev, ...filtered].slice(0, MAX_PHOTOS));
    },
    [toast],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp", ".heic"] },
    multiple: true,
    maxFiles: MAX_PHOTOS,
  });

  const removeFile = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const handleAnalyze = async () => {
    if (!user) return;
    if (files.length === 0) {
      toast({ title: "Aggiungi una foto", description: "Serve almeno 1 immagine.", variant: "destructive" });
      return;
    }
    const priceNum = purchasePrice ? Number(purchasePrice.replace(",", ".")) : null;
    if (priceNum !== null && (Number.isNaN(priceNum) || priceNum < 0 || priceNum > 1_000_000)) {
      toast({ title: "Prezzo non valido", description: "Inserisci un numero positivo.", variant: "destructive" });
      return;
    }

    try {
      setStep("uploading");
      const photoUrls = await uploadPhotos(user.id, files);

      setStep("analyzing");
      const result = await callAnalyzeItem(photoUrls, priceNum);

      const id = await createAnalysisRecord({
        userId: user.id,
        photos: photoUrls,
        purchasePrice: priceNum,
        result,
      });

      toast({ title: "Fatto!", description: "Analisi pronta." });
      navigate(`/analysis/${id}`, { replace: true });
    } catch (err) {
      console.error(err);
      toast({
        title: "Analisi fallita",
        description: err instanceof Error ? err.message : "Errore sconosciuto",
        variant: "destructive",
      });
      setStep("idle");
    }
  };

  const busy = step !== "idle";

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="container max-w-3xl py-10">
        <h1 className="font-display text-3xl font-bold md:text-4xl">Nuova analisi</h1>
        <p className="mt-1 text-muted-foreground">
          Aggiungi le foto dell'oggetto. Più angolazioni = stima più precisa.
        </p>

        <div className="mt-8 space-y-6">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={cn(
              "card-soft cursor-pointer border-2 border-dashed transition-colors",
              isDragActive ? "border-primary bg-primary-soft" : "hover:border-primary/50",
              busy && "pointer-events-none opacity-60",
            )}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center py-10 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-pop">
                <Camera className="h-6 w-6" />
              </div>
              <p className="mt-4 font-display text-lg font-semibold">
                {isDragActive ? "Lascia qui le foto" : "Trascina le foto o clicca per scegliere"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Fino a {MAX_PHOTOS} immagini · max {MAX_SIZE_MB}MB ciascuna · jpg, png, webp
              </p>
            </div>
          </div>

          {/* Preview */}
          {files.length > 0 && (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
              {files.map((f, i) => (
                <div key={`${f.name}-${i}`} className="group relative aspect-square overflow-hidden rounded-2xl border border-border">
                  <img src={URL.createObjectURL(f)} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
                  {!busy && (
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-background/90 text-foreground shadow"
                      aria-label="Rimuovi"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Purchase price */}
          <div className="card-soft">
            <Label htmlFor="price" className="text-base font-display">
              Quanto l'hai pagato? <span className="text-muted-foreground font-normal">(opzionale)</span>
            </Label>
            <p className="mt-1 text-sm text-muted-foreground">
              Se lo inserisci, ti mostro il guadagno potenziale e una proiezione sui prossimi anni.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-lg text-muted-foreground">€</span>
              <Input
                id="price"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                disabled={busy}
                className="h-12 text-lg"
              />
            </div>
          </div>

          {/* CTA */}
          <Button
            onClick={handleAnalyze}
            size="lg"
            className="h-14 w-full rounded-full text-base shadow-pop"
            disabled={busy || files.length === 0}
          >
            {step === "uploading" && (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Carico le foto…
              </>
            )}
            {step === "analyzing" && (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                L'AI sta analizzando…
              </>
            )}
            {step === "idle" && (
              <>
                <Upload className="h-4 w-4" />
                Analizza ora
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default NewAnalysis;
