import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, ImageOff, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { deleteAnalysis, fetchUserAnalyses } from "@/services/analysis";
import type { AnalysisRow } from "@/types/analysis";

const Dashboard = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: analyses, isLoading } = useQuery({
    queryKey: ["analyses"],
    queryFn: fetchUserAnalyses,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAnalysis,
    onSuccess: (_, id) => {
      queryClient.setQueryData<AnalysisRow[]>(["analyses"], (old) => 
        old ? old.filter((a) => a.id !== id) : []
      );
      toast({ title: "Eliminata", description: "Analisi rimossa." });
    },
    onError: (err) => {
      toast({
        title: "Errore",
        description: err instanceof Error ? err.message : "Errore",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };



  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="container py-10 pt-32">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-black uppercase md:text-5xl tracking-tighter">Le tue analisi</h1>
            <p className="mt-1 text-muted-foreground">Tutto quello che hai stimato e pubblicato.</p>
          </div>
          <Button asChild className="rounded-full shadow-pop">
            <Link to="/new">
              <Plus className="h-4 w-4" />
              Nuova analisi
            </Link>
          </Button>
        </div>

        <div className="mt-8">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-64 rounded-3xl" />
              ))}
            </div>
          ) : !analyses || analyses.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {analyses.map((a) => (
                <AnalysisCard key={a.id} analysis={a} onDelete={() => handleDelete(a.id)} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const AnalysisCard = ({ analysis, onDelete }: { analysis: AnalysisRow; onDelete: () => void }) => {
  const ai = analysis.ai_result;
  const photo = analysis.photos[0];
  const isSold = analysis.status === "sold";
  const profit = ai?.profit;
  const soldPrice = profit?.soldPrice ?? 0;
  const actualProfit = profit?.actualProfit ?? 0;
  const isPositive = actualProfit >= 0;

  return (
    <div className={`card-soft group flex flex-col overflow-hidden p-0 border-2 border-black hover:-translate-y-2 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all ${isSold ? "bg-[#4ade80]/10" : ""}`}>
      <Link to={`/analysis/${analysis.id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted border-b-2 border-black">
          {photo ? (
            <img
              src={photo}
              alt={ai?.identification.name ?? "Oggetto analizzato"}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-muted-foreground">
              <ImageOff className="h-8 w-8" />
            </div>
          )}
          {ai && !isSold && (
            <span className="pill absolute left-3 top-3 bg-white text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              {ai.identification.category}
            </span>
          )}
          {isSold && (
            <span className="pill absolute left-3 top-3 bg-[#4ade80] text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              Venduto
            </span>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <Link to={`/analysis/${analysis.id}`} className="block">
          <h3 className="line-clamp-1 font-display text-lg font-semibold">
            {ai?.identification.name ?? "Analisi in corso"}
          </h3>
          <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
            {ai?.identification.brand || ai?.identification.artist || ai?.identification.era}
          </p>
        </Link>
        <div className="mt-auto flex items-center justify-between pt-4 border-t-2 border-black/5 mt-4">
          <div>
            {isSold ? (
              <>
                <p className="font-display text-2xl font-black text-black tracking-tight">
                  € {soldPrice}
                </p>
                <p className={`text-sm font-bold uppercase ${isPositive ? "text-green-600" : "text-red-600"}`}>
                  {isPositive ? "+" : ""}€ {actualProfit.toFixed(2)}
                </p>
              </>
            ) : (
              <>
                {ai && (
                  <p className="font-display text-2xl font-black text-black tracking-tight">
                    € {ai.currentEstimate.min}–{ai.currentEstimate.max}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(analysis.created_at).toLocaleDateString("it-IT")}
                </p>
              </>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Elimina">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const EmptyState = () => (
  <div className="card-soft mx-auto max-w-md text-center">
    <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent">
      <Plus className="h-6 w-6" />
    </div>
    <h2 className="mt-4 font-display text-xl font-bold">Ancora nessuna analisi</h2>
    <p className="mt-2 text-muted-foreground">
      Carica la prima foto per scoprire valore, storia e annuncio Vinted dell'oggetto.
    </p>
    <Button asChild className="mt-6 rounded-full">
      <Link to="/new">Inizia adesso</Link>
    </Button>
  </div>
);

export default Dashboard;
