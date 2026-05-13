import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import { Camera, Upload, X, Tag } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { callAnalyzeItem, createAnalysisRecord, getPhotoUrls, uploadPhotos } from "@/services/analysis";
import { cn } from "@/lib/utils";
import heic2any from "heic2any";

const MAX_PHOTOS = 5;
const MAX_SIZE_MB = 8;

const ANALYSIS_STATUSES = [
  "Lettura delle foto...",
  "Identificazione oggetto...",
  "Ricerca storia del brand...",
  "Stima valore di mercato...",
  "Confronto con vendite recenti...",
  "Preparazione annuncio Vinted...",
  "Quasi pronto...",
];

const NewAnalysis = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [purchasePrice, setPurchasePrice] = useState("");
  const [scanStatus, setScanStatus] = useState("");

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviewUrls(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);
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
          description: `Ogni foto può pesare al massimo ${MAX_SIZE_MB}MB.`,
          variant: "destructive",
        });
      }
      setFiles((prev) => {
        const available = MAX_PHOTOS - prev.length;
        if (available <= 0) {
          toast({
            title: "Limite raggiunto",
            description: `Puoi caricare al massimo ${MAX_PHOTOS} foto per analisi.`,
            variant: "destructive",
          });
          return prev;
        }
        if (filtered.length > available) {
          toast({
            title: "Alcune foto non aggiunte",
            description: `Hai raggiunto il limite di ${MAX_PHOTOS} foto.`,
            variant: "destructive",
          });
        }
        return [...prev, ...filtered.slice(0, available)];
      });
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
      const photoPaths = await uploadPhotos(user.id, files);
      const photoUrls = await getPhotoUrls(photoPaths);

      setStep("analyzing");
      let statusIdx = 0;
      setScanStatus(ANALYSIS_STATUSES[0]);
      const statusInterval = setInterval(() => {
        statusIdx = (statusIdx + 1) % ANALYSIS_STATUSES.length;
        setScanStatus(ANALYSIS_STATUSES[statusIdx]);
      }, 2200);

      let result;
      try {
        result = await callAnalyzeItem(photoUrls, priceNum);
      } finally {
        clearInterval(statusInterval);
        setScanStatus("");
      }

      const id = await createAnalysisRecord({
        userId: user.id,
        photos: photoPaths,
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

      {/* Full-screen scanning overlay */}
      {step === "analyzing" && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md pointer-events-none">
          <div className="bg-card border-4 border-black p-10 rounded-[48px] shadow-[16px_16px_0px_0px_rgba(255,222,30,1)] text-center animate-in zoom-in-95 duration-500 w-[90%] max-w-lg">
            <div className="relative mx-auto h-20 w-20 mb-8">
              <div className="h-20 w-20 rounded-full border-4 border-accent animate-spin border-t-transparent" />
              <Tag className="absolute inset-0 m-auto h-8 w-8 text-black" />
            </div>
            <h3 className="font-display text-4xl font-black uppercase tracking-tighter">Analisi in corso</h3>
            <p className="mt-4 text-xl font-bold text-accent h-8 transition-all duration-300">
              {scanStatus}
            </p>
            <div className="mt-8 space-y-4">
              <div className="h-4 w-full bg-muted border-2 border-black rounded-full overflow-hidden p-0.5">
                <div className="h-full bg-accent rounded-full animate-[loading_2s_ease-in-out_infinite]" style={{ width: "40%" }} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center justify-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                Elaborazione attiva
              </p>
            </div>
          </div>
        </div>
      )}

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
                  <img src={previewUrls[i]} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
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
            {step === "uploading" && "Caricamento foto…"}
            {step === "converting" && "Elaborazione foto…"}
            {step === "analyzing" && "Analisi in corso…"}
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
