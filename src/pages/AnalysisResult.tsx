import { useEffect, useMemo, useState } from "react";
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
import { ArrowLeft, Copy, Sparkles, TrendingUp, TrendingDown, Minus, Tag, Loader2 } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  callGenerateListing,
  fetchAnalysisById,
  updateAnalysisListing,
} from "@/services/analysis";
import type { AnalysisRow, VintedListing } from "@/types/analysis";

const AnalysisResult = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [row, setRow] = useState<AnalysisRow | null | undefined>(undefined);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchAnalysisById(id)
      .then(setRow)
      .catch((err) => {
        toast({
          title: "Errore",
          description: err instanceof Error ? err.message : "Errore",
          variant: "destructive",
        });
        setRow(null);
      });
  }, [id, toast]);

  const handleGenerateListing = async () => {
    if (!row?.ai_result || !row.id) return;
    setGenerating(true);
    try {
      const listing = await callGenerateListing(row.ai_result);
      await updateAnalysisListing(row.id, listing);
      setRow({ ...row, vinted_listing: listing });
      toast({ title: "Annuncio pronto", description: "Copialo e pubblicalo su Vinted." });
    } catch (err) {
      toast({
        title: "Generazione fallita",
        description: err instanceof Error ? err.message : "Errore",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  if (row === undefined) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container max-w-5xl py-10 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-80" />
          <Skeleton className="h-60" />
        </main>
      </div>
    );
  }

  if (row === null || !row.ai_result) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container max-w-3xl py-20 text-center">
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

      <main className="container max-w-5xl py-10">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Torna allo storico
        </Link>

        {/* Header */}
        <div className="mt-4 grid gap-6 md:grid-cols-[1fr_360px]">
          <div>
            <span className="pill bg-primary-soft text-secondary-foreground">{ai.identification.category}</span>
            <h1 className="mt-3 font-display text-3xl font-bold md:text-4xl">{ai.identification.name}</h1>
            <p className="mt-2 text-muted-foreground">
              {[ai.identification.brand, ai.identification.artist, ai.identification.era]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="pill bg-muted text-foreground">Età: {ai.identification.estimatedAge}</span>
              <span className="pill bg-muted text-foreground">Condizione: {ai.identification.condition}</span>
              <span className="pill bg-accent text-accent-foreground">
                Confidenza {Math.round(ai.identification.confidence * 100)}%
              </span>
            </div>
          </div>

          <PhotoStrip photos={row.photos} />
        </div>

        {/* Story */}
        <div className="card-soft mt-8">
          <h2 className="font-display text-xl font-bold">La storia</h2>
          <p className="mt-3 leading-relaxed text-foreground/90">{ai.story}</p>
        </div>

        {/* Estimates */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <CurrentEstimateCard ai={ai} />
          <FutureEstimateCard ai={ai} />
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
                disabled={generating}
                size="lg"
                className="mt-6 rounded-full shadow-pop"
              >
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {generating ? "Sto scrivendo…" : "Genera annuncio"}
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
  <div className="grid grid-cols-2 gap-2">
    {photos.slice(0, 4).map((p, i) => (
      <div key={i} className="aspect-square overflow-hidden rounded-2xl border border-border">
        <img src={p} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" loading="lazy" />
      </div>
    ))}
  </div>
);

const CurrentEstimateCard = ({ ai }: { ai: NonNullable<AnalysisRow["ai_result"]> }) => (
  <div className="card-soft">
    <div className="flex items-center justify-between">
      <h2 className="font-display text-xl font-bold">Stima oggi</h2>
      <span className="pill bg-primary-soft text-secondary-foreground">EUR</span>
    </div>
    <p className="mt-4 font-display text-4xl font-bold text-primary">
      € {ai.currentEstimate.min} – {ai.currentEstimate.max}
    </p>
    <p className="mt-3 text-sm text-muted-foreground">{ai.currentEstimate.reasoning}</p>
  </div>
);

const FutureEstimateCard = ({ ai }: { ai: NonNullable<AnalysisRow["ai_result"]> }) => {
  const trendIcon = {
    "in forte crescita": <TrendingUp className="h-4 w-4 text-primary" />,
    "in crescita": <TrendingUp className="h-4 w-4 text-primary" />,
    stabile: <Minus className="h-4 w-4 text-muted-foreground" />,
    "in calo": <TrendingDown className="h-4 w-4 text-destructive" />,
  }[ai.futureEstimate.trend];

  return (
    <div className="card-soft">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold">Proiezione futura</h2>
        <span className="pill bg-accent text-accent-foreground">
          {trendIcon}
          {ai.futureEstimate.trend}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <FutureCell label="1 anno" value={ai.futureEstimate.year1} />
        <FutureCell label="3 anni" value={ai.futureEstimate.year3} />
        <FutureCell label="5 anni" value={ai.futureEstimate.year5} highlight />
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{ai.futureEstimate.note}</p>
    </div>
  );
};

const FutureCell = ({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) => (
  <div className={`rounded-2xl p-3 ${highlight ? "bg-primary-soft" : "bg-muted"}`}>
    <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className="mt-1 font-display text-xl font-bold">€ {value}</p>
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

export default AnalysisResult;
