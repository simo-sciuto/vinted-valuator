import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, ImageOff, Trash2 } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { deleteAnalysis, fetchUserAnalyses } from "@/services/analysis";
import type { AnalysisRow } from "@/types/analysis";

const Dashboard = () => {
  const [analyses, setAnalyses] = useState<AnalysisRow[] | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchUserAnalyses()
      .then(setAnalyses)
      .catch((err) =>
        toast({
          title: "Errore caricamento",
          description: err instanceof Error ? err.message : "Errore sconosciuto",
          variant: "destructive",
        }),
      );
  }, [toast]);

  const handleDelete = async (id: string) => {
    try {
      await deleteAnalysis(id);
      setAnalyses((prev) => prev?.filter((a) => a.id !== id) ?? null);
      toast({ title: "Eliminata", description: "Analisi rimossa." });
    } catch (err) {
      toast({
        title: "Errore",
        description: err instanceof Error ? err.message : "Errore",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="container py-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold md:text-4xl">Le tue analisi</h1>
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
          {analyses === null ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-64 rounded-3xl" />
              ))}
            </div>
          ) : analyses.length === 0 ? (
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
  return (
    <div className="card-soft group flex flex-col overflow-hidden p-0">
      <Link to={`/analysis/${analysis.id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
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
          {ai && (
            <span className="pill absolute left-3 top-3 bg-background/90 text-foreground backdrop-blur">
              {ai.identification.category}
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
        <div className="mt-auto flex items-center justify-between pt-4">
          <div>
            {ai && (
              <p className="font-display text-xl font-bold text-primary">
                € {ai.currentEstimate.min}–{ai.currentEstimate.max}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {new Date(analysis.created_at).toLocaleDateString("it-IT")}
            </p>
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
