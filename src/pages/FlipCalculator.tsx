import { useState } from "react";
import React from "react";
import { Calculator, TrendingUp, TrendingDown, Minus, Info, Share2 } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { ShareModal } from "@/components/ShareModal";
import { cn } from "@/lib/utils";

type Platform = "Vinted" | "eBay" | "Depop";

const PLATFORMS: Record<Platform, { sellerPercent: number; sellerFixed: number; buyerPercent?: number; buyerFixed?: number; color: string; note?: string }> = {
  Vinted: {
    sellerPercent: 0,
    sellerFixed: 0,
    buyerPercent: 5,
    buyerFixed: 0.70,
    color: "bg-teal-100 border-teal-500 text-teal-800",
    note: "0% per chi vende — l'acquirente paga una commissione separata",
  },
  eBay: {
    sellerPercent: 12.9,
    sellerFixed: 0.30,
    color: "bg-red-100 border-red-400 text-red-800",
    note: "12.9% + €0.30 per transazione",
  },
  Depop: {
    sellerPercent: 12.9,
    sellerFixed: 0.30,
    color: "bg-pink-100 border-pink-400 text-pink-800",
    note: "10% commissione + 2.9% + €0.30 pagamenti",
  },
};

function calc(buyPrice: number, sellPrice: number, shipping: number, platform: Platform) {
  const fees = PLATFORMS[platform];
  const platformFee = sellPrice * fees.sellerPercent / 100 + (sellPrice > 0 ? fees.sellerFixed : 0);
  const totalCosts = buyPrice + shipping + platformFee;
  const netProfit = sellPrice - totalCosts;
  const roi = buyPrice > 0 ? (netProfit / buyPrice) * 100 : 0;
  const breakEven = fees.sellerPercent > 0
    ? (buyPrice + shipping + fees.sellerFixed) / (1 - fees.sellerPercent / 100)
    : buyPrice + shipping;
  const buyerPays = fees.buyerPercent
    ? sellPrice + sellPrice * fees.buyerPercent / 100 + (fees.buyerFixed ?? 0)
    : null;
  return { platformFee, netProfit, roi, breakEven, buyerPays };
}

function fmt(n: number) {
  return n.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function PriceInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">{label}</label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-lg text-muted-foreground">€</span>
        <input
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "0.00"}
          className="w-full h-14 pl-9 pr-4 rounded-2xl border-2 border-black bg-background font-black text-xl focus:outline-none focus:ring-2 focus:ring-black/20 transition-all"
        />
      </div>
    </div>
  );
}

export default function FlipCalculator() {
  const [platform, setPlatform] = useState<Platform>("Vinted");
  const [buyPrice, setBuyPrice] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [shipping, setShipping] = useState("");

  const buy = parseFloat(buyPrice) || 0;
  const sell = parseFloat(sellPrice) || 0;
  const ship = parseFloat(shipping) || 0;
  const { platformFee, netProfit, roi, breakEven, buyerPays } = calc(buy, sell, ship, platform);

  const hasValues = sell > 0;
  const isProfit = netProfit > 0;
  const isBreakeven = netProfit === 0;
  const roiColor = roi >= 30 ? "text-green-600" : roi >= 0 ? "text-yellow-600" : "text-red-600";
  const profitBg = isProfit ? "bg-[#4ade80]/15 border-[#4ade80]" : roi === 0 ? "bg-secondary border-black/20" : "bg-red-50 border-red-400 dark:bg-red-950/20";

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="container px-6 py-10 pt-24 md:pt-32 pb-32 md:pb-10 max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center bg-accent rounded-xl text-black border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <Calculator size={20} />
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none">
              Flip Calc
            </h1>
          </div>
          <p className="text-muted-foreground font-medium text-lg">
            Quanto guadagni davvero dopo le commissioni?
          </p>
        </div>

        {/* Platform selector */}
        <div className="space-y-2 mb-6">
          <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Piattaforma di vendita</p>
          <div className="flex gap-2 flex-wrap">
            {(Object.keys(PLATFORMS) as Platform[]).map((p) => (
              <button
                key={p}
                onClick={() => setPlatform(p)}
                className={cn(
                  "px-5 py-2.5 rounded-full border-2 font-black text-sm uppercase tracking-wide transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
                  platform === p
                    ? "bg-black text-white border-black translate-y-0.5 shadow-none"
                    : "bg-card border-black hover:bg-accent hover:-translate-y-0.5"
                )}
              >
                {p}
              </button>
            ))}
          </div>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <Info className="h-3.5 w-3.5 shrink-0" />
            {PLATFORMS[platform].note}
          </p>
        </div>

        {/* Inputs */}
        <div className="bg-card border-4 border-black rounded-[32px] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 md:p-8 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <PriceInput label="Comprato a" value={buyPrice} onChange={setBuyPrice} placeholder="Es. 15.00" />
            <PriceInput label="Vendo a" value={sellPrice} onChange={setSellPrice} placeholder="Es. 45.00" />
          </div>
          <PriceInput label="Spedizione (opzionale)" value={shipping} onChange={setShipping} placeholder="Es. 5.00" />
        </div>

        {/* Results */}
        <div className={cn("mt-6 border-4 rounded-[32px] p-6 md:p-8 space-y-6 transition-all", profitBg)}>
          {/* Big profit display */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-1">Profitto netto</p>
              <p className={cn(
                "font-display text-6xl font-black tabular-nums tracking-tighter leading-none",
                hasValues ? (isProfit ? "text-green-700" : "text-red-600") : "text-muted-foreground/40"
              )}>
                {hasValues ? `${netProfit >= 0 ? "+" : ""}€${fmt(netProfit)}` : "—"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-1">ROI</p>
              <div className="flex items-center gap-1 justify-end">
                {hasValues && (
                  isProfit
                    ? <TrendingUp className="h-5 w-5 text-green-600" />
                    : isBreakeven
                      ? <Minus className="h-5 w-5 text-muted-foreground" />
                      : <TrendingDown className="h-5 w-5 text-red-500" />
                )}
                <p className={cn("text-4xl font-black tabular-nums leading-none", hasValues ? roiColor : "text-muted-foreground/40")}>
                  {hasValues ? `${roi >= 0 ? "+" : ""}${roi.toFixed(1)}%` : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Detail grid */}
          <div className="grid grid-cols-2 gap-3">
            <DetailRow label="Prezzo vendita" value={hasValues ? `€${fmt(sell)}` : "—"} />
            <DetailRow label="Prezzo acquisto" value={buy > 0 ? `-€${fmt(buy)}` : "—"} negative={buy > 0} />
            <DetailRow
              label={`Comm. ${platform}`}
              value={hasValues && platformFee > 0 ? `-€${fmt(platformFee)}` : hasValues ? "€0.00" : "—"}
              negative={hasValues && platformFee > 0}
            />
            <DetailRow label="Spedizione" value={ship > 0 ? `-€${fmt(ship)}` : "€0.00"} negative={ship > 0} />
          </div>

          {/* Break-even */}
          {buy > 0 && (
            <div className="bg-card/60 border-2 border-black/10 rounded-2xl px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Prezzo minimo per non rimetterci</p>
                <p className="font-black text-2xl mt-0.5">€{fmt(breakEven)}</p>
              </div>
              {sell > 0 && sell < breakEven && (
                <span className="bg-red-500 text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-full border-2 border-red-600">
                  Sotto il break-even
                </span>
              )}
              {sell > 0 && sell >= breakEven && (
                <span className="bg-[#4ade80] text-black text-[10px] font-black uppercase px-3 py-1.5 rounded-full border-2 border-green-600">
                  In profitto ✓
                </span>
              )}
            </div>
          )}

          {/* Vinted buyer info */}
          {platform === "Vinted" && buyerPays !== null && sell > 0 && (
            <div className="flex items-start gap-2 text-xs text-muted-foreground font-medium bg-card/40 rounded-2xl px-4 py-3 border border-black/10">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <p>L'acquirente pagherà <strong className="text-foreground">€{fmt(buyerPays)}</strong> (commissione acquirente inclusa). Tu ricevi €{fmt(sell)}.</p>
            </div>
          )}

          {/* Share */}
          {hasValues && buy > 0 && (
            <ShareModal
              trigger={
                <Button variant="outline" className="w-full h-11 rounded-2xl border-2 border-black font-black uppercase text-xs tracking-wider hover:bg-accent hover:border-accent transition-all">
                  <Share2 className="mr-2 h-4 w-4" /> Condividi calcolo
                </Button>
              }
              filename="revinted-flip"
            >
              {(ref) => (
                <CalcShareCard
                  ref={ref}
                  buy={buy} sell={sell} ship={ship}
                  netProfit={netProfit} roi={roi} platformFee={platformFee}
                  platform={platform}
                />
              )}
            </ShareModal>
          )}
        </div>
      </main>
    </div>
  );
}

function DetailRow({ label, value, negative }: { label: string; value: string; negative?: boolean }) {
  return (
    <div className="bg-card/70 border-2 border-black/10 rounded-2xl p-4">
      <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-1">{label}</p>
      <p className={cn("font-black text-lg leading-none", negative && "text-red-600")}>{value}</p>
    </div>
  );
}

// ── Calc Share Card ────────────────────────────────────────────────────────
interface CalcShareCardProps {
  buy: number; sell: number; ship: number;
  netProfit: number; roi: number; platformFee: number;
  platform: Platform;
}

const CalcShareCard = React.forwardRef<HTMLDivElement, CalcShareCardProps>(
  ({ buy, sell, ship, netProfit, roi, platformFee, platform }, ref) => {
    const isPos = netProfit >= 0;
    const bg = isPos ? "#dcfce7" : "#fee2e2";
    const accent = isPos ? "#4ade80" : "#f87171";
    const profitColor = isPos ? "#15803d" : "#dc2626";
    return (
      <div ref={ref} style={{ background: bg, borderTop: `6px solid ${accent}`, fontFamily: "'Space Grotesk','Arial Black',sans-serif", padding: "28px 32px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ background: "#000", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#FFE01E", fontSize: 14 }}>✦</span>
            </div>
            <span style={{ fontWeight: 900, fontSize: 13, letterSpacing: "0.15em", textTransform: "uppercase" }}>ReVinted · Flip Calc</span>
          </div>
          <div style={{ background: isPos ? "#4ade80" : "#f87171", color: "#000", fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", padding: "5px 14px", borderRadius: 999 }}>
            {platform}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <div style={{ background: "rgba(255,255,255,0.7)", borderRadius: 12, padding: "12px 18px", textAlign: "center" }}>
            <div style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "#9ca3af" }}>Comprato</div>
            <div style={{ fontSize: 26, fontWeight: 900 }}>€{fmt(buy)}</div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#9ca3af" }}>→</div>
          <div style={{ background: "rgba(255,255,255,0.7)", borderRadius: 12, padding: "12px 18px", textAlign: "center" }}>
            <div style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "#9ca3af" }}>Venduto</div>
            <div style={{ fontSize: 26, fontWeight: 900 }}>€{fmt(sell)}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 2, background: "rgba(255,255,255,0.8)", borderRadius: 12, padding: "12px 16px" }}>
            <div style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "#9ca3af", marginBottom: 4 }}>Profitto netto</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: profitColor, lineHeight: 1 }}>{netProfit >= 0 ? "+" : ""}€{fmt(netProfit)}</div>
          </div>
          <div style={{ flex: 1, background: "rgba(255,255,255,0.8)", borderRadius: 12, padding: "12px 16px" }}>
            <div style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "#9ca3af", marginBottom: 4 }}>ROI</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: profitColor, lineHeight: 1 }}>{roi >= 0 ? "+" : ""}{roi.toFixed(0)}%</div>
          </div>
        </div>
        {(ship > 0 || platformFee > 0) && (
          <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, marginBottom: 16 }}>
            Comm. {platform}: €{fmt(platformFee)}{ship > 0 ? ` · Spedizione: €${fmt(ship)}` : ""}
          </div>
        )}
        <div style={{ borderTop: "1.5px solid rgba(0,0,0,0.1)", paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.12em", color: "#9ca3af" }}>revinted.app</span>
          <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600 }}>Calcola il tuo prossimo flip</span>
        </div>
      </div>
    );
  }
);
CalcShareCard.displayName = "CalcShareCard";
