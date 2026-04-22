import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Copy, Sparkles, TrendingUp, TrendingDown, Minus, Tag, Loader2, CheckCircle2 } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  callGenerateListing,
  fetchAnalysisById,
  updateAnalysisListing,
  markAsSold,
} from "@/services/analysis";
import type { AnalysisRow, VintedListing, AnalysisResult as AnalysisResultType } from "@/types/analysis";
import { useState } from "react";

const AnalysisResult = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: row, isLoading, isError } = useQuery({
    queryKey: ["analysis", id],
    queryFn: () => {
      if (!id) throw new Error("ID mancante");
      return fetchAnalysisById(id);
    },
    enabled: !!id,
  });

  const generateListingMutation = useMutation({
    mutationFn: async (aiResult: NonNullable<AnalysisRow["ai_result"]>) => {
      const listing = await callGenerateListing(aiResult);
      if (!row?.id) throw new Error("ID riga non trovato");
      await updateAnalysisListing(row.id, listing);
      return listing;
    },
    onSuccess: (listing) => {
      if (id) {
        queryClient.setQueryData<AnalysisRow>(["analysis", id], (old) => {
          if (!old) return old;
          return { ...old, vinted_listing: listing };
        });
      }
      toast({ title: "Annuncio pronto", description: "Copialo e pubblicalo su Vinted." });
    },
    onError: (err) => {
      toast({
        title: "Generazione fallita",
        description: err instanceof Error ? err.message : "Errore",
        variant: "destructive",
      });
    },
  });

  const handleGenerateListing = () => {
    if (!row?.ai_result || !row.id) return;
    generateListingMutation.mutate(row.ai_result);
  };

  const [soldPriceInput, setSoldPriceInput] = useState("");

  const markSoldMutation = useMutation({
    mutationFn: async (price: number) => {
      if (!row?.id || !row.ai_result) throw new Error("Dati mancanti");
      await markAsSold(row.id, row.ai_result, row.purchase_price, price);
      return price;
    },
    onSuccess: (price) => {
      if (id) {
        queryClient.setQueryData<AnalysisRow>(["analysis", id], (old) => {
          if (!old || !old.ai_result) return old;
          const newAiResult = { ...old.ai_result };
          if (!newAiResult.profit) {
            newAiResult.profit = { purchasePrice: old.purchase_price ?? 0, currentProfit: 0, currentProfitPercent: null, futureProfitYear5: 0 };
          }
          newAiResult.profit.soldPrice = price;
          newAiResult.profit.actualProfit = price - (old.purchase_price ?? 0);
          return { ...old, status: "sold", ai_result: newAiResult };
        });
      }
      toast({ title: "Evviva!", description: "L'oggetto è stato segnato come venduto." });
    },
  });

  const handleMarkAsSold = () => {
    const val = parseFloat(soldPriceInput);
    if (isNaN(val) || val <= 0) return;
    markSoldMutation.mutate(val);
  };

  if (isLoading || row === undefined) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container max-w-5xl py-10 pt-32 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-80" />
          <Skeleton className="h-60" />
        </main>
      </div>
    );
  }

  if (isError || row === null || !row.ai_result) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container max-w-3xl py-20 pt-32 text-center">
          <h1 className="font-display text-2xl font-bold">Analisi non trovata</h1>
          <Button asChild className="mt-6 rounded-full">
            <Link to="/dashboard">Torna alle tue analisi</Link>
          </Button>
        </main>
      </div>
    );
  }

  const ai = row.ai_result;
  const listing = row.vinted_listing;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="container max-w-5xl py-10 pt-32">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-bold uppercase tracking-wider text-muted-foreground hover:text-black transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Torna allo storico
        </Link>

        {/* Header */}
        <div className="mt-4 grid gap-6 md:grid-cols-[1fr_360px]">
          <div>
            <span className="pill bg-accent text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">{ai.identification.category}</span>
            <h1 className="mt-6 font-display text-4xl font-black uppercase tracking-tighter md:text-5xl">{ai.identification.name}</h1>
            <p className="mt-3 text-lg font-medium text-foreground/80">
              {[ai.identification.brand, ai.identification.artist, ai.identification.era]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <span className="pill bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">Età: {ai.identification.estimatedAge}</span>
              <span className="pill bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">Condizione: {ai.identification.condition}</span>
              {ai.identification.style && (
                <span className="pill bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">Stile: {ai.identification.style}</span>
              )}
              {ai.identification.materials?.length > 0 && (
                <span className="pill bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">Materiali: {ai.identification.materials.join(", ")}</span>
              )}
              <span className="pill bg-pop text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                Precisione stima: {Math.round(ai.identification.confidence * 100)}%
              </span>
            </div>
          </div>

          <PhotoStrip photos={row.photos} />
        </div>

        {/* Historical Context & Market Analysis */}
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {ai.visualAnalysis && (
            <div className="card-soft md:col-span-2 bg-secondary border-dashed">
              <h2 className="font-display text-xl font-bold uppercase text-muted-foreground">Scansione Visiva</h2>
              <p className="mt-2 text-foreground/80 text-sm leading-relaxed italic border-l-2 border-muted-foreground pl-3">
                "{ai.visualAnalysis}"
              </p>
            </div>
          )}
          {ai.historicalContext ? (
            <div className="card-soft md:col-span-2">
              <h2 className="font-display text-xl font-bold uppercase">Archivio Storico</h2>
              <ul className="mt-4 space-y-4">
                <li>
                  <strong className="block text-primary">La Storia:</strong>
                  <span className="text-foreground/90">{ai.historicalContext.brandHistory}</span>
                </li>
                <li>
                  <strong className="block text-primary">Peso Culturale:</strong>
                  <span className="text-foreground/90">{ai.historicalContext.culturalSignificance}</span>
                </li>
                <li>
                  <strong className="block text-primary">Manifattura:</strong>
                  <span className="text-foreground/90">{ai.historicalContext.manufacturingDetails}</span>
                </li>
                <li className="rounded-xl bg-accent/20 p-3 mt-2 border-l-4 border-accent">
                  <strong className="block text-black">💡 Curiosità:</strong>
                  <span className="text-foreground/90 italic">{ai.historicalContext.funFact}</span>
                </li>
              </ul>
            </div>
          ) : (
            <div className="card-soft md:col-span-2">
              <h2 className="font-display text-xl font-bold uppercase">La storia</h2>
              <p className="mt-4 leading-relaxed text-foreground/90 font-medium">{ai.story}</p>
            </div>
          )}
          
          {ai.marketAnalysis && (
            <div className="card-soft bg-black text-white md:col-span-2">
              <h2 className="font-display text-xl font-bold uppercase">Analisi di Mercato</h2>
              <ul className="mt-4 space-y-4">
                <li>
                  <strong className="block text-accent">Fattori di Rarità:</strong>
                  <span className="text-white/90">{ai.marketAnalysis.rareFactors}</span>
                </li>
                {ai.marketAnalysis.authenticityClues && (
                  <li>
                    <strong className="block text-accent">Legit Check (Autenticità):</strong>
                    <span className="text-white/90">{ai.marketAnalysis.authenticityClues}</span>
                  </li>
                )}
                <li>
                  <strong className="block text-pop">Target Ideale:</strong>
                  <span className="text-white/90">{ai.marketAnalysis.targetAudience}</span>
                </li>
                {ai.marketAnalysis.stylingAdvice && (
                  <li>
                    <strong className="block text-pop">Consigli di Stile per Vinted:</strong>
                    <span className="text-white/90">{ai.marketAnalysis.stylingAdvice}</span>
                  </li>
                )}
                <li>
                  <strong className="block text-accent">Storico Vendite:</strong>
                  <span className="text-white/90">{ai.marketAnalysis.similarSoldPrice}</span>
                </li>
                {ai.marketAnalysis.restorationTips && (
                  <li className="rounded-xl bg-pop/20 p-3 mt-2 border-l-4 border-pop">
                    <strong className="block text-pop">✨ Tips di Restauro e Pulizia:</strong>
                    <span className="text-white/90 italic">{ai.marketAnalysis.restorationTips}</span>
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Estimates & Sales */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <CurrentEstimateCard ai={ai} />
          <FutureEstimateCard ai={ai} />
          <SellCard 
            row={row} 
            soldPriceInput={soldPriceInput} 
            setSoldPriceInput={setSoldPriceInput} 
            handleMarkAsSold={handleMarkAsSold} 
            isPending={markSoldMutation.isPending} 
          />
        </div>

        {/* Profit */}
        {ai.profit && <ProfitChart ai={ai} />}

        {/* Listing */}
        <div className="mt-8">
          {!listing ? (
            <div className="card-soft text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-pop text-pop-foreground">
                <Tag className="h-5 w-5" />
              </div>
              <h2 className="mt-4 font-display text-xl font-bold">Genera l'annuncio Vinted</h2>
              <p className="mt-2 text-muted-foreground">
                Titolo SEO, descrizione informale, hashtag, prezzo e categoria. Pronto da copiare.
              </p>
              <Button
                onClick={handleGenerateListing}
                disabled={generateListingMutation.isPending}
                size="lg"
                className="mt-6 rounded-full shadow-pop"
              >
                {generateListingMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {generateListingMutation.isPending ? "Sto scrivendo…" : "Genera annuncio"}
              </Button>
            </div>
          ) : (
            <ListingCard listing={listing} />
          )}
        </div>
      </main>
    </div>
  );
};

const PhotoStrip = ({ photos }: { photos: string[] }) => (
  <div className="grid grid-cols-2 gap-3">
    {photos.slice(0, 4).map((p, i) => (
      <div key={i} className="aspect-square overflow-hidden rounded-[24px] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <img src={p} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" loading="lazy" />
      </div>
    ))}
  </div>
);

const CurrentEstimateCard = ({ ai }: { ai: NonNullable<AnalysisRow["ai_result"]> }) => (
  <div className="card-soft bg-accent text-black">
    <div className="flex items-center justify-between">
      <h2 className="font-display text-2xl font-black uppercase">Stima oggi</h2>
      <span className="pill bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">EUR</span>
    </div>
    <p className="mt-6 font-display text-5xl font-black tracking-tighter">
      € {ai.currentEstimate.min} – {ai.currentEstimate.max}
    </p>
    <p className="mt-3 text-sm text-muted-foreground">{ai.currentEstimate.reasoning}</p>
  </div>
);

const FutureEstimateCard = ({ ai }: { ai: NonNullable<AnalysisRow["ai_result"]> }) => {
  const cardBgClass = 
    ai.futureEstimate.trend.includes("crescita") ? "bg-[#4ade80]" : // tailwind green-400 equivalent
    ai.futureEstimate.trend === "in calo" ? "bg-[#f87171]" : // tailwind red-400 equivalent
    "bg-accent"; // stable -> yellow

  const trendIcon = {
    "in forte crescita": <TrendingUp className="h-4 w-4 text-black" />,
    "in crescita": <TrendingUp className="h-4 w-4 text-black" />,
    stabile: <Minus className="h-4 w-4 text-black" />,
    "in calo": <TrendingDown className="h-4 w-4 text-black" />,
  }[ai.futureEstimate.trend];

  return (
    <div className={`card-soft ${cardBgClass} text-black transition-colors duration-500`}>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-black uppercase">Proiezione futura</h2>
        <span className="pill bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black font-black">
          {trendIcon}
          {ai.futureEstimate.trend}
        </span>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-3 text-center">
        <FutureCell label="1 anno" value={ai.futureEstimate.year1} />
        <FutureCell label="3 anni" value={ai.futureEstimate.year3} />
        <FutureCell label="5 anni" value={ai.futureEstimate.year5} highlight />
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{ai.futureEstimate.note}</p>
    </div>
  );
};

const FutureCell = ({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) => (
  <div className={`rounded-[20px] p-3 border-2 border-black ${highlight ? "bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] scale-105" : "bg-white/50"}`}>
    <p className="text-xs uppercase font-bold tracking-widest">{label}</p>
    <p className="mt-1 font-display text-2xl font-black">€ {value}</p>
  </div>
);

const ProfitChart = ({ ai }: { ai: NonNullable<AnalysisRow["ai_result"]> }) => {
  const profit = ai.profit;
  const data = useMemo(
    () =>
      profit
        ? [
            { anno: "Acquisto", valore: profit.purchasePrice, etichetta: "speso" },
            {
              anno: "Oggi",
              valore: Math.round((ai.currentEstimate.min + ai.currentEstimate.max) / 2),
              etichetta: "stima media",
            },
            { anno: "1 anno", valore: ai.futureEstimate.year1, etichetta: "proiezione" },
            { anno: "3 anni", valore: ai.futureEstimate.year3, etichetta: "proiezione" },
            { anno: "5 anni", valore: ai.futureEstimate.year5, etichetta: "proiezione" },
          ]
        : [],
    [ai, profit],
  );

  if (!profit) return null;

  const positive = profit.currentProfit >= 0;

  return (
    <div className="card-soft mt-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold">Il tuo guadagno</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pagato € {profit.purchasePrice.toFixed(2)} · Proiezione su 5 anni
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase text-muted-foreground">Margine attuale</p>
          <p className={`font-display text-3xl font-bold ${positive ? "text-primary" : "text-destructive"}`}>
            {positive ? "+" : ""}€ {profit.currentProfit.toFixed(2)}
          </p>
          {profit.currentProfitPercent !== null && (
            <p className={`text-sm font-semibold ${positive ? "text-primary" : "text-destructive"}`}>
              {positive ? "+" : ""}
              {profit.currentProfitPercent}%
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="profitFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="anno" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `€${v}`}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 12,
              }}
              formatter={(value: number) => [`€ ${value}`, "Valore"]}
            />
            <Area
              type="monotone"
              dataKey="valore"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              fill="url(#profitFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const ListingCard = ({ listing }: { listing: VintedListing }) => {
  const { toast } = useToast();
  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiato", description: `${label} pronto da incollare.` });
  };

  const fullText = `${listing.title}\n\n${listing.description}\n\n${listing.hashtags.map((h) => `#${h}`).join(" ")}`;

  return (
    <div className="card-soft">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold">Annuncio Vinted</h2>
        <Button size="sm" variant="outline" className="rounded-full" onClick={() => copy(fullText, "Annuncio")}>
          <Copy className="h-3.5 w-3.5" />
          Copia tutto
        </Button>
      </div>

      <div className="mt-6 space-y-5">
        <Field label="Titolo" value={listing.title} onCopy={() => copy(listing.title, "Titolo")} />
        <Field
          label="Descrizione"
          value={listing.description}
          onCopy={() => copy(listing.description, "Descrizione")}
          multiline
        />

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Hashtag</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {listing.hashtags.map((h) => (
              <span key={h} className="pill bg-primary-soft text-secondary-foreground">
                #{h}
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-gradient-sun p-4">
            <p className="text-xs font-semibold uppercase">Prezzo consigliato</p>
            <p className="mt-1 font-display text-3xl font-bold">€ {listing.suggestedPrice}</p>
          </div>
          <div className="rounded-2xl bg-muted p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Categoria Vinted</p>
            <p className="mt-1 font-medium">{listing.vintedCategory}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-dashed border-border p-4">
          <p className="text-xs font-semibold uppercase text-muted-foreground">💡 Tip vendita</p>
          <p className="mt-1 text-sm">{listing.sellingTip}</p>
        </div>
      </div>
    </div>
  );
};

const Field = ({
  label,
  value,
  onCopy,
  multiline,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  multiline?: boolean;
}) => (
  <div>
    <div className="flex items-center justify-between">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <button onClick={onCopy} className="text-xs font-medium text-primary hover:underline" type="button">
        Copia
      </button>
    </div>
    <p className={`mt-2 rounded-2xl bg-muted p-4 text-sm ${multiline ? "whitespace-pre-line leading-relaxed" : "font-medium"}`}>
      {value}
    </p>
  </div>
);

const SellCard = ({ 
  row, 
  soldPriceInput, 
  setSoldPriceInput, 
  handleMarkAsSold, 
  isPending 
}: { 
  row: AnalysisRow; 
  soldPriceInput: string; 
  setSoldPriceInput: (s: string) => void;
  handleMarkAsSold: () => void;
  isPending: boolean;
}) => {
  const isSold = row.status === "sold";
  const profit = row.ai_result?.profit;

  if (isSold && profit?.soldPrice !== undefined) {
    const isPositive = (profit.actualProfit ?? 0) >= 0;
    return (
      <div className="card-soft bg-[#4ade80] text-black border-2 border-black">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-black uppercase">Venduto!</h2>
          <span className="pill bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <CheckCircle2 className="h-4 w-4 text-black" />
          </span>
        </div>
        <p className="mt-6 font-display text-4xl font-black tracking-tighter">
          € {profit.soldPrice}
        </p>
        <p className="mt-2 text-sm font-bold uppercase tracking-wider">
          Guadagno reale: <span className={isPositive ? "text-black" : "text-red-700"}>{isPositive ? "+" : ""}€ {profit.actualProfit?.toFixed(2)}</span>
        </p>
      </div>
    );
  }

  return (
    <div className="card-soft bg-muted">
      <h2 className="font-display text-xl font-black uppercase">L'hai venduto?</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Inserisci a quanto l'hai venduto per tracciare i tuoi guadagni reali.
      </p>
      <div className="mt-6 flex flex-col gap-3">
        <input
          type="number"
          placeholder="Prezzo di vendita (€)"
          value={soldPriceInput}
          onChange={(e) => setSoldPriceInput(e.target.value)}
          className="h-12 w-full text-lg font-bold bg-white focus:bg-white border-2 border-black rounded-xl px-4 transition-all shadow-[inset_4px_4px_0px_rgba(0,0,0,0.05)] focus:shadow-[inset_2px_2px_0px_rgba(0,0,0,0.1)]"
        />
        <Button 
          onClick={handleMarkAsSold} 
          disabled={!soldPriceInput || isPending}
          className="w-full h-12 rounded-xl btn-neo bg-accent text-black hover:bg-accent/90"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Segna come venduto"}
        </Button>
      </div>
    </div>
  );
};

export default AnalysisResult;
