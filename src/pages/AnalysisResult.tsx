import { useMemo, useState } from "react";
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
import { ArrowLeft, Copy, Sparkles, TrendingUp, TrendingDown, Minus, Tag, Loader2, CheckCircle2, ExternalLink, Zap } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AnalysisRow, MultiPlatformListing, AnalysisResult as AnalysisResultType } from "@/types/analysis";
import { cn } from "@/lib/utils";

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

      <main className="container max-w-5xl px-6 py-10 pt-24 md:pt-32 pb-32 md:pb-10">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-bold uppercase tracking-wider text-muted-foreground hover:text-black transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Torna allo storico
        </Link>

        {/* Header */}
        <div className="mt-6 grid gap-8 md:grid-cols-[1fr_360px]">
          <div>
            <div className="flex flex-wrap gap-2">
              <span className="pill bg-accent text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-[10px]">{ai.identification.category}</span>
              {row.status === "sold" && (
                <span className="pill bg-[#4ade80] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-[10px]">Venduto</span>
              )}
            </div>
            <h1 className="mt-4 font-display text-3xl sm:text-4xl font-black uppercase tracking-tighter md:text-5xl leading-none">{ai.identification.name}</h1>
            <p className="mt-2 text-base md:text-lg font-medium text-foreground/80">
              {[ai.identification.brand, ai.identification.artist, ai.identification.era]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <div className="mt-6 flex flex-wrap gap-2 md:gap-3">
              <span className="pill bg-card text-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-[10px] md:text-xs">Età: {ai.identification.estimatedAge}</span>
              <span className="pill bg-card text-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-[10px] md:text-xs">Condizione: {ai.identification.condition}</span>
              {ai.identification.style && (
                <span className="pill bg-card text-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-[10px] md:text-xs">Stile: {ai.identification.style}</span>
              )}
              <span className="pill bg-pop text-pop-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-[10px] md:text-xs">
                Precisione: {Math.round(ai.identification.confidence * 100)}%
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
          ) : null}
          
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

          {ai.sources && ai.sources.length > 0 && (
            <div className="card-soft md:col-span-2">
              <h2 className="font-display text-xl font-bold uppercase flex items-center gap-2">
                <ExternalLink className="h-5 w-5 text-primary" /> Fonti consultate
              </h2>
              {ai.marketResearch && (
                <p className="mt-2 text-sm text-foreground/80 leading-relaxed">{ai.marketResearch}</p>
              )}
              <ul className="mt-4 flex flex-wrap gap-2">
                {ai.sources.map((s, i) => (
                  <li key={i}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition"
                    >
                      {s.title || new URL(s.url).hostname.replace("www.", "")}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                ))}
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

        {/* Flip Finder */}
        <div className="mt-6">
          <FlipFinderCard ai={ai} />
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
  <div className="grid grid-cols-4 md:grid-cols-2 gap-2 md:gap-3">
    {photos.slice(0, 4).map((p, i) => (
      <Dialog key={i}>
        <DialogTrigger asChild>
          <button className={cn(
            "aspect-square overflow-hidden rounded-2xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all group",
            i === 0 ? "col-span-4 md:col-span-2 aspect-[16/9] md:aspect-square" : "col-span-1"
          )}>
            <img src={p} alt={`Foto ${i + 1}`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden border-4 border-black bg-black sm:rounded-[32px] flex items-center justify-center">
          <img src={p} alt={`Foto ${i + 1} Full`} className="max-w-full max-h-[90vh] object-contain" />
        </DialogContent>
      </Dialog>
    ))}
  </div>
);

const CurrentEstimateCard = ({ ai }: { ai: NonNullable<AnalysisRow["ai_result"]> }) => {
  const searchQuery = encodeURIComponent(`${ai.identification.brand || ""} ${ai.identification.name}`);
  const vintedUrl = `https://www.vinted.it/catalog?search_text=${searchQuery}`;
  const ebayUrl = `https://www.ebay.it/sch/i.html?_nkw=${searchQuery}&LH_Sold=1&LH_Complete=1`;

  return (
    <div className="card-soft bg-accent text-accent-foreground border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-none">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-black uppercase">Stima oggi</h2>
        <span className="pill bg-card text-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-none text-xs font-bold">EUR</span>
      </div>
      <p className="mt-6 font-display text-5xl font-black tracking-tighter">
        € {ai.currentEstimate.min} – {ai.currentEstimate.max}
      </p>
      <p className="mt-3 text-sm text-accent-foreground/70 leading-snug font-medium">{ai.currentEstimate.reasoning}</p>
      
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Button asChild variant="outline" size="sm" className="bg-card text-foreground border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all h-auto py-2.5 px-3 dark:shadow-none">
          <a href={vintedUrl} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 text-center">
            <span className="text-[10px] uppercase font-bold opacity-50">Vinted</span>
            <span className="flex items-center gap-1 text-xs font-black">
              Simili <ExternalLink className="h-3 w-3" />
            </span>
          </a>
        </Button>
        <Button asChild variant="outline" size="sm" className="bg-card text-foreground border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all h-auto py-2.5 px-3 dark:shadow-none">
          <a href={ebayUrl} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 text-center">
            <span className="text-[10px] uppercase font-bold opacity-50">eBay</span>
            <span className="flex items-center gap-1 text-xs font-black">
              Venduti <ExternalLink className="h-3 w-3" />
            </span>
          </a>
        </Button>
      </div>
    </div>
  );
};

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
                color: "hsl(var(--foreground))",
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

const ListingCard = ({ listing }: { listing: MultiPlatformListing }) => {
  const { toast } = useToast();
  const [platform, setPlatform] = useState("vinted");

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiato", description: `${label} pronto da incollare.` });
  };

  const getPlatformDescription = () => {
    if (platform === "depop") return listing.depopDescription || listing.description;
    if (platform === "ebay") return listing.ebayDescription || listing.description;
    return listing.description;
  };

  const currentDesc = getPlatformDescription();
  const fullText = `${listing.title}\n\n${currentDesc}\n\n${listing.hashtags.map((h) => `#${h}`).join(" ")}`;

  return (
    <div className="card-soft">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-display text-xl font-bold uppercase tracking-tight">Generatore Annunci</h2>
        <Tabs value={platform} onValueChange={setPlatform} className="w-full sm:w-auto">
          <TabsList className="grid w-full grid-cols-3 h-10 border-2 border-black bg-muted p-1">
            <TabsTrigger value="vinted" className="data-[state=active]:bg-accent data-[state=active]:text-black font-bold text-xs uppercase">Vinted</TabsTrigger>
            <TabsTrigger value="depop" className="data-[state=active]:bg-[#ff4800] data-[state=active]:text-white font-bold text-xs uppercase">Depop</TabsTrigger>
            <TabsTrigger value="ebay" className="data-[state=active]:bg-[#0064d2] data-[state=active]:text-white font-bold text-xs uppercase">eBay</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="mt-8 space-y-6">
        <div className="flex items-center justify-between">
           <span className="pill bg-white text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-[10px] uppercase font-bold">
             Copywriting per {platform.toUpperCase()}
           </span>
           <Button size="sm" variant="outline" className="rounded-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all" onClick={() => copy(fullText, "Annuncio completo")}>
            <Copy className="h-3.5 w-3.5" />
            Copia tutto
          </Button>
        </div>

        <Field label="Titolo" value={listing.title} onCopy={() => copy(listing.title, "Titolo")} />
        
        <Field
          label={`Descrizione ${platform.charAt(0).toUpperCase() + platform.slice(1)}`}
          value={currentDesc}
          onCopy={() => copy(currentDesc, "Descrizione")}
          multiline
        />

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Hashtag consigliati</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {listing.hashtags.map((h) => (
              <span key={h} className="pill bg-white text-black border-2 border-black text-[11px] font-bold">
                #{h}
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-accent p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-xs font-semibold uppercase text-black/60">Prezzo consigliato</p>
            <p className="mt-1 font-display text-3xl font-black">€ {listing.suggestedPrice}</p>
          </div>
          <div className="rounded-2xl bg-muted p-4 border-2 border-black">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Categoria ottimale</p>
            <p className="mt-1 font-bold">{listing.vintedCategory}</p>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-dashed border-black/20 p-4 bg-muted/30">
          <p className="text-xs font-semibold uppercase text-muted-foreground">💡 Pro-Tip per questa piattaforma</p>
          <p className="mt-1 text-sm italic">
            {platform === 'depop' ? "Usa foto molto luminose e 'lifestyle' per attirare l'utenza Depop." : 
             platform === 'ebay' ? "Assicurati di compilare tutti i dettagli tecnici (Specifiche dell'oggetto) su eBay." : 
             listing.sellingTip}
          </p>
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

const FlipFinderCard = ({ ai }: { ai: NonNullable<AnalysisRow["ai_result"]> }) => {
  const minPrice = ai.currentEstimate.min;
  // Bargain price is 60% of min estimate or less
  const bargainPrice = Math.floor(minPrice * 0.6);
  const searchQuery = encodeURIComponent(`${ai.identification.brand || ""} ${ai.identification.name}`);
  
  // Vinted doesn't support easy price_to via URL parameters in a simple way without more params, 
  // but we can try to append catalog filters if we know the structure.
  // Standard search: catalog?search_text=...
  // Adding price filter (experimental/best effort for Vinted URL structure)
  const flipUrl = `https://www.vinted.it/catalog?search_text=${searchQuery}&price_to=${bargainPrice}&order=price_low_to_high`;

  return (
    <div className="card-soft bg-black text-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(255,222,30,1)] relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-16 bg-accent/20 rounded-full blur-3xl -mr-8 -mt-8 pointer-events-none"></div>
      
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-accent rounded-lg text-black">
              <Zap className="h-5 w-5 fill-current" />
            </div>
            <h2 className="font-display text-2xl font-black uppercase tracking-tight">Flip Finder <span className="text-accent">(Beta)</span></h2>
          </div>
          <p className="mt-4 text-white/80 font-medium max-w-xl">
            Vuoi fare un affare? Cerchiamo per te lo stesso oggetto in vendita a meno di <span className="text-accent font-black text-xl">€{bargainPrice}</span>. 
            Se lo trovi a questo prezzo, il tuo potenziale di guadagno è enorme!
          </p>
        </div>
        
        <div className="w-full md:w-auto">
          <Button asChild size="lg" className="w-full md:w-auto h-16 px-8 rounded-2xl bg-accent text-black hover:bg-accent/90 border-2 border-black shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
            <a href={flipUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-lg font-black uppercase">
              Trova Affari <ExternalLink className="h-5 w-5" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResult;
