import { Link } from "react-router-dom";
import { Camera, Sparkles, TrendingUp, Tag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/AppHeader";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main>
        {/* Hero */}
        <section className="container py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="pill bg-primary-soft text-secondary-foreground">
              <Sparkles className="h-3 w-3" />
              AI per reseller Vinted
            </span>
            <h1 className="mt-6 font-display text-5xl font-bold leading-tight md:text-6xl">
              Scatta una foto.
              <br />
              <span className="bg-gradient-hero bg-clip-text text-transparent">L'AI fa il resto.</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground md:text-xl">
              Riconosce l'oggetto, racconta la storia del brand, lo stima in euro e ti scrive l'annuncio Vinted pronto
              da pubblicare. Pensato per chi rivende ogni giorno.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 rounded-full px-8 text-base shadow-pop">
                <Link to="/auth?mode=signup">
                  Prova gratis
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="ghost" size="lg" className="h-12 rounded-full px-8 text-base">
                <Link to="/auth">Ho già un account</Link>
              </Button>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">Bastano 30 secondi per la prima analisi.</p>
          </div>

          {/* Floating preview cards */}
          <div className="mx-auto mt-16 grid max-w-4xl gap-4 md:grid-cols-3">
            <PreviewCard
              icon={<Camera className="h-5 w-5" />}
              accent="bg-accent"
              title="Carica le foto"
              text="Da 1 a 5 immagini, da qualsiasi angolazione."
            />
            <PreviewCard
              icon={<Sparkles className="h-5 w-5" />}
              accent="bg-primary text-primary-foreground"
              title="L'AI lo riconosce"
              text="Brand, artista, epoca, condizione, storia."
            />
            <PreviewCard
              icon={<TrendingUp className="h-5 w-5" />}
              accent="bg-pop text-pop-foreground"
              title="Stima e annuncio"
              text="Prezzo oggi, proiezione futura, annuncio pronto."
            />
          </div>
        </section>

        {/* Features grid */}
        <section className="bg-muted/40 py-20">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-3xl font-bold md:text-4xl">Tutto quello che ti serve per vendere meglio</h2>
              <p className="mt-3 text-muted-foreground">
                Dalla foto all'annuncio, in un'unica app pensata per chi fa della rivendita un mestiere.
              </p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-2">
              <Feature
                icon={<Sparkles />}
                title="Riconoscimento intelligente"
                text="L'AI identifica l'oggetto, il brand, l'autore o la band, l'epoca e la condizione. Ti racconta anche la storia che fa innamorare il compratore."
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
        <section className="container py-20">
          <div className="mx-auto max-w-3xl rounded-3xl bg-gradient-hero p-10 text-center shadow-pop md:p-16">
            <h2 className="font-display text-3xl font-bold text-primary-foreground md:text-4xl">
              Pronto a smettere di tirare a indovinare il prezzo?
            </h2>
            <p className="mt-4 text-primary-foreground/85">Crea l'account, carica la prima foto, scopri quanto vale.</p>
            <Button asChild size="lg" className="mt-8 h-12 rounded-full bg-background px-8 text-foreground hover:bg-background/90">
              <Link to="/auth?mode=signup">
                Inizia ora
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
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
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  accent: string;
}) => (
  <div className="card-soft animate-fade-up">
    <div className={`mb-4 grid h-10 w-10 place-items-center rounded-2xl ${accent}`}>{icon}</div>
    <h3 className="font-display text-lg font-semibold">{title}</h3>
    <p className="mt-1 text-sm text-muted-foreground">{text}</p>
  </div>
);

const Feature = ({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) => (
  <div className="card-soft">
    <div className="mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-primary-soft text-secondary-foreground">
      {icon}
    </div>
    <h3 className="font-display text-xl font-semibold">{title}</h3>
    <p className="mt-2 text-muted-foreground">{text}</p>
  </div>
);

export default Landing;
