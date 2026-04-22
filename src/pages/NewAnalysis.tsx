import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import { Camera, Upload, X, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { callAnalyzeItem, createAnalysisRecord, uploadPhotos } from "@/services/analysis";
import { cn } from "@/lib/utils";
import heic2any from "heic2any";

const MAX_PHOTOS = 5;
const MAX_SIZE_MB = 8;

const NewAnalysis = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [purchasePrice, setPurchasePrice] = useState("");
  const [step, setStep] = useState<"idle" | "uploading" | "analyzing" | "converting">("idle");
  const queryClient = useQueryClient();

  const onDrop = useCallback(
    async (accepted: File[]) => {
      setStep("converting");
      
      const processedFiles: File[] = [];
      for (const file of accepted) {
        if (file.name.toLowerCase().endsWith(".heic") || file.name.toLowerCase().endsWith(".heif") || file.type === "image/heic" || file.type === "image/heif") {
          try {
            if (file.size === 0) {
              throw new Error("Il file è vuoto (probabilmente è salvato su iCloud e non scaricato sul Mac).");
            }
            
            // Workaround for react-dropzone / macOS Finder issues:
            // Read into a fresh Blob to strip any weird File object properties
            const buffer = await file.arrayBuffer();
            const freshBlob = new Blob([buffer], { type: file.type || "image/heic" });

            const convertedBlob = await heic2any({
              blob: freshBlob,
              toType: "image/jpeg",
              quality: 0.8,
            });
            const blobArray = Array.isArray(convertedBlob) ? convertedBlob : [convertedBlob];
            const newFile = new File([blobArray[0]], file.name.replace(/\.heic$|\.heif$/i, ".jpg"), {
              type: "image/jpeg",
            });
            processedFiles.push(newFile);
          } catch (err) {
            console.error("Errore conversione HEIC:", err);
            toast({
              title: "Problema con la foto",
              description: err instanceof Error ? err.message : `Il file ${file.name} non può essere convertito. Prova con una foto JPG/PNG.`,
              variant: "destructive",
            });
          }
        } else {
          processedFiles.push(file);
        }
      }

      const filtered = processedFiles.filter((f) => f.size <= MAX_SIZE_MB * 1024 * 1024);
      if (filtered.length < processedFiles.length) {
        toast({
          title: "File troppo grande",
          description: `Dopo la conversione, ogni foto può pesare al massimo ${MAX_SIZE_MB}MB.`,
          variant: "destructive",
        });
      }
      setFiles((prev) => [...prev, ...filtered].slice(0, MAX_PHOTOS));
      setStep("idle");
    },
    [toast],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 
      "image/*": [".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"],
      "image/heic": [".heic"],
      "image/heif": [".heif"]
    },
    multiple: true,
    maxFiles: MAX_PHOTOS,
  });

  const removeFile = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const analyzeMutation = useMutation({
    mutationFn: async ({
      user,
      files,
      priceNum,
    }: {
      user: NonNullable<ReturnType<typeof useAuth>["user"]>;
      files: File[];
      priceNum: number | null;
    }) => {
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

      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["analyses"] });
      toast({ title: "Fatto!", description: "Analisi pronta." });
      navigate(`/analysis/${id}`, { replace: true });
    },
    onError: (err) => {
      console.error(err);
      toast({
        title: "Analisi fallita",
        description: err instanceof Error ? err.message : "Errore sconosciuto",
        variant: "destructive",
      });
      setStep("idle");
    },
  });

  const handleAnalyze = () => {
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

    analyzeMutation.mutate({ user, files, priceNum });
  };

  const busy = step !== "idle";

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="container max-w-3xl px-6 py-10 pt-24 md:pt-32 pb-32 md:pb-10">
        <h1 className="font-display text-4xl font-black uppercase tracking-tighter md:text-5xl leading-none">Nuova analisi</h1>
        <p className="mt-2 text-muted-foreground font-medium">
          Aggiungi le foto dell'oggetto. Più angolazioni = stima più precisa.
        </p>

        <div className="mt-8 space-y-6">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={cn(
              "card-soft cursor-pointer border-2 border-dashed transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group relative overflow-hidden",
              isDragActive ? "border-primary bg-primary-soft scale-[1.02]" : "hover:border-primary/50",
              busy && "pointer-events-none opacity-60",
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <input {...getInputProps()} />
            <div className="relative z-10 flex flex-col items-center py-10 md:py-16 text-center">
              <div className="grid h-16 w-16 md:h-20 md:w-20 place-items-center rounded-2xl bg-pop text-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                <Camera className="h-8 w-8 md:h-10 md:w-10" />
              </div>
              <p className="mt-6 md:mt-8 font-display text-xl md:text-2xl font-black uppercase px-4">
                {step === "converting" ? "Elaborazione foto..." : isDragActive ? "Lascia qui le foto" : "Scatta o scegli le foto"}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Max {MAX_PHOTOS} immagini · jpg, png, heic
              </p>
            </div>
          </div>

          {/* Preview */}
          {files.length > 0 && (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
              {files.map((f, i) => (
                <div key={`${f.name}-${i}`} className="group relative aspect-square overflow-hidden rounded-2xl border-2 border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all">
                  <img src={URL.createObjectURL(f)} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
                  {!busy && (
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-background/90 text-foreground shadow border-black border"
                      aria-label="Rimuovi"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Purchase price */}
          <div className="card-soft group hover:shadow-md transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none transition-opacity duration-500 opacity-0 group-hover:opacity-100"></div>
            <div className="relative z-10">
              <Label htmlFor="price" className="text-xl font-display font-black uppercase">
              Quanto l'hai pagato? <span className="text-muted-foreground font-bold lowercase tracking-normal">(opzionale)</span>
            </Label>
            <p className="mt-2 text-base font-medium text-foreground/80">
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
                className="h-16 text-2xl font-bold bg-card focus:bg-card border-2 border-black rounded-xl transition-all shadow-[inset_4px_4px_0px_rgba(0,0,0,0.05)] focus:shadow-[inset_2px_2px_0px_rgba(0,0,0,0.1)]"
              />
            </div>
            </div>
          </div>

          {/* CTA */}
          <Button
            onClick={handleAnalyze}
            size="lg"
            className="h-16 w-full rounded-full text-lg shadow-pop hover:scale-[1.02] transition-transform duration-300"
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
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Elaborazione in corso…
              </>
            )}
            {step === "idle" && (
              <>
                <Upload className="h-5 w-5 mr-2" />
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
