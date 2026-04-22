import { 
  Bar, 
  BarChart, 
  Cell, 
  Pie, 
  PieChart, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis,
  CartesianGrid
} from "recharts";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Wallet, TrendingUp, CheckCircle2 } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { fetchUserAnalyses } from "@/services/analysis";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

const Sales = () => {
  const { data: analyses, isLoading } = useQuery({
    queryKey: ["analyses"],
    queryFn: fetchUserAnalyses,
  });

  const soldItems = analyses?.filter((a) => a.status === "sold") || [];
  
  const totalRevenue = soldItems.reduce((acc, curr) => acc + (curr.ai_result?.profit?.soldPrice || 0), 0);
  const totalCost = soldItems.reduce((acc, curr) => acc + (curr.purchase_price || 0), 0);
  const totalProfit = totalRevenue - totalCost;
  const avgROI = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

  const categoryData = useMemo(() => {
    const totals: Record<string, number> = {};
    soldItems.forEach(item => {
      const cat = item.ai_result?.identification.category || "Altro";
      totals[cat] = (totals[cat] || 0) + (item.ai_result?.profit?.soldPrice || 0);
    });
    return Object.entries(totals)
      .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))
      .sort((a, b) => b.value - a.value);
  }, [soldItems]);

  const monthlyData = useMemo(() => {
    const months: Record<string, number> = {};
    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleString('it-IT', { month: 'short' });
      months[key] = 0;
    }
    
    soldItems.forEach(item => {
      const date = new Date(item.created_at);
      const key = date.toLocaleString('it-IT', { month: 'short' });
      if (months[key] !== undefined) {
        months[key] += item.ai_result?.profit?.actualProfit || 0;
      }
    });
    return Object.entries(months).map(([name, profit]) => ({ name, profit }));
  }, [soldItems]);

  const COLORS = ["#FFDE1E", "#4ade80", "#f87171", "#3b82f6", "#a855f7"];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container max-w-5xl px-6 py-10 pt-24 md:pt-32 pb-32 md:pb-10">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-bold uppercase tracking-wider text-muted-foreground hover:text-black transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" />
          Torna alla dashboard
        </Link>
        
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-4xl font-black uppercase tracking-tighter leading-none">Le Tue Vendite</h1>
        </div>

        {/* Recap Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-10">
          <div className="card-soft bg-accent border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 md:p-6">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-accent-foreground/50">Incasso Totale</h2>
            <p className="mt-1 font-display text-2xl md:text-3xl font-black text-accent-foreground">€ {totalRevenue.toFixed(0)}</p>
          </div>
          <div className="card-soft bg-card border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 md:p-6">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Investimento</h2>
            <p className="mt-1 font-display text-2xl md:text-3xl font-black">€ {totalCost.toFixed(0)}</p>
          </div>
          <div className={`card-soft ${totalProfit >= 0 ? "bg-[#4ade80]" : "bg-[#f87171]"} border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 md:p-6`}>
            <h2 className="text-[10px] font-black uppercase tracking-widest text-black/50">Utile Netto</h2>
            <p className="mt-1 font-display text-2xl md:text-3xl font-black text-black">{totalProfit >= 0 ? "+" : ""}€ {totalProfit.toFixed(0)}</p>
          </div>
          <div className="card-soft bg-black text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:bg-accent dark:text-black p-4 md:p-6">
            <h2 className="text-[10px] font-black uppercase tracking-widest opacity-50">ROI Medio</h2>
            <p className="mt-1 font-display text-2xl md:text-3xl font-black">{avgROI.toFixed(1)}%</p>
          </div>
        </div>

        {/* Advanced Stats */}
        {soldItems.length > 0 && (
          <>
            <div className="grid gap-6 md:grid-cols-2 mb-6">
              {/* Trend Profitto */}
              <div className="card-soft border-2 border-black bg-card">
                <h3 className="font-display text-lg font-black uppercase mb-6 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Trend Profitto (Mensile)
                </h3>
                <div className="h-[240px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" strokeOpacity={0.1} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} font-weight="bold" />
                      <YAxis axisLine={false} tickLine={false} fontSize={12} tickFormatter={(v) => `€${v}`} />
                      <Tooltip 
                        cursor={{fill: 'rgba(0,0,0,0.05)'}}
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: '2px solid hsl(var(--border))', fontWeight: 'bold', color: 'hsl(var(--foreground))' }}
                      />
                      <Bar dataKey="profit" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} stroke="currentColor" strokeWidth={2} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Prossimo Obiettivo */}
              <div className="card-soft border-2 border-black bg-card flex flex-col">
                <h3 className="font-display text-lg font-black uppercase mb-4">Prossimo Obiettivo</h3>
                <div className="flex-1 flex flex-col justify-center">
                   {(() => {
                     const goal = totalProfit < 100 ? 100 : totalProfit < 500 ? 500 : totalProfit < 1000 ? 1000 : 5000;
                     const progress = Math.min(100, (totalProfit / goal) * 100);
                     return (
                       <div className="space-y-6">
                          <div className="flex items-end justify-between">
                            <div>
                              <p className="text-xs font-black uppercase text-muted-foreground tracking-widest">Target Profitto</p>
                              <p className="font-display text-3xl font-black">€{goal}</p>
                            </div>
                            <div className="text-right">
                               <p className="text-xs font-black uppercase text-muted-foreground tracking-widest">Livello</p>
                               <p className="font-display text-xl font-black text-accent-foreground bg-accent px-3 py-1 rounded-lg">
                                 {totalProfit < 100 ? "Novizio" : totalProfit < 500 ? "Flipper" : "Elite Reseller"}
                               </p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                             <div className="h-6 w-full bg-secondary border-2 border-black rounded-full overflow-hidden relative dark:border-muted">
                                <div 
                                  className="h-full bg-[#4ade80] border-r-2 border-black transition-all duration-1000 ease-out dark:border-muted" 
                                  style={{ width: `${progress}%` }} 
                                />
                                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black uppercase text-black">
                                  {progress.toFixed(0)}% Completato
                                </span>
                             </div>
                             <p className="text-[10px] font-bold text-muted-foreground text-center italic">
                               {progress < 100 ? `Ti mancano €${(goal - totalProfit).toFixed(0)} per raggiungere il prossimo livello!` : "Obiettivo raggiunto! Sei una leggenda."}
                             </p>
                          </div>
                       </div>
                     );
                   })()}
                </div>
              </div>
            </div>

            {/* Volume per Categoria (Full Width) */}
            <div className="card-soft border-2 border-black bg-card mb-12">
              <h3 className="font-display text-lg font-black uppercase mb-6 text-center">Volume d'affari per Categoria</h3>
              <div className="h-[300px] w-full flex flex-col md:flex-row items-center justify-center gap-8">
                <div className="h-full w-full md:w-1/2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={110}
                        paddingAngle={8}
                        dataKey="value"
                        stroke="hsl(var(--border))"
                        strokeWidth={2}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: '2px solid hsl(var(--border))', fontWeight: 'bold', color: 'hsl(var(--foreground))' }}
                        formatter={(v) => `€${v}`}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                  {categoryData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-3">
                      <div className="h-4 w-4 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-none" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase text-muted-foreground leading-none">{entry.name}</span>
                        <span className="text-sm font-black">€{entry.value.toFixed(0)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* List of Sold Items */}
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 w-full rounded-3xl" />
            ))}
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
                        <div className="grid h-full place-items-center text-muted-foreground font-medium">Nessuna foto</div>
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
                            {isPositive ? "+" : ""}€{actualProfit.toFixed(2)}
                          </p>
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
