import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, ImageOff, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { deleteAnalysis, fetchUserAnalyses } from "@/services/analysis";
import type { AnalysisRow } from "@/types/analysis";
import { FlipDiscovery } from "@/components/FlipDiscovery";

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

      <main className="container px-6 py-10 pt-24 md:pt-32 pb-32 md:pb-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <h1 className="font-display text-4xl font-black uppercase md:text-5xl tracking-tighter leading-none">Le tue analisi</h1>
            <p className="mt-2 text-muted-foreground font-medium">Tutto quello che hai stimato e pubblicato.</p>
          </div>
          <Button asChild className="rounded-full shadow-pop h-12 px-6 sm:h-auto sm:px-4">
            <Link to="/new" className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              <span className="font-bold">Nuova analisi</span>
            </Link>
          </Button>
        </div>

        <Tabs defaultValue="analyses" className="mt-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-4 border-b-2 border-black/5">
             <TabsList className="grid w-full md:w-[400px] grid-cols-2 h-12 md:h-14 bg-muted border-2 border-black p-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
               <TabsTrigger 
                 value="analyses" 
                 className="data-[state=active]:bg-black data-[state=active]:text-white font-black uppercase text-[10px] md:text-sm"
               >
                 Le mie Analisi
               </TabsTrigger>
               <TabsTrigger 
                 value="scout" 
                 className="data-[state=active]:bg-accent data-[state=active]:text-black font-black uppercase text-[10px] md:text-sm"
               >
                 Market Scout
               </TabsTrigger>
             </TabsList>
             
             {/* Stats Summary - Optional but cool */}
             <div className="hidden lg:flex items-center gap-6">
                <div className="text-right">
                   <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none">Analisi Totali</p>
                   <p className="text-2xl font-black">{analyses?.length ?? 0}</p>
                </div>
             </div>
          </div>

          <TabsContent value="analyses" className="mt-0 focus-visible:outline-none">
            {isLoading ? (
              <div className="grid gap-2 grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="aspect-square rounded-2xl" />
                ))}
              </div>
            ) : !analyses || analyses.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="grid gap-2 grid-cols-2 lg:grid-cols-3">
                {analyses.map((a) => (
                  <AnalysisCard key={a.id} analysis={a} onDelete={() => handleDelete(a.id)} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="scout" className="mt-0 focus-visible:outline-none">
            <div className="card-soft bg-accent/5 border-2 border-black border-dashed p-8 md:p-12 mb-10 text-center">
               <h2 className="font-display text-3xl font-black uppercase mb-4">Il tuo prossimo acquisto</h2>
               <p className="text-muted-foreground max-w-2xl mx-auto font-medium">
                 Ogni giorno cerchiamo oggetti in vendita a prezzi interessanti. Acquistali prima degli altri.
               </p>
            </div>
            <FlipDiscovery />
          </TabsContent>
        </Tabs>
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
    <AlertDialog>
      <div className="group relative aspect-square overflow-hidden rounded-2xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all">
        <Link to={`/analysis/${analysis.id}`} className="absolute inset-0">
          {photo ? (
            <img
              src={photo}
              alt={ai?.identification.name ?? "Oggetto analizzato"}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full bg-muted flex items-center justify-center">
              <ImageOff className="h-8 w-8 text-muted-foreground/40" />
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

          {/* Category / sold badge */}
          <div className="absolute top-2 left-2">
            {isSold ? (
              <span className="pill bg-[#4ade80] text-black border border-black/30 text-[9px] px-2 py-0.5 font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)]">
                Venduto
              </span>
            ) : ai ? (
              <span className="pill bg-white/90 text-black border border-black/20 text-[9px] px-2 py-0.5 font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,0.3)]">
                {ai.identification.category}
              </span>
            ) : null}
          </div>

          {/* Bottom info */}
          <div className="absolute bottom-0 left-0 right-0 p-2.5">
            <p className="text-white font-black text-xs leading-tight line-clamp-2 drop-shadow-sm">
              {ai?.identification.name ?? "Analisi in corso"}
            </p>
            <div className="mt-1 flex items-center justify-between gap-1">
              {isSold ? (
                <>
                  <p className="text-white font-black text-sm leading-none">€{soldPrice}</p>
                  <p className={`text-[10px] font-black ${isPositive ? "text-[#4ade80]" : "text-[#f87171]"}`}>
                    {isPositive ? "+" : ""}€{Math.abs(actualProfit).toFixed(0)}
                  </p>
                </>
              ) : ai ? (
                <p className="text-white font-black text-sm leading-none">
                  €{ai.currentEstimate.min}–{ai.currentEstimate.max}
                </p>
              ) : (
                <p className="text-white/60 text-[10px] font-medium">
                  {new Date(analysis.created_at).toLocaleDateString("it-IT")}
                </p>
              )}
            </div>
          </div>
        </Link>

        {/* Delete — visible on hover/long-press */}
        <AlertDialogTrigger asChild>
          <button
            className="absolute top-2 right-2 h-7 w-7 flex items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black active:opacity-100"
            aria-label="Elimina"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </AlertDialogTrigger>
      </div>

      <AlertDialogContent className="border-4 border-black rounded-[32px] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display text-2xl font-black uppercase">Sei sicuro?</AlertDialogTitle>
          <AlertDialogDescription className="text-base font-medium">
            Questa azione non può essere annullata. Tutte le foto e i dati dell'analisi verranno eliminati definitivamente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4 gap-2">
          <AlertDialogCancel className="rounded-full border-2 border-black font-bold">Annulla</AlertDialogCancel>
          <AlertDialogAction
            onClick={onDelete}
            className="rounded-full bg-destructive text-destructive-foreground border-2 border-black font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
          >
            Elimina ora
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
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
