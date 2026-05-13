import { Link } from "react-router-dom";
import { Camera, Tag, TrendingUp, FileText, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/AppHeader";
import { FlipDiscovery } from "@/components/FlipDiscovery";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="pt-32">
        {/* Hero */}
        <section className="container px-6 py-12 md:py-20 relative overflow-hidden">
          <div className="mx-auto max-w-4xl text-center relative z-10">
            <span className="pill bg-accent text-accent-foreground border-2 border-black animate-in fade-in slide-in-from-bottom-4 duration-700 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all text-[10px] md:text-xs">
              <Tag className="h-3 w-3 md:h-4 md:w-4" />
              Per chi compra e rivende su Vinted
            </span>
            <h1 className="mt-6 md:mt-8 font-display text-4xl sm:text-5xl md:text-8xl font-black uppercase leading-[0.95] md:leading-[0.9] tracking-tighter animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-150">
              Scatta una foto.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-sun drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] md:drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]">Scopri il vero valore.</span>
            </h1>
            <p className="mt-6 md:mt-8 text-lg md:text-2xl text-foreground font-medium animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 max-w-2xl mx-auto leading-tight md:leading-normal">
              Foto, brand, storia, stima in euro e annuncio Vinted pronto da pubblicare. Tutto in pochi secondi.
            </p>

            <div className="mt-10 md:mt-12 flex flex-col items-stretch sm:items-center justify-center gap-4 sm:flex-row animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500">
              <Button asChild size="lg" className="h-14 md:h-16 rounded-full px-8 md:px-12 text-lg md:text-xl btn-neo">
                <Link to="/auth?mode=signup">
                  Prova gratis
                  <ArrowRight className="ml-2 md:ml-3 h-5 w-5 md:h-6 md:w-6 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button asChild variant="ghost" size="lg" className="h-14 md:h-16 rounded-full px-8 md:px-12 text-lg md:text-xl font-bold uppercase tracking-wider border-2 border-black hover:bg-black hover:text-white transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-1">
                <Link to="/auth">Ho un account</Link>
              </Button>
            </div>

            <p className="mt-8 text-[10px] md:text-sm font-bold uppercase tracking-widest text-muted-foreground animate-in fade-in duration-1000 delay-700">Nessuna carta richiesta · Risultati in 30 secondi</p>
          </div>

          {/* Floating preview cards */}
          <div className="mx-auto mt-24 grid max-w-5xl gap-8 md:grid-cols-3 relative z-10">
            <PreviewCard
              icon={<Camera className="h-6 w-6" />}
              accent="bg-accent border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] text-black"
              title="Carica le foto"
              text="Da 1 a 5 immagini. Più angolazioni, stima più precisa."
              delay="delay-[600ms]"
            />
            <PreviewCard
              icon={<Tag className="h-7 w-7" />}
              accent="bg-pop text-black border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]"
              title="Stima precisa"
              text="Brand, epoca, condizione e valore di mercato aggiornato."
              delay="delay-[800ms]"
              featured={true}
            />
            <PreviewCard
              icon={<TrendingUp className="h-7 w-7" />}
              accent="bg-black text-white border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]"
              title="Pubblica subito"
              text="Annuncio Vinted già scritto. Copia, incolla, vendi."
              delay="delay-[1000ms]"
            />
          </div>
          
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-sun rounded-full blur-[120px] opacity-20 pointer-events-none"></div>
        </section>

        {/* Flip Discovery Preview */}
        <section className="container py-20 border-t-2 border-black/5">
           <div className="mx-auto max-w-5xl">
             <div className="mb-12 text-center">
                <span className="pill bg-black text-white text-[10px] font-black uppercase mb-4">Market Scout</span>
                <h2 className="font-display text-4xl font-black uppercase md:text-5xl">Gli affari del giorno</h2>
                <p className="mt-4 text-xl text-muted-foreground font-medium">Oggetti in vendita a prezzi interessanti, selezionati ogni giorno sui principali marketplace.</p>
             </div>
             <FlipDiscovery limit={3} />
             <div className="mt-12 text-center">
                <Button asChild variant="outline" className="h-12 rounded-full border-2 border-black font-bold uppercase shadow-pop hover:shadow-none hover:translate-y-1 transition-all">
                  <Link to="/auth?mode=signup">Registrati per vedere tutti gli affari</Link>
                </Button>
             </div>
           </div>
        </section>

        {/* Features grid */}
        <section className="bg-gradient-to-b from-background to-pop/20 py-32 relative border-y-2 border-black">
          <div className="container relative z-10">
            <div className="mx-auto max-w-3xl text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <h2 className="font-display text-5xl font-black uppercase md:text-6xl">Tutto quello che ti serve per vendere bene</h2>
              <p className="mt-6 text-xl text-foreground font-medium">
                Dalla foto all'annuncio pubblicato, senza perdere tempo a cercare prezzi o scrivere descrizioni.
              </p>
            </div>

            <div className="mt-20 grid gap-8 md:grid-cols-2 max-w-5xl mx-auto">
              <Feature
                icon={<Tag className="h-6 w-6" />}
                title="Scheda prodotto completa"
                text="Brand, autore, epoca e condizione in un colpo solo. Con i dettagli storici che convincono chi guarda il tuo annuncio."
              />
              <Feature
                icon={<TrendingUp />}
                title="Valore di mercato reale"
                text="Prezzo attuale su Vinted, eBay e Discogs, più una proiezione su quanto potrebbe valere in futuro."
              />
              <Feature
                icon={<FileText />}
                title="Annuncio già scritto"
                text="Testo personalizzato, prezzo suggerito e categoria. Copia e pubblica in un click, senza scrivere nulla."
              />
              <Feature
                icon={<Camera />}
                title="Storico personale"
                text="Tutte le tue stime salvate. Confronta acquisti e vendite, tieni traccia di quanto guadagni davvero."
              />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="container px-6 py-20 md:py-32">
          <div className="mx-auto max-w-5xl rounded-[32px] md:rounded-[40px] bg-gradient-hero border-2 border-black p-8 md:p-24 text-center shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] md:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden group">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000015_2px,transparent_2px),linear-gradient(to_bottom,#00000015_2px,transparent_2px)] bg-[size:48px_48px] opacity-30"></div>
            <div className="relative z-10">
              <h2 className="font-display text-4xl font-black uppercase tracking-tighter text-black md:text-7xl leading-none">
                Smetti di tirare a indovinare il prezzo.
              </h2>
              <p className="mt-6 md:mt-8 text-lg md:text-2xl text-black/90 font-bold leading-tight">Crea l'account, carica la prima foto, scopri il vero valore.</p>
              <Button asChild size="lg" className="mt-10 md:mt-12 h-14 md:h-16 w-full sm:w-auto rounded-full bg-black px-12 text-lg md:text-xl text-white hover:bg-black/90 btn-neo border-transparent">
                <Link to="/auth?mode=signup">
                  Inizia subito
                  <ArrowRight className="ml-3 h-5 w-5 md:h-6 md:w-6" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 py-8 text-center text-sm text-muted-foreground">
        STIMA · Fatto con ❤️ per chi rivende
      </footer>
    </div>
  );
};

const PreviewCard = ({
  icon,
  title,
  text,
  accent,
  delay = "delay-0",
  featured = false,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  accent: string;
  delay?: string;
  featured?: boolean;
}) => (
  <div className={`card-soft group hover:-translate-y-2 transition-all duration-300 animate-in fade-in slide-in-from-bottom-8 fill-mode-both ${delay} ${featured ? 'bg-pop/10 scale-105 z-10' : ''}`}>
    <div className={`mb-6 grid h-16 w-16 place-items-center rounded-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 ${accent}`}>{icon}</div>
    <h3 className="font-display text-2xl font-black uppercase">{title}</h3>
    <p className="mt-3 text-foreground font-medium leading-relaxed">{text}</p>
  </div>
);

const Feature = ({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) => (
  <div className="card-soft group hover:-translate-y-2 transition-all duration-300 bg-white">
    <div className="mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-accent text-black border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-transform duration-500 group-hover:rotate-12 group-hover:bg-pop">
      {icon}
    </div>
    <h3 className="font-display text-3xl font-black uppercase tracking-tight">{title}</h3>
    <p className="mt-4 text-xl text-foreground/80 font-medium leading-relaxed">{text}</p>
  </div>
);

export default Landing;
