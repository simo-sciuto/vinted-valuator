import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowLeft, TrendingUp, Wallet, CheckCircle2 } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { fetchUserAnalyses } from "@/services/analysis";
import { Skeleton } from "@/components/ui/skeleton";

const Sales = () => {
  const { data: analyses, isLoading } = useQuery({
    queryKey: ["analyses"],
    queryFn: fetchUserAnalyses,
  });

  const soldItems = analyses?.filter((a) => a.status === "sold") || [];
  
  const totalRevenue = soldItems.reduce((acc, curr) => acc + (curr.ai_result?.profit?.soldPrice || 0), 0);
  const totalCost = soldItems.reduce((acc, curr) => acc + (curr.purchase_price || 0), 0);
  const totalProfit = totalRevenue - totalCost;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container max-w-5xl py-10 pt-32">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-bold uppercase tracking-wider text-muted-foreground hover:text-black transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" />
          Torna alla dashboard
        </Link>
        
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-4xl font-black uppercase tracking-tighter">Le Tue Vendite</h1>
        </div>

        {/* Recap Cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-10">
          <div className="card-soft bg-accent text-black">
            <h2 className="text-sm font-bold uppercase tracking-wider text-black/70">Incasso Totale</h2>
            <p className="mt-2 font-display text-4xl font-black">€ {totalRevenue.toFixed(2)}</p>
          </div>
          <div className="card-soft bg-white text-black">
            <h2 className="text-sm font-bold uppercase tracking-wider text-black/50">Costi (Acquisto)</h2>
            <p className="mt-2 font-display text-4xl font-black text-muted-foreground">€ {totalCost.toFixed(2)}</p>
          </div>
          <div className={`card-soft ${totalProfit >= 0 ? "bg-[#4ade80]" : "bg-[#f87171]"} text-black`}>
            <h2 className="text-sm font-bold uppercase tracking-wider text-black/70">Utile Netto</h2>
            <p className="mt-2 font-display text-4xl font-black">{totalProfit >= 0 ? "+" : ""}€ {totalProfit.toFixed(2)}</p>
          </div>
        </div>

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
