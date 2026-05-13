import { useState } from "react";
import {
  Scale, AlertCircle, TrendingDown, TrendingUp,
  Minus, CheckCircle2, XCircle, RefreshCw, ArrowRight, Tag, Link2, ExternalLink, Share2, Copy,
} from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { ShareModal } from "@/components/ShareModal";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { callCheckDeal } from "@/services/discovery";
import type { DealCheckResponse } from "@/types/analysis";

type Verdict = DealCheckResponse["result"]["market"]["verdict"];

const VERDICT_CFG: Record<Verdict, { bg: string; pill: string; scoreColor: string; label: string; icon: React.ReactNode }> = {
  "ottimo affare": {
    bg: "bg-[#4ade80]/15 border-[#4ade80]",
    pill: "bg-[#4ade80] text-black border-[#4ade80]",
    scoreColor: "text-green-600",
    label: "OTTIMO AFFARE 🔥",
    icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
  },
  "buon affare": {
    bg: "bg-accent/15 border-accent",
    pill: "bg-accent text-black border-accent",
    scoreColor: "text-yellow-600",
    label: "BUON AFFARE 👍",
    icon: <TrendingUp className="h-5 w-5 text-yellow-600" />,
  },
  "prezzo equo": {
    bg: "bg-blue-50 border-blue-300 dark:bg-blue-950/20 dark:border-blue-500",
    pill: "bg-blue-400 text-white border-blue-400",
    scoreColor: "text-blue-500",
    label: "PREZZO EQUO 🤷",
    icon: <Minus className="h-5 w-5 text-blue-500" />,
  },
  "sopravvalutato": {
    bg: "bg-orange-50 border-orange-400 dark:bg-orange-950/20 dark:border-orange-400",
    pill: "bg-orange-400 text-black border-orange-400",
    scoreColor: "text-orange-500",
    label: "SOPRAVVALUTATO ⚠️",
    icon: <TrendingDown className="h-5 w-5 text-orange-500" />,
  },
  "da evitare": {
    bg: "bg-red-50 border-red-500 dark:bg-red-950/20 dark:border-red-500",
    pill: "bg-red-500 text-white border-red-500",
    scoreColor: "text-red-600",
    label: "DA EVITARE 🚫",
    icon: <XCircle className="h-5 w-5 text-red-600" />,
  },
};

const PLATFORM_CFG: Record<string, string> = {
  Vinted: "bg-teal-100 text-teal-800 border-teal-400",
  eBay: "bg-red-100 text-red-800 border-red-400",
  Depop: "bg-pink-100 text-pink-800 border-pink-400",
};

const SCAN_STATUSES = [
  "Lettura annuncio Vinted...",
  "Identificazione oggetto...",
  "Ricerca prezzi di mercato...",
  "Confronto con vendite simili...",
  "Calcolo convenienza...",
  "Analisi deal correlati...",
  "Finalizzazione verdetto...",
];

export default function DealChecker() {
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [response, setResponse] = useState<DealCheckResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanStatus, setScanStatus] = useState("");

  const handleAnalyze = async () => {
    if (!url.trim()) { setError("Incolla il link dell'annuncio Vinted."); return; }

    setLoading(true);
    setError(null);
    setResponse(null);

    let i = 0;
    const interval = setInterval(() => {
      setScanStatus(SCAN_STATUSES[Math.min(i, SCAN_STATUSES.length - 1)]);
      i++;
    }, 700);

    try {
      const data = await callCheckDeal(url.trim());
      setResponse(data);
      setTimeout(() => {
        document.getElementById("deal-result")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante l'analisi");
    } finally {
      clearInterval(interval);
      setLoading(false);
      setScanStatus("");
    }
  };

  const handleReset = () => {
    setResponse(null);
    setUrl("");
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cfg = response ? (VERDICT_CFG[response.result.market.verdict] ?? VERDICT_CFG["prezzo equo"]) : null;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="container px-6 py-10 pt-24 md:pt-32 pb-32 md:pb-10 max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center bg-accent rounded-xl text-black border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <Scale size={20} />
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none">
              Check Deal
            </h1>
          </div>
          <p className="text-muted-foreground font-medium text-lg">
            Incolla il link di un annuncio Vinted e scopri subito se vale la pena acquistarlo.
          </p>
        </div>

        {/* URL Input Card */}
        <div className="bg-card border-4 border-black rounded-[32px] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 md:p-8 space-y-5">
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
              Link annuncio Vinted
            </label>
            <div className="relative">
              <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="url"
                value={url}
                onChange={(e) => { setUrl(e.target.value); setError(null); }}
                onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                placeholder="https://www.vinted.it/items/..."
                className="w-full h-14 pl-12 pr-4 rounded-2xl border-2 border-black bg-background font-medium text-base placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-black/20 transition-all"
              />
            </div>
            <p className="text-[11px] text-muted-foreground font-medium">
              Funziona con qualsiasi annuncio Vinted: .it, .fr, .de, .es e altri.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-3 rounded-2xl border-2 border-red-500 bg-red-50 px-4 py-3 text-red-700 dark:bg-red-950/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p className="text-sm font-bold">{error}</p>
            </div>
          )}

          <Button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full h-14 rounded-2xl bg-black text-white hover:bg-black/90 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] font-black uppercase text-base tracking-wide transition-all active:translate-y-1 active:shadow-none"
          >
            {loading ? (
              <><RefreshCw className="mr-2 h-5 w-5 animate-spin" /> Analisi in corso…</>
            ) : (
              <><Scale className="mr-2 h-5 w-5" /> Analizza Annuncio</>
            )}
          </Button>
        </div>

        {/* Results */}
        {response && cfg && (
          <div id="deal-result" className="mt-12 space-y-6">
            {/* Listing Preview */}
            <a
              href={response.listing.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 bg-card border-2 border-black rounded-[24px] p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all group"
            >
              {response.listing.imageUrl ? (
                <img
                  src={response.listing.imageUrl}
                  alt={response.listing.title}
                  className="h-20 w-20 rounded-2xl object-cover border-2 border-black shrink-0"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                />
              ) : (
                <div className="h-20 w-20 rounded-2xl bg-muted border-2 border-black shrink-0 flex items-center justify-center">
                  <Scale className="h-8 w-8 text-muted-foreground/40" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-black text-base leading-tight line-clamp-2 group-hover:text-accent transition-colors">
                  {response.listing.title}
                </p>
                {response.listing.brand && (
                  <p className="text-xs font-bold text-muted-foreground uppercase mt-1">{response.listing.brand}</p>
                )}
                <p className="font-black text-2xl mt-1">
                  {response.listing.price > 0 ? `€${response.listing.price}` : "Prezzo non trovato"}
                </p>
              </div>
              <ExternalLink className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
            </a>

            {/* Verdict Card */}
            <div className={cn("border-4 rounded-[32px] p-6 md:p-8 space-y-6", cfg.bg)}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className={cn("inline-flex items-center gap-2 border-2 rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-wider", cfg.pill)}>
                    {cfg.icon}
                    {cfg.label}
                  </span>
                  <h2 className="mt-4 font-display text-2xl md:text-3xl font-black uppercase tracking-tighter leading-tight">
                    {response.result.item.name}
                  </h2>
                  <p className="mt-1 text-sm font-bold text-muted-foreground uppercase tracking-wider">
                    {response.result.item.brand} · {response.result.item.category} · {response.result.item.estimatedYear}
                  </p>
                </div>
                <div className="text-right shrink-0 space-y-2">
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Deal Score</p>
                    <p className={cn("text-5xl font-black tabular-nums leading-none", cfg.scoreColor)}>
                      {response.result.market.dealScore}
                    </p>
                    <p className="text-[10px] font-black text-muted-foreground">/100</p>
                  </div>
                  {response.result.market.resaleProbability !== undefined && (
                    <div className="border-t border-black/10 pt-2">
                      <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Rivendita</p>
                      <p className={cn(
                        "text-2xl font-black tabular-nums leading-none",
                        response.result.market.resaleProbability >= 70 ? "text-green-600" :
                        response.result.market.resaleProbability >= 40 ? "text-yellow-600" : "text-red-600"
                      )}>
                        {response.result.market.resaleProbability}%
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Price Comparison */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-card/70 border-2 border-black/20 rounded-2xl p-4 text-center">
                  <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-1">Valore stimato</p>
                  <p className="font-black text-lg leading-none">
                    €{response.result.market.estimatedMin}–{response.result.market.estimatedMax}
                  </p>
                </div>
                <div className="bg-card/70 border-2 border-black/20 rounded-2xl p-4 text-center">
                  <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-1">Prezzo annuncio</p>
                  <p className="font-black text-lg leading-none">
                    {response.listing.price > 0 ? `€${response.listing.price}` : "N/D"}
                  </p>
                </div>
                <div className={cn(
                  "border-2 rounded-2xl p-4 text-center",
                  response.result.market.savingsAmount >= 0
                    ? "bg-[#4ade80]/20 border-[#4ade80]"
                    : "bg-red-50 border-red-400 dark:bg-red-950/20"
                )}>
                  <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-1">
                    {response.result.market.savingsAmount >= 0 ? "Risparmio" : "Sovrapprezzo"}
                  </p>
                  <p className={cn(
                    "font-black text-lg leading-none",
                    response.result.market.savingsAmount >= 0 ? "text-green-700" : "text-red-600"
                  )}>
                    {response.result.market.savingsAmount >= 0 ? "+" : ""}€{Math.abs(response.result.market.savingsAmount).toFixed(0)}
                    <span className="text-xs ml-1">
                      ({response.result.market.savingsAmount >= 0 ? "-" : "+"}{Math.abs(response.result.market.savingsPercent).toFixed(0)}%)
                    </span>
                  </p>
                </div>
              </div>

              {/* Reasoning + Selling Tip */}
              <div className="bg-card/60 border-2 border-black/10 rounded-2xl p-5 space-y-3">
                <p className="text-sm font-medium leading-relaxed">{response.result.market.reasoning}</p>
                <div className="flex items-start gap-2 pt-2 border-t border-black/10">
                  <Tag className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                  <p className="text-sm font-bold text-muted-foreground">{response.result.market.sellingTip}</p>
                </div>
              </div>

              {/* Buy recommendation */}
              <div className={cn(
                "flex items-center gap-3 rounded-2xl border-2 px-5 py-3",
                response.result.market.buyRecommendation
                  ? "border-[#4ade80] bg-[#4ade80]/10 text-green-800 dark:text-green-300"
                  : "border-red-400 bg-red-50 text-red-800 dark:bg-red-950/20 dark:text-red-300"
              )}>
                {response.result.market.buyRecommendation
                  ? <CheckCircle2 className="h-5 w-5 shrink-0" />
                  : <XCircle className="h-5 w-5 shrink-0" />
                }
                <p className="font-black uppercase text-sm tracking-wider">
                  {response.result.market.buyRecommendation ? "Consigliamo l'acquisto" : "Non consigliamo l'acquisto"}
                </p>
              </div>

              {/* Negotiation script */}
              {response.result.negotiationScript && (
                <div className="bg-black rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-accent">Script di Trattativa</p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(response.result.negotiationScript!);
                        toast({ title: "Copiato", description: "Script pronto da inviare al venditore." });
                      }}
                      className="flex items-center gap-1.5 rounded-full bg-accent text-black px-3 py-1 text-[10px] font-black uppercase border-2 border-black hover:bg-accent/90 transition-colors"
                    >
                      <Copy className="h-3 w-3" /> Copia
                    </button>
                  </div>
                  <p className="text-sm text-white/90 leading-relaxed italic border-l-4 border-accent pl-3">
                    "{response.result.negotiationScript}"
                  </p>
                  <p className="text-[10px] text-white/40 font-medium">Invialo direttamente al venditore su Vinted per trattare il prezzo.</p>
                </div>
              )}
            </div>

            {/* Similar Deals */}
            <div className="space-y-4">
              <h2 className="font-display text-2xl font-black uppercase tracking-tighter">Cerca Affari Simili</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {response.result.similarDeals.map((deal, i) => (
                  <a
                    key={i}
                    href={deal.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group bg-card border-2 border-black rounded-[24px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(255,222,30,1)] transition-all p-5 flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className={cn(
                          "inline-block border text-[10px] font-black uppercase px-2 py-0.5 rounded-full mb-2",
                          PLATFORM_CFG[deal.platform] ?? "bg-secondary border-black text-foreground"
                        )}>
                          {deal.platform}
                        </span>
                        <h3 className="font-display font-black text-base uppercase leading-tight group-hover:text-accent transition-colors">
                          {deal.name}
                        </h3>
                      </div>
                      <div className="shrink-0 bg-black text-white p-2 rounded-full group-hover:bg-accent group-hover:text-black transition-colors">
                        <ArrowRight size={14} />
                      </div>
                    </div>
                    <div className="flex items-end justify-between gap-2">
                      <p className="text-xs font-bold text-muted-foreground leading-snug flex-1">{deal.whyInteresting}</p>
                      <span className="shrink-0 bg-accent/20 border border-accent rounded-full px-2.5 py-1 text-xs font-black whitespace-nowrap">
                        €{deal.priceRange}
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <ShareModal
                trigger={
                  <Button variant="outline" className="flex-1 h-12 rounded-2xl border-2 border-black font-black uppercase text-sm tracking-wider hover:bg-accent hover:border-accent transition-all">
                    <Share2 className="mr-2 h-4 w-4" /> Condividi
                  </Button>
                }
                filename={`revinted-deal-${response.result.market.dealScore}`}
              >
                {(ref) => <DealShareCard ref={ref} response={response} />}
              </ShareModal>
              <Button
                variant="outline"
                onClick={handleReset}
                className="flex-1 h-12 rounded-2xl border-2 border-black font-black uppercase text-sm tracking-wider hover:bg-accent hover:border-accent transition-all"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Nuovo
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md pointer-events-none">
          <div className="bg-card border-4 border-black p-10 rounded-[48px] shadow-[16px_16px_0px_0px_rgba(255,222,30,1)] text-center animate-in zoom-in-95 duration-500 w-[90%] max-w-lg">
            <div className="relative mx-auto h-20 w-20 mb-8">
              <RefreshCw className="h-20 w-20 animate-spin text-accent" />
              <Scale className="absolute inset-0 m-auto h-8 w-8 text-black" />
            </div>
            <h3 className="font-display text-4xl font-black uppercase tracking-tighter">Analisi in corso…</h3>
            <p className="mt-4 text-xl font-bold text-accent h-8 transition-all duration-300">
              {scanStatus}
            </p>
            <div className="mt-8">
              <div className="h-4 w-full bg-muted border-2 border-black rounded-full overflow-hidden p-0.5">
                <div className="h-full bg-accent rounded-full animate-[loading_2s_ease-in-out_infinite]" style={{ width: "40%" }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Share Card ─────────────────────────────────────────────────────────────

import React from "react";

const VERDICT_BG_SOLID: Record<Verdict, string> = {
  "ottimo affare": "#dcfce7",
  "buon affare": "#fef9c3",
  "prezzo equo": "#dbeafe",
  "sopravvalutato": "#ffedd5",
  "da evitare": "#fee2e2",
};
const VERDICT_BORDER_SOLID: Record<Verdict, string> = {
  "ottimo affare": "#4ade80",
  "buon affare": "#facc15",
  "prezzo equo": "#93c5fd",
  "sopravvalutato": "#fb923c",
  "da evitare": "#f87171",
};
const VERDICT_LABEL_FULL: Record<Verdict, string> = {
  "ottimo affare": "OTTIMO AFFARE 🔥",
  "buon affare": "BUON AFFARE 👍",
  "prezzo equo": "PREZZO EQUO 🤷",
  "sopravvalutato": "SOPRAVVALUTATO ⚠️",
  "da evitare": "DA EVITARE 🚫",
};

const DealShareCard = React.forwardRef<HTMLDivElement, { response: DealCheckResponse }>(
  ({ response }, ref) => {
    const v = response.result.market.verdict;
    const { market, item } = response.result;
    const savings = market.savingsAmount;
    return (
      <div ref={ref} style={{ background: VERDICT_BG_SOLID[v], borderTop: `6px solid ${VERDICT_BORDER_SOLID[v]}`, fontFamily: "'Space Grotesk','Arial Black',sans-serif", padding: "28px 32px 24px", width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ background: "#000", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#FFE01E", fontSize: 14 }}>✦</span>
            </div>
            <span style={{ fontWeight: 900, fontSize: 13, letterSpacing: "0.15em", textTransform: "uppercase" }}>ReVinted</span>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "#6b7280" }}>Score</div>
            <div style={{ fontSize: 40, fontWeight: 900, lineHeight: 1, color: VERDICT_BORDER_SOLID[v] }}>{market.dealScore}</div>
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "inline-block", background: VERDICT_BORDER_SOLID[v], color: "#000", fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", padding: "5px 14px", borderRadius: 999, marginBottom: 10 }}>
            {VERDICT_LABEL_FULL[v]}
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, textTransform: "uppercase", lineHeight: 1.2, letterSpacing: "-0.02em" }}>{item.name}</div>
          <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 4 }}>{item.brand} · {item.category}</div>
        </div>
        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, background: "rgba(255,255,255,0.7)", borderRadius: 12, padding: "10px 14px" }}>
            <div style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "#9ca3af", marginBottom: 2 }}>Chiesto</div>
            <div style={{ fontSize: 20, fontWeight: 900 }}>{response.listing.price > 0 ? `€${response.listing.price}` : "N/D"}</div>
          </div>
          <div style={{ flex: 1, background: "rgba(255,255,255,0.7)", borderRadius: 12, padding: "10px 14px" }}>
            <div style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "#9ca3af", marginBottom: 2 }}>Valore stimato</div>
            <div style={{ fontSize: 20, fontWeight: 900 }}>€{market.estimatedMin}–{market.estimatedMax}</div>
          </div>
          <div style={{ flex: 1, background: savings >= 0 ? "rgba(74,222,128,0.25)" : "rgba(239,68,68,0.15)", borderRadius: 12, padding: "10px 14px" }}>
            <div style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "#9ca3af", marginBottom: 2 }}>{savings >= 0 ? "Risparmi" : "Surplus"}</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: savings >= 0 ? "#15803d" : "#dc2626" }}>{savings >= 0 ? "+" : ""}€{Math.abs(savings).toFixed(0)}</div>
          </div>
        </div>
        <div style={{ borderTop: "1.5px solid rgba(0,0,0,0.1)", paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.12em", color: "#9ca3af" }}>revinted.app</span>
          <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600 }}>Analizza gratis i tuoi oggetti</span>
        </div>
      </div>
    );
  }
);
DealShareCard.displayName = "DealShareCard";
