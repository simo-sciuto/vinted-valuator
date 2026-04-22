import { Link } from "react-router-dom";
import { Camera, Sparkles, TrendingUp, Tag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/AppHeader";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="pt-32">
        {/* Hero */}
        <section className="container py-12 md:py-20 relative overflow-hidden">
          <div className="mx-auto max-w-4xl text-center relative z-10">
            <span className="pill bg-accent text-accent-foreground border-2 border-black animate-in fade-in slide-in-from-bottom-4 duration-700 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
              <Sparkles className="h-4 w-4" />
              L'alleato dei reseller Vinted
            </span>
            <h1 className="mt-8 font-display text-6xl font-black uppercase leading-[0.9] md:text-8xl tracking-tighter animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-150">
              Scatta una foto.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-sun drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]">Facciamo noi il resto.</span>
            </h1>
            <p className="mt-8 text-xl text-foreground font-medium md:text-2xl animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 max-w-2xl mx-auto">
              Riconosciamo l'oggetto, raccontiamo la storia del brand, lo stimiamo in euro e ti scriviamo l'annuncio Vinted pronto
              da pubblicare. Pensato per chi rivende ogni giorno.
            </p>

            <div className="mt-12 flex flex-col items-center justify-center gap-6 sm:flex-row animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500">
              <Button asChild size="lg" className="h-16 rounded-full px-12 text-xl btn-neo">
                <Link to="/auth?mode=signup">
                  Prova gratis
                  <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button asChild variant="ghost" size="lg" className="h-16 rounded-full px-12 text-xl font-bold uppercase tracking-wider border-2 border-black hover:bg-black hover:text-white transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-1">
                <Link to="/auth">Ho già un account</Link>
              </Button>
            </div>

            <p className="mt-8 text-sm font-bold uppercase tracking-widest text-muted-foreground animate-in fade-in duration-1000 delay-700">Bastano 30 secondi per la tua prima analisi.</p>
          </div>

          {/* Floating preview cards */}
          <div className="mx-auto mt-24 grid max-w-5xl gap-8 md:grid-cols-3 relative z-10">
            <PreviewCard
              icon={<Camera className="h-6 w-6" />}
              accent="bg-accent border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] text-black"
              title="Carica le foto"
              text="Da 1 a 5 immagini, da qualsiasi angolazione."
              delay="delay-[600ms]"
            />
            <PreviewCard
              icon={<Sparkles className="h-7 w-7" />}
              accent="bg-pop text-black border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]"
              title="Analisi Istantanea"
              text="Brand, artista, epoca, condizione, storia dell'oggetto."
              delay="delay-[800ms]"
              featured={true}
            />
            <PreviewCard
              icon={<TrendingUp className="h-7 w-7" />}
              accent="bg-black text-white border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]"
              title="Stima e annuncio"
              text="Prezzo attuale, proiezione futura, annuncio pronto all'uso."
              delay="delay-[1000ms]"
            />
          </div>
          
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-sun rounded-full blur-[120px] opacity-20 pointer-events-none"></div>
        </section>

        {/* Features grid */}
        <section className="bg-gradient-to-b from-background to-pop/20 py-32 relative border-y-2 border-black">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 mix-blend-overlay pointer-events-none"></div>
          <div className="container relative z-10">
            <div className="mx-auto max-w-3xl text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <h2 className="font-display text-5xl font-black uppercase md:text-6xl">Tutto quello che ti serve per vendere al top</h2>
              <p className="mt-6 text-xl text-foreground font-medium">
                Dalla foto all'annuncio, in un'unica app dal design mozzafiato pensata per chi fa della rivendita un'arte.
              </p>
            </div>

            <div className="mt-20 grid gap-8 md:grid-cols-2 max-w-5xl mx-auto">
              <Feature
                icon={<Sparkles className="h-6 w-6" />}
                title="Riconoscimento intelligente"
                text="Il nostro motore identifica l'oggetto, il brand, l'autore o la band, l'epoca e la condizione. Ti fornisce anche i dettagli storici che fanno innamorare i compratori."
              />
              <Feature
                icon={<TrendingUp />}
                title="Stima oggi e domani"
                text="Prezzo realistico per il mercato europeo (Vinted, eBay, Discogs) e proiezione di valore a 1, 3 e 5 anni."
              />
              <Feature
                icon={<Tag />}
                title="Annuncio Vinted pronto"
                text="Titolo SEO, descrizione informale, hashtag ottimizzati, prezzo e categoria. Copia, incolla, pubblica."
              />
              <Feature
                icon={<Camera />}
                title="Storico personale"
                text="Tutte le tue analisi salvate. Confronta acquisti e vendite, tieni traccia di quanto guadagni davvero."
              />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="container py-32">
          <div className="mx-auto max-w-5xl rounded-[40px] bg-gradient-hero border-2 border-black p-12 text-center shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] md:p-24 relative overflow-hidden group">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000015_2px,transparent_2px),linear-gradient(to_bottom,#00000015_2px,transparent_2px)] bg-[size:48px_48px] opacity-30"></div>
            <div className="relative z-10">
              <h2 className="font-display text-5xl font-black uppercase tracking-tighter text-black md:text-7xl">
                Smetti di tirare a indovinare il prezzo.
              </h2>
              <p className="mt-8 text-2xl text-black/90 font-bold">Crea l'account, carica la prima foto, scopri il vero valore.</p>
              <Button asChild size="lg" className="mt-12 h-16 rounded-full bg-black px-12 text-xl text-white hover:bg-black/90 btn-neo border-transparent">
                <Link to="/auth?mode=signup">
                  Inizia subito
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 py-8 text-center text-sm text-muted-foreground">
        ReVinted · Fatto con ❤️ per chi rivende
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
