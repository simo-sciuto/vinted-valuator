import { useState, useEffect } from "react";
import { Zap, Search, ExternalLink, RefreshCw, AlertCircle, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchHotDeals, MarketOpportunity, getTrendingSearches } from "@/services/discovery";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const BUDGET_OPTIONS = [30, 50, 100, 200];

export const FlipDiscovery = ({ limit }: { limit?: number }) => {
  const { user, loading: authLoading } = useAuth();
  const [opportunities, setOpportunities] = useState<MarketOpportunity[]>([]);
  const [hasRealListings, setHasRealListings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [maxPrice, setMaxPrice] = useState(60);
  const [dynamicTrending, setDynamicTrending] = useState<string[]>(getTrendingSearches());

  const scanForDeals = async (isManual = true, tag?: string, budget?: number) => {
    if (loading) return;
    setLoading(true);
    setError(null);

    if (isManual) {
      setScanning(true);
      const isLive = Boolean(tag);
      const statuses = isLive
        ? [
            "Connessione a Vinted...",
            "Scansione annunci attivi...",
            "Analisi AI in corso...",
            "Identificazione occasioni...",
            "Calcolo profitti realistici...",
          ]
        : [
            "Analisi mercato secondhand...",
            "Identificazione oggetti sottovalutati...",
            "Calcolo margini realistici...",
            "Preparazione guida acquisto...",
          ];
      let i = 0;
      setScanStatus(statuses[0]);
      const interval = setInterval(() => {
        i++;
        if (i < statuses.length) setScanStatus(statuses[i]);
        else clearInterval(interval);
      }, 800);
    }

    try {
      const { opportunities: results, hasRealListings: real } = await fetchHotDeals(
        tag,
        budget ?? maxPrice,
      );
      setOpportunities(limit ? results.slice(0, limit) : results);
      setHasRealListings(real);
      setSelectedTag(tag || null);
      if (tag) {
        setSearchQuery("");
        setDynamicTrending((prev) => {
          const filtered = prev.filter((t) => t.toLowerCase() !== tag.toLowerCase());
          return [tag, ...filtered].slice(0, 8);
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore nel recupero delle opportunità");
    } finally {
      setLoading(false);
      if (isManual) {
        setTimeout(() => {
          setScanning(false);
          setScanStatus("");
        }, 400);
      }
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    scanForDeals(true, searchQuery.trim(), maxPrice);
  };

  useEffect(() => {
    if (!authLoading && user && opportunities.length === 0) {
      scanForDeals(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center bg-accent rounded-xl text-black border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <Zap size={20} className="fill-current" />
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-black uppercase tracking-tighter">
              Market Scout
            </h2>
            {hasRealListings && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4ade80] text-black border-2 border-black text-[10px] font-black uppercase">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute h-full w-full rounded-full bg-black opacity-40" />
                  <span className="relative rounded-full h-1.5 w-1.5 bg-black" />
                </span>
                Annunci reali
              </span>
            )}
          </div>
          <p className="text-muted-foreground font-medium text-base md:text-lg">
            {hasRealListings
              ? "Annunci attivi su Vinted valutati dall'AI in tempo reale."
              : "Cosa cercare su Vinted per guadagnarci."}
          </p>
        </div>

        <Button
          onClick={() => scanForDeals(true, selectedTag ?? undefined, maxPrice)}
          disabled={loading}
          className="h-12 rounded-full bg-black text-white hover:bg-black/90 border-2 border-black shadow-pop dark:bg-accent dark:text-black px-8 font-black uppercase tracking-wide transition-all active:translate-y-1 active:shadow-none"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Aggiorna
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <input
              type="text"
              placeholder="Cerca (es. Gucci, Vinili, Carhartt...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 pl-12 pr-28 bg-card border-2 border-black rounded-2xl text-base font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:shadow-none focus:translate-x-0.5 focus:translate-y-0.5 transition-all outline-none"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <Button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-10 rounded-xl bg-accent text-black border-2 border-black font-black uppercase text-[10px] px-3"
            >
              Scout
            </Button>
          </form>

          {/* Budget selector */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest whitespace-nowrap">
              Budget:
            </span>
            <div className="flex gap-1">
              {BUDGET_OPTIONS.map((b) => (
                <button
                  key={b}
                  onClick={() => setMaxPrice(b)}
                  className={cn(
                    "h-10 px-3 rounded-xl border-2 border-black text-[11px] font-black uppercase transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
                    maxPrice === b
                      ? "bg-accent translate-y-0.5 shadow-none"
                      : "bg-card hover:bg-accent hover:-translate-y-0.5",
                  )}
                >
                  €{b}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 py-4 overflow-x-auto no-scrollbar border-y-2 border-black/5">
          <span className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] whitespace-nowrap">
            Caldi:
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => { setSelectedTag(null); scanForDeals(true, undefined, maxPrice); }}
              className={cn(
                "px-4 py-1.5 rounded-full border-2 border-black text-[11px] font-black uppercase whitespace-nowrap transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
                !selectedTag ? "bg-accent translate-y-0.5 shadow-none" : "bg-card hover:bg-accent hover:-translate-y-0.5",
              )}
            >
              Tutti
            </button>
            {dynamicTrending.map((t) => (
              <button
                key={t}
                onClick={() => scanForDeals(true, t, maxPrice)}
                className={cn(
                  "px-4 py-1.5 rounded-full border-2 border-black text-[11px] font-black uppercase whitespace-nowrap transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
                  selectedTag === t ? "bg-accent translate-y-0.5 shadow-none" : "bg-card hover:bg-accent hover:-translate-y-0.5",
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border-2 border-red-500 bg-red-50 p-4 text-red-700 dark:bg-red-950/20">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-bold">{error}</p>
        </div>
      )}

      {/* Cards grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading && opportunities.length === 0 ? (
          [1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[380px] rounded-[32px] border-2 border-black" />
          ))
        ) : (
          opportunities.map((opp) =>
            opp.isReal
              ? <RealOpportunityCard key={opp.id} opportunity={opp} />
              : <OpportunityCard key={opp.id} opportunity={opp} />,
          )
        )}
      </div>

      {/* Scanning overlay */}
      {scanning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md pointer-events-none">
          <div className="bg-card border-4 border-black p-10 rounded-[48px] shadow-[16px_16px_0px_0px_rgba(255,222,30,1)] text-center animate-in zoom-in-95 duration-500 w-[90%] max-w-lg">
            <div className="relative mx-auto h-20 w-20 mb-8">
              <RefreshCw className="h-20 w-20 animate-spin text-accent" />
              <Zap className="absolute inset-0 m-auto h-8 w-8 text-black fill-current" />
            </div>
            <h3 className="font-display text-4xl font-black uppercase tracking-tighter">
              {selectedTag ? "Live Scouting..." : "Analisi Scout..."}
            </h3>
            <p className="mt-4 text-xl font-bold text-accent h-8 transition-all duration-300">
              {scanStatus}
            </p>
            <div className="mt-8 space-y-4">
              <div className="h-4 w-full bg-muted border-2 border-black rounded-full overflow-hidden p-0.5">
                <div className="h-full bg-accent rounded-full animate-[loading_2s_ease-in-out_infinite]" style={{ width: "40%" }} />
              </div>
              {selectedTag && (
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center justify-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                  Scansione annunci Vinted attiva
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Real listing card (scraped from Vinted) ───────────────────────────────────

const RealOpportunityCard = ({ opportunity: opp }: { opportunity: MarketOpportunity }) => {
  const score = opp.dealScore ?? 0;
  const scoreColor = score >= 70 ? "text-green-700" : score >= 55 ? "text-yellow-600" : "text-orange-600";
  const hasImage = Boolean(opp.imageUrl);

  return (
    <div className="card-soft border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 hover:shadow-[12px_12px_0px_0px_rgba(255,222,30,1)] transition-all flex flex-col overflow-hidden p-0">
      {/* Image */}
      {hasImage ? (
        <div className="aspect-[4/3] overflow-hidden">
          <img
            src={opp.imageUrl}
            alt={opp.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            onError={(e) => { (e.currentTarget as HTMLImageElement).closest(".aspect-\\[4\\/3\\]")!.remove(); }}
          />
        </div>
      ) : (
        <div className="aspect-[4/3] bg-muted flex items-center justify-center">
          <Radio className="h-10 w-10 text-muted-foreground/30" />
        </div>
      )}

      <div className="p-5 flex flex-col flex-1">
        {/* Badges */}
        <div className="flex items-center justify-between mb-3">
          <span className="pill bg-[#4ade80] text-black border-2 border-black text-[10px] font-black uppercase flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute h-full w-full rounded-full bg-black opacity-40" />
              <span className="relative rounded-full h-1.5 w-1.5 bg-black" />
            </span>
            Live · {opp.category}
          </span>
          <span className={cn("text-2xl font-black tabular-nums leading-none", scoreColor)}>
            {score}<span className="text-xs text-muted-foreground">/100</span>
          </span>
        </div>

        {/* Title */}
        <h3 className="font-display text-xl font-black uppercase leading-tight line-clamp-2">
          {opp.title}
        </h3>

        {/* Price grid */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="p-3 rounded-2xl bg-muted border-2 border-black text-center">
            <p className="text-[9px] font-black uppercase text-muted-foreground leading-none mb-1.5">Chiede</p>
            <p className="text-xl font-black leading-none">€{opp.buyMaxPrice}</p>
          </div>
          <div className="p-3 rounded-2xl bg-muted border-2 border-black text-center">
            <p className="text-[9px] font-black uppercase text-muted-foreground leading-none mb-1.5">Vale</p>
            <p className="text-xl font-black leading-none">€{opp.sellEstimate}</p>
          </div>
          <div className="p-3 rounded-2xl bg-[#4ade80]/20 border-2 border-[#4ade80] text-center">
            <p className="text-[9px] font-black uppercase text-green-700 leading-none mb-1.5">Profitto</p>
            <p className="text-xl font-black text-green-700 leading-none">+€{opp.profitEstimate}</p>
          </div>
        </div>

        {/* Why */}
        <div className="mt-4 flex-1">
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider mb-1.5">Perché è un deal</p>
          <p className="text-sm font-medium leading-snug">{opp.whyUndervalued}</p>
        </div>

        {/* Tip */}
        <div className="mt-4 p-3 rounded-2xl bg-accent/10 border-2 border-accent/40">
          <p className="text-[9px] font-black uppercase tracking-wider mb-1">Verifica prima di comprare</p>
          <p className="text-xs font-medium leading-snug">{opp.spotTip}</p>
        </div>

        {/* CTA */}
        <Button
          asChild
          className="mt-4 h-12 w-full rounded-2xl border-2 border-black bg-[#4ade80] text-black hover:bg-accent font-black uppercase text-xs tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-0.5 transition-all"
        >
          <a href={opp.directUrl ?? opp.searchUrl} target="_blank" rel="noopener noreferrer">
            Vedi Annuncio
            <ExternalLink className="ml-2 h-3.5 w-3.5" />
          </a>
        </Button>
      </div>
    </div>
  );
};

// ── AI suggestion card ────────────────────────────────────────────────────────

const OpportunityCard = ({ opportunity }: { opportunity: MarketOpportunity }) => (
  <div className="card-soft border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 hover:shadow-[12px_12px_0px_0px_rgba(255,222,30,1)] transition-all flex flex-col">
    <div className="flex items-start justify-between mb-3">
      <span className="pill bg-accent text-black border-2 border-black text-[10px] font-black uppercase">
        {opportunity.category}
      </span>
      <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">AI Scout</span>
    </div>

    <h3 className="font-display text-2xl font-black uppercase leading-none tracking-tight">
      {opportunity.title}
    </h3>

    <div className="grid grid-cols-3 gap-2 mt-5">
      <div className="p-3 rounded-2xl bg-muted border-2 border-black text-center">
        <p className="text-[9px] font-black uppercase text-muted-foreground leading-none mb-1.5">Compra</p>
        <p className="text-xl font-black leading-none">€{opportunity.buyMaxPrice}</p>
      </div>
      <div className="p-3 rounded-2xl bg-muted border-2 border-black text-center">
        <p className="text-[9px] font-black uppercase text-muted-foreground leading-none mb-1.5">Rivendi</p>
        <p className="text-xl font-black leading-none">€{opportunity.sellEstimate}</p>
      </div>
      <div className="p-3 rounded-2xl bg-[#4ade80]/20 border-2 border-[#4ade80] text-center">
        <p className="text-[9px] font-black uppercase text-green-700 leading-none mb-1.5">Profitto</p>
        <p className="text-xl font-black text-green-700 leading-none">+€{opportunity.profitEstimate}</p>
      </div>
    </div>

    <div className="mt-5 flex-1">
      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider mb-1.5">Perché è un deal</p>
      <p className="text-sm font-medium leading-snug">{opportunity.whyUndervalued}</p>
    </div>

    <div className="mt-4 p-3 rounded-2xl bg-accent/10 border-2 border-accent/40">
      <p className="text-[9px] font-black uppercase tracking-wider mb-1">Come riconoscerlo</p>
      <p className="text-xs font-medium leading-snug">{opportunity.spotTip}</p>
    </div>

    <div className="mt-3">
      <p className="text-[9px] font-black uppercase text-muted-foreground tracking-wider mb-1">Dove rivenderlo</p>
      <p className="text-xs font-medium text-muted-foreground leading-snug">{opportunity.marketContext}</p>
    </div>

    <Button
      asChild
      className="mt-5 h-12 w-full rounded-2xl border-2 border-black bg-black text-white hover:bg-accent hover:text-black font-black uppercase text-xs tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-0.5 transition-all"
    >
      <a href={opportunity.searchUrl} target="_blank" rel="noopener noreferrer">
        <Search className="mr-2 h-3.5 w-3.5" />
        Cerca su Vinted
        <ExternalLink className="ml-2 h-3 w-3 opacity-60" />
      </a>
    </Button>
  </div>
);
