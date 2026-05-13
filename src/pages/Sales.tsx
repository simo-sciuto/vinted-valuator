import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Wallet, TrendingUp, CheckCircle2, Trophy, Package, Clock } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { fetchUserAnalyses } from "@/services/analysis";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const COLORS = ["#FFDE1E", "#4ade80", "#f87171", "#3b82f6", "#a855f7", "#fb923c"];

const Sales = () => {
  const { data: analyses, isLoading } = useQuery({
    queryKey: ["analyses"],
    queryFn: fetchUserAnalyses,
  });

  const soldItems = analyses?.filter((a) => a.status === "sold") || [];
  const activeItems = analyses?.filter(
    (a) => a.status !== "sold" && a.purchase_price != null && a.purchase_price > 0,
  ) || [];

  const totalRevenue = soldItems.reduce((acc, curr) => acc + (curr.ai_result?.profit?.soldPrice || 0), 0);
  const totalCost = soldItems.reduce((acc, curr) => acc + (curr.purchase_price || 0), 0);
  const totalProfit = totalRevenue - totalCost;
  const avgROI = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

  const winRate = soldItems.length > 0
    ? Math.round((soldItems.filter((a) => (a.ai_result?.profit?.actualProfit ?? 0) > 0).length / soldItems.length) * 100)
    : null;

  const avgHoldingDays = useMemo(() => {
    const times = soldItems
      .map((a) => {
        const created = new Date(a.created_at).getTime();
        const updated = new Date(a.updated_at).getTime();
        return (updated - created) / (1000 * 60 * 60 * 24);
      })
      .filter((d) => d >= 0);
    return times.length > 0 ? Math.round(times.reduce((s, d) => s + d, 0) / times.length) : null;
  }, [soldItems]);

  const portfolioValue = activeItems.reduce(
    (acc, a) => acc + ((a.ai_result?.currentEstimate.max ?? 0) + (a.ai_result?.currentEstimate.min ?? 0)) / 2,
    0,
  );
  const capitalAtRisk = activeItems.reduce((acc, a) => acc + (a.purchase_price ?? 0), 0);
  const potentialProfit = portfolioValue - capitalAtRisk;

  const bestFlip = useMemo(() => {
    if (!soldItems.length) return null;
    return soldItems.reduce((best, item) => {
      const profit = item.ai_result?.profit?.actualProfit ?? 0;
      const bestProfit = best?.ai_result?.profit?.actualProfit ?? 0;
      return profit > bestProfit ? item : best;
    });
  }, [soldItems]);

  const monthlyData = useMemo(() => {
    const months: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleString("it-IT", { month: "short" });
      months[key] = 0;
    }
    soldItems.forEach((item) => {
      const date = new Date(item.updated_at);
      const key = date.toLocaleString("it-IT", { month: "short" });
      if (months[key] !== undefined) {
        months[key] += item.ai_result?.profit?.actualProfit || 0;
      }
    });
    return Object.entries(months).map(([name, profit]) => ({ name, profit: Math.round(profit) }));
  }, [soldItems]);

  const categoryROI = useMemo(() => {
    const cats: Record<string, { profit: number; cost: number; count: number }> = {};
    soldItems.forEach((item) => {
      const cat = item.ai_result?.identification.category || "altro";
      const label = cat.charAt(0).toUpperCase() + cat.slice(1);
      const cost = item.purchase_price || 0;
      const profit = item.ai_result?.profit?.actualProfit || 0;
      if (!cats[label]) cats[label] = { profit: 0, cost: 0, count: 0 };
      cats[label].profit += profit;
      cats[label].cost += cost;
      cats[label].count++;
    });
    return Object.entries(cats)
      .map(([name, { profit, cost, count }]) => ({
        name,
        roi: cost > 0 ? Math.round((profit / cost) * 100) : 0,
        profit: Math.round(profit),
        count,
      }))
      .sort((a, b) => b.roi - a.roi);
  }, [soldItems]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container max-w-5xl px-6 py-10 pt-24 md:pt-32 pb-32 md:pb-10">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-bold uppercase tracking-wider text-muted-foreground hover:text-black transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Torna alla dashboard
        </Link>

        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-4xl font-black uppercase tracking-tighter leading-none">
            Le Tue Vendite
          </h1>
          {soldItems.length > 0 && (
            <span className="pill bg-accent text-black border-2 border-black font-black text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              {soldItems.length} vendite
            </span>
          )}
        </div>

        {/* Stat cards */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6 mb-4">
          <div className="card-soft bg-accent border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-black/50">Incasso</h2>
            <p className="mt-1 font-display text-2xl font-black">€{totalRevenue.toFixed(0)}</p>
          </div>
          <div className="card-soft bg-card border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Investito</h2>
            <p className="mt-1 font-display text-2xl font-black">€{totalCost.toFixed(0)}</p>
          </div>
          <div className={cn("card-soft border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4", totalProfit >= 0 ? "bg-[#4ade80]" : "bg-[#f87171]")}>
            <h2 className="text-[10px] font-black uppercase tracking-widest text-black/50">Utile Netto</h2>
            <p className="mt-1 font-display text-2xl font-black text-black">
              {totalProfit >= 0 ? "+" : ""}€{totalProfit.toFixed(0)}
            </p>
          </div>
          <div className="card-soft bg-black text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:bg-accent dark:text-black p-4">
            <h2 className="text-[10px] font-black uppercase tracking-widest opacity-50">ROI Medio</h2>
            <p className="mt-1 font-display text-2xl font-black">{avgROI.toFixed(1)}%</p>
          </div>
          <div className="card-soft bg-card border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Win Rate</h2>
            <p className="mt-1 font-display text-2xl font-black">
              {winRate !== null ? `${winRate}%` : "—"}
            </p>
          </div>
          <div className="card-soft bg-card border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tempo Medio</h2>
            <p className="mt-1 font-display text-2xl font-black">
              {avgHoldingDays !== null ? `${avgHoldingDays}g` : "—"}
            </p>
          </div>
        </div>

        {/* Active portfolio */}
        {activeItems.length > 0 && (
          <div className="mb-6 rounded-[28px] border-2 border-black bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b-2 border-black/10 bg-secondary">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5" />
                <h3 className="font-display text-lg font-black uppercase">Portafoglio Attivo</h3>
                <span className="pill bg-accent text-black border-2 border-black text-[10px] font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  {activeItems.length} oggetti
                </span>
              </div>
              <div className="flex items-center gap-6 text-right">
                <div>
                  <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Capitale investito</p>
                  <p className="font-display text-lg font-black">€{capitalAtRisk.toFixed(0)}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Valore stimato</p>
                  <p className="font-display text-lg font-black">€{portfolioValue.toFixed(0)}</p>
                </div>
                <div className={cn("text-right", potentialProfit >= 0 ? "text-green-600" : "text-red-600")}>
                  <p className="text-[9px] font-black uppercase tracking-widest">Profitto potenziale</p>
                  <p className="font-display text-lg font-black">
                    {potentialProfit >= 0 ? "+" : ""}€{potentialProfit.toFixed(0)}
                  </p>
                </div>
              </div>
            </div>
            <div className="divide-y divide-black/5">
              {activeItems.slice(0, 5).map((item) => {
                const ai = item.ai_result;
                const estAvg = ai ? Math.round((ai.currentEstimate.min + ai.currentEstimate.max) / 2) : 0;
                const margin = estAvg - (item.purchase_price ?? 0);
                const daysHeld = Math.round(
                  (Date.now() - new Date(item.created_at).getTime()) / (1000 * 60 * 60 * 24),
                );
                return (
                  <Link
                    key={item.id}
                    to={`/analysis/${item.id}`}
                    className="flex items-center gap-4 px-6 py-3 hover:bg-secondary/50 transition-colors group"
                  >
                    <div className="h-12 w-12 shrink-0 rounded-xl overflow-hidden border-2 border-black bg-muted">
                      {item.photos[0]
                        ? <img src={item.photos[0]} alt="" className="h-full w-full object-cover" />
                        : <div className="h-full w-full flex items-center justify-center"><Package className="h-5 w-5 text-muted-foreground/40" /></div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black uppercase text-muted-foreground">{ai?.identification.brand || "—"}</p>
                      <p className="font-bold text-sm leading-tight truncate group-hover:text-primary transition-colors">
                        {ai?.identification.name || "Oggetto analizzato"}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 text-right">
                      <div>
                        <p className="text-[9px] font-black uppercase text-muted-foreground">Pagato</p>
                        <p className="font-black text-sm">€{item.purchase_price}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase text-muted-foreground">Stima</p>
                        <p className="font-black text-sm">€{estAvg}</p>
                      </div>
                      <div className={cn("min-w-[56px]", margin >= 0 ? "text-green-600" : "text-red-600")}>
                        <p className="text-[9px] font-black uppercase">Margine</p>
                        <p className="font-black text-sm">{margin >= 0 ? "+" : ""}€{margin}</p>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <p className="text-[10px] font-bold">{daysHeld}g</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
              {activeItems.length > 5 && (
                <p className="px-6 py-3 text-xs font-bold text-muted-foreground">
                  + altri {activeItems.length - 5} oggetti nel portafoglio
                </p>
              )}
            </div>
          </div>
        )}

        {/* Best flip banner */}
        {bestFlip && (bestFlip.ai_result?.profit?.actualProfit ?? 0) > 0 && (
          <div className="mb-6 flex items-center gap-4 rounded-2xl border-2 border-black bg-accent px-5 py-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Trophy className="h-6 w-6 shrink-0 text-black" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-black/50">Miglior Flip</p>
              <p className="font-display text-lg font-black uppercase leading-none truncate">
                {bestFlip.ai_result?.identification.name ?? "Oggetto"}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-display text-2xl font-black text-black">
                +€{(bestFlip.ai_result?.profit?.actualProfit ?? 0).toFixed(0)}
              </p>
              {bestFlip.purchase_price && bestFlip.purchase_price > 0 && (
                <p className="text-[10px] font-black text-black/60">
                  {Math.round(((bestFlip.ai_result?.profit?.actualProfit ?? 0) / bestFlip.purchase_price) * 100)}% ROI
                </p>
              )}
            </div>
          </div>
        )}

        {/* Charts */}
        {soldItems.length > 0 && (
          <>
            <div className="grid gap-6 md:grid-cols-2 mb-6">
              {/* Monthly trend */}
              <div className="card-soft border-2 border-black bg-card">
                <h3 className="font-display text-lg font-black uppercase mb-6 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Profitto Mensile
                </h3>
                <div className="h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" strokeOpacity={0.1} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={11} fontWeight="bold" />
                      <YAxis axisLine={false} tickLine={false} fontSize={11} tickFormatter={(v) => `€${v}`} />
                      <Tooltip
                        cursor={{ fill: "rgba(0,0,0,0.05)" }}
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          borderRadius: "12px",
                          border: "2px solid hsl(var(--border))",
                          fontWeight: "bold",
                          color: "hsl(var(--foreground))",
                        }}
                        formatter={(v: number) => [`€${v}`, "Profitto"]}
                      />
                      <Bar dataKey="profit" radius={[6, 6, 0, 0]} stroke="currentColor" strokeWidth={2}>
                        {monthlyData.map((entry, i) => (
                          <Cell key={i} fill={entry.profit >= 0 ? "hsl(var(--accent))" : "#f87171"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ROI per category */}
              <div className="card-soft border-2 border-black bg-card">
                <h3 className="font-display text-lg font-black uppercase mb-6">ROI per Categoria</h3>
                {categoryROI.length > 0 ? (
                  <div className="h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryROI} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="currentColor" strokeOpacity={0.1} />
                        <XAxis type="number" axisLine={false} tickLine={false} fontSize={11} tickFormatter={(v) => `${v}%`} />
                        <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} fontSize={11} fontWeight="bold" width={70} />
                        <Tooltip
                          cursor={{ fill: "rgba(0,0,0,0.05)" }}
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            borderRadius: "12px",
                            border: "2px solid hsl(var(--border))",
                            fontWeight: "bold",
                            color: "hsl(var(--foreground))",
                          }}
                          formatter={(v: number, name: string) => [
                            name === "roi" ? `${v}%` : `€${v}`,
                            name === "roi" ? "ROI" : "Profitto",
                          ]}
                        />
                        <Bar dataKey="roi" radius={[0, 6, 6, 0]} stroke="currentColor" strokeWidth={2}>
                          {categoryROI.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground font-medium">Nessun dato per categoria.</p>
                )}
              </div>
            </div>

            {/* Progress goal */}
            <div className="card-soft border-2 border-black bg-card mb-10">
              <h3 className="font-display text-lg font-black uppercase mb-4">Prossimo Obiettivo</h3>
              {(() => {
                const goal = totalProfit < 100 ? 100 : totalProfit < 500 ? 500 : totalProfit < 1000 ? 1000 : 5000;
                const progress = Math.min(100, (totalProfit / goal) * 100);
                const level = totalProfit < 100 ? "Novizio" : totalProfit < 500 ? "Flipper" : "Elite Reseller";
                return (
                  <div className="flex flex-col md:flex-row md:items-center gap-6">
                    <div className="shrink-0">
                      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Livello</p>
                      <p className="font-display text-xl font-black bg-accent text-black px-3 py-1 rounded-xl inline-block mt-1">
                        {level}
                      </p>
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between text-xs font-black uppercase text-muted-foreground">
                        <span>€0</span>
                        <span>Target: €{goal}</span>
                      </div>
                      <div className="h-5 w-full bg-secondary border-2 border-black rounded-full overflow-hidden relative">
                        <div
                          className="h-full bg-[#4ade80] border-r-2 border-black transition-all duration-1000"
                          style={{ width: `${progress}%` }}
                        />
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black uppercase text-black">
                          {progress.toFixed(0)}%
                        </span>
                      </div>
                      <p className="text-[10px] font-bold text-muted-foreground text-right">
                        {progress < 100
                          ? `Mancano €${(goal - totalProfit).toFixed(0)} al prossimo livello`
                          : "Obiettivo raggiunto!"}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
          </>
        )}

        {/* Sold items list */}
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-64 w-full rounded-3xl" />)}
          </div>
        ) : soldItems.length === 0 ? (
          <div className="card-soft bg-muted text-center py-20">
            <Wallet className="mx-auto h-12 w-12 text-muted-foreground" />
            <h2 className="mt-4 font-display text-2xl font-bold uppercase">Nessuna vendita</h2>
            <p className="mt-2 text-muted-foreground font-medium">
              Non hai ancora segnato nessun oggetto come venduto. Vai in un'analisi e clicca su "Segna come venduto".
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {soldItems.map((item) => {
              const ai = item.ai_result;
              const soldPrice = ai?.profit?.soldPrice || 0;
              const cost = item.purchase_price || 0;
              const actualProfit = soldPrice - cost;
              const isPositive = actualProfit >= 0;
              const roi = cost > 0 ? Math.round((actualProfit / cost) * 100) : null;

              return (
                <Link key={item.id} to={`/analysis/${item.id}`} className="group block">
                  <div className="card-soft h-full p-4 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all bg-white relative overflow-hidden">
                    <div className="absolute top-4 left-4 z-10">
                      <span className="pill bg-[#4ade80] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs py-1 px-2">
                        <CheckCircle2 className="h-3 w-3 inline-block mr-1" />
                        Venduto
                      </span>
                    </div>
                    <div className="aspect-square w-full overflow-hidden rounded-[20px] border-2 border-black bg-muted">
                      {item.photos[0] ? (
                        <img
                          src={item.photos[0]}
                          alt="Thumbnail"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="grid h-full place-items-center text-muted-foreground font-medium">
                          Nessuna foto
                        </div>
                      )}
                    </div>
                    <div className="mt-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {ai?.identification?.brand || "Unbranded"}
                      </p>
                      <h3 className="mt-1 font-display text-xl font-bold uppercase leading-tight line-clamp-1">
                        {ai?.identification?.name || "Oggetto analizzato"}
                      </h3>
                      <div className="mt-4 flex items-center justify-between border-t-2 border-black/10 pt-4">
                        <div>
                          <p className="text-xs font-bold text-muted-foreground uppercase">Incasso</p>
                          <p className="font-display text-xl font-black">€{soldPrice}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-muted-foreground uppercase">Utile</p>
                          <p className={`font-display text-xl font-black ${isPositive ? "text-green-600" : "text-red-600"}`}>
                            {isPositive ? "+" : ""}€{actualProfit.toFixed(0)}
                          </p>
                          {roi !== null && (
                            <p className={`text-[10px] font-black ${isPositive ? "text-green-500" : "text-red-500"}`}>
                              {roi}% ROI
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Sales;
