
import { useState, useEffect } from "react";
import { Zap, Search, ExternalLink, RefreshCw, TrendingUp, AlertCircle, User, Star, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchHotDeals, FlipDeal, getTrendingSearches } from "@/services/discovery";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const FlipDiscovery = ({ limit }: { limit?: number }) => {
  const [deals, setDeals] = useState<FlipDeal[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dynamicTrending, setDynamicTrending] = useState<string[]>(getTrendingSearches());

  const scanForDeals = async (isManual = true, tag?: string) => {
    if (loading) return;
    setLoading(true);
    
    if (isManual) {
      setScanning(true);
      const statuses = [
        "Inizializzazione motore di ricerca...",
        `Connessione ai marketplace (${tag || 'Global'})...`,
        "Scansione annunci in corso...",
        "Applicazione filtri di prezzo...",
        "Analisi reputazione venditori...",
        "Filtraggio per profitto massimo...",
        "Finalizzazione risultati..."
      ];
      
      let i = 0;
      const interval = setInterval(() => {
        setScanStatus(statuses[i]);
        i++;
        if (i >= statuses.length) clearInterval(interval);
      }, 300);
    }
    
    try {
      const results = await fetchHotDeals(tag);
      setDeals(limit ? results.slice(0, limit) : results);
      setSelectedTag(tag || null);
      
      if (tag) {
        setSearchQuery("");
        setDynamicTrending(prev => {
          const filtered = prev.filter(t => t.toLowerCase() !== tag.toLowerCase());
          return [tag, ...filtered].slice(0, 8);
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      if (isManual) {
        setTimeout(() => {
          setScanning(false);
          setScanStatus("");
        }, 500);
      }
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    scanForDeals(true, searchQuery.trim());
  };

  useEffect(() => {
    if (deals.length === 0) {
      scanForDeals(false);
    }
  }, []);

  return (
    <div className="w-full space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center bg-accent rounded-xl text-black border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <Zap size={20} className="fill-current" />
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-black uppercase tracking-tighter">Market Scout</h2>
          </div>
          <p className="text-muted-foreground font-medium text-base md:text-lg">Scoviamo gli "steal" più caldi in tempo reale.</p>
        </div>
        
        <Button 
          onClick={() => scanForDeals(true)} 
          disabled={loading}
          className="h-12 rounded-full bg-black text-white hover:bg-black/90 border-2 border-black shadow-pop dark:bg-accent dark:text-black px-8 font-black uppercase tracking-wide transition-all active:translate-y-1 active:shadow-none"
        >
          {loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Aggiorna Listino
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="space-y-6">
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-2xl">
          <input
            type="text"
            placeholder="Cerca (es. Gucci, Vinili...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-14 md:h-16 pl-12 md:pl-14 pr-28 md:pr-32 bg-card border-2 md:border-4 border-black rounded-2xl md:rounded-[24px] text-base md:text-lg font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] focus:shadow-none focus:translate-x-1 focus:translate-y-1 transition-all outline-none"
          />
          <Search className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          <Button 
            type="submit"
            className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 h-10 md:h-12 rounded-xl bg-accent text-black border-2 border-black font-black uppercase text-[10px] md:text-xs px-3 md:px-4"
          >
            Scout
          </Button>
        </form>

        <div className="flex items-center gap-4 py-4 overflow-x-auto no-scrollbar border-y-2 border-black/5">
          <span className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] whitespace-nowrap">
            {dynamicTrending.length > getTrendingSearches().length ? '🔍 Recenti:' : '🔥 Caldi:'}
          </span>
          <div className="flex gap-2">
            <button 
              onClick={() => {
                setSelectedTag(null);
                scanForDeals(true);
              }}
              className={`px-4 py-1.5 rounded-full border-2 border-black text-[11px] font-black uppercase whitespace-nowrap transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${!selectedTag ? 'bg-accent translate-y-0.5 shadow-none' : 'bg-card hover:bg-accent hover:-translate-y-0.5'}`}
            >
              Tutti
            </button>
            {dynamicTrending.map(t => (
              <button 
                key={t} 
                onClick={() => scanForDeals(true, t)}
                className={`px-4 py-1.5 rounded-full border-2 border-black text-[11px] font-black uppercase whitespace-nowrap transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${selectedTag === t ? 'bg-accent translate-y-0.5 shadow-none' : 'bg-card hover:bg-accent hover:-translate-y-0.5'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading && deals.length === 0 ? (
          <>
            {[1, 2, 3].map(i => (
              <div key={i} className="h-[340px] rounded-[32px] border-2 border-black bg-muted animate-pulse" />
            ))}
          </>
        ) : (
          deals.map(deal => (
            <Dialog key={deal.id}>
              <DialogTrigger asChild>
                <div className="card-soft bg-card border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 hover:shadow-[12px_12px_0px_0px_rgba(255,222,30,1)] transition-all group p-0 overflow-hidden flex flex-col h-full cursor-pointer">
                  <div className="relative aspect-video overflow-hidden border-b-2 border-black bg-muted">
                    <img 
                      src={deal.imageUrl} 
                      alt={deal.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                    />
                    <div className="absolute top-4 right-4">
                      <span className="bg-accent text-black border-2 border-black px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        {deal.platform}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="font-display font-black text-xl uppercase leading-none tracking-tight group-hover:text-accent transition-colors">
                      {deal.name}
                    </h3>
                    
                    <div className="mt-4 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Prezzo Scout</p>
                        <p className="text-3xl font-black tracking-tighter">€{deal.dealPrice}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Profitto</p>
                        <p className="text-xl font-black text-green-600 tracking-tighter">+€{deal.profitPotential}</p>
                      </div>
                    </div>
                    
                    <div className="mt-6 pt-4 border-t-2 border-black/5 flex items-center justify-between">
                       <span className="text-[10px] font-black uppercase text-muted-foreground">Vedi Dettagli Annuncio</span>
                       <div className="p-2 bg-black text-white rounded-full transition-transform group-hover:translate-x-1"><ArrowRight size={14} /></div>
                    </div>
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-4xl p-0 border-4 border-black rounded-[40px] overflow-hidden shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]">
                <div className="grid md:grid-cols-2 h-full max-h-[90vh]">
                  {/* Photo Gallery */}
                  <div className="bg-muted border-r-4 border-black overflow-y-auto no-scrollbar">
                    <div className="space-y-4 p-4">
                      <img src={deal.imageUrl} className="w-full aspect-square object-cover rounded-3xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" />
                      {deal.additionalPhotos?.map((p, i) => (
                        <img key={i} src={p} className="w-full aspect-square object-cover rounded-3xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" />
                      ))}
                    </div>
                  </div>
                  
                  {/* Details */}
                  <div className="p-8 overflow-y-auto bg-card flex flex-col">
                    <div className="flex items-center gap-2 mb-2">
                       <span className="pill bg-accent text-black border-2 border-black text-[10px] font-black uppercase">{deal.platform}</span>
                       <span className="pill bg-black text-white border-2 border-black text-[10px] font-black uppercase">{deal.brand}</span>
                    </div>
                    <h2 className="font-display text-4xl font-black uppercase leading-none tracking-tighter mb-4">{deal.name}</h2>
                    
                    <div className="grid grid-cols-2 gap-4 mb-8">
                       <div className="p-4 rounded-3xl bg-secondary border-2 border-black">
                         <p className="text-[10px] font-black uppercase text-muted-foreground">Prezzo Annuncio</p>
                         <p className="text-3xl font-black">€{deal.dealPrice}</p>
                       </div>
                       <div className="p-4 rounded-3xl bg-[#4ade80]/20 border-2 border-[#4ade80] text-green-700">
                         <p className="text-[10px] font-black uppercase opacity-70">Profitto Stimato</p>
                         <p className="text-3xl font-black">+€{deal.profitPotential}</p>
                       </div>
                    </div>

                    {/* Seller Info */}
                    {deal.seller && (
                      <div className="mb-8 p-6 rounded-[32px] border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                         <div className="flex items-center gap-4">
                            <img src={deal.seller.avatar} className="w-12 h-12 rounded-full border-2 border-black" />
                            <div>
                               <p className="font-black text-lg leading-none">{deal.seller.name}</p>
                               <div className="flex items-center gap-1 mt-1">
                                  <Star size={12} className="fill-yellow-400 text-yellow-400" />
                                  <span className="text-xs font-black">{deal.seller.rating}</span>
                                  <span className="text-xs text-muted-foreground font-bold">({deal.seller.reviews} recensioni)</span>
                               </div>
                            </div>
                         </div>
                         <div className="mt-4 flex items-center gap-1 text-xs text-muted-foreground font-bold">
                            <MapPin size={14} />
                            {deal.location}
                         </div>
                      </div>
                    )}

                    <div className="space-y-4 mb-8">
                       <h4 className="font-display text-lg font-black uppercase underline decoration-accent decoration-4">Descrizione Venditore</h4>
                       <p className="text-sm font-medium text-foreground/80 leading-relaxed italic">
                         "{deal.description}"
                       </p>
                    </div>

                    <div className="sticky bottom-0 pt-4 bg-card border-t-2 border-black/5 mt-auto">
                      <Button asChild className="w-full h-16 rounded-2xl bg-black text-white hover:bg-accent hover:text-black border-2 border-black text-lg font-black uppercase shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all hover:shadow-none hover:translate-x-1 hover:translate-y-1">
                        <a href={deal.link} target="_blank" rel="noopener noreferrer">
                          Acquista su {deal.platform} <ExternalLink className="ml-2 h-5 w-5" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          ))
        )}
      </div>

      {scanning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md pointer-events-none">
          <div className="bg-card border-4 border-black p-10 rounded-[48px] shadow-[16px_16px_0px_0px_rgba(255,222,30,1)] text-center animate-in zoom-in-95 duration-500 w-[90%] max-w-lg">
            <div className="relative mx-auto h-20 w-20 mb-8">
               <RefreshCw className="h-20 w-20 animate-spin text-accent" />
               <Zap className="absolute inset-0 m-auto h-8 w-8 text-black fill-current" />
            </div>
            <h3 className="font-display text-4xl font-black uppercase tracking-tighter">Live Scouting...</h3>
            <p className="mt-4 text-xl font-bold text-accent h-8 transition-all duration-300">
              {scanStatus}
            </p>
            <div className="mt-8 space-y-4">
              <div className="h-4 w-full bg-muted border-2 border-black rounded-full overflow-hidden p-0.5">
                <div className="h-full bg-accent rounded-full animate-[loading_2s_ease-in-out_infinite]" style={{ width: '40%' }}></div>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center justify-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Motore di ricerca attivo
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Add this animation to your global CSS
if (typeof document !== 'undefined') {
  const styleId = 'discovery-loading-style';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes loading {
        0% { transform: translateX(-100%); width: 30%; }
        50% { width: 60%; }
        100% { transform: translateX(300%); width: 30%; }
      }
    `;
    document.head.append(style);
  }
}
