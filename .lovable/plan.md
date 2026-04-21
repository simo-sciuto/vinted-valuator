
# ReVinted — assistente AI per reseller su Vinted

## Cosa costruiamo

Un'app web dove l'utente carica le foto di un oggetto, l'AI lo riconosce, ne racconta la storia, lo stima in euro (oggi + futuro), mostra il potenziale di guadagno e genera un annuncio Vinted pronto da pubblicare. Stile giocoso, colorato e amichevole come Vinted.

## Flusso utente

```text
  ┌─────────┐    ┌──────────┐    ┌────────────┐    ┌──────────────┐
  │ Signup  │ -> │  Upload  │ -> │ AI Analisi │ -> │  Risultato   │
  │ / Login │    │  foto    │    │ + Ricerca  │    │  + Annuncio  │
  └─────────┘    └──────────┘    └────────────┘    └──────────────┘
                                                          │
                                                          v
                                                   ┌──────────────┐
                                                   │  Storico     │
                                                   │  personale   │
                                                   └──────────────┘
```

1. **Landing + Auth** — home amichevole con esempi, signup/login email+password.
2. **Nuova analisi** — dropzone per 1-5 foto, campo opzionale "prezzo d'acquisto".
3. **Analisi AI** — loader animato mentre parte una ricerca combinata (visione + web).
4. **Scheda risultato** con sezioni:
   - Identificazione oggetto (cos'è, categoria, brand, artista, epoca/età)
   - Storia del brand / artista (narrazione)
   - Stima attuale in euro (range min-max)
   - Stima futura (1 / 3 / 5 anni) con trend
   - Grafico guadagno se l'utente ha inserito il prezzo d'acquisto (% profitto attuale + proiezione)
   - Bottone "Genera annuncio Vinted"
5. **Annuncio Vinted** — titolo SEO, descrizione informale con hashtag, prezzo di vendita realistico, categoria Vinted. Tutto copiabile con un click.
6. **Storico** — dashboard con tutte le analisi salvate, ricercabili.

## Stile visivo (Vinted-like, giocoso)

- **Palette**: verde acqua Vinted `#09B1BA` come primario, sfondo off-white `#FAFAF7`, accenti giallo `#FFD23F` e corallo `#FF6B6B`, testo `#1A1A1A`.
- **Typography**: heading `Space Grotesk` (arrotondato, moderno), body `DM Sans`.
- **UI**: card con bordi arrotondati (16-24px), ombre morbide, micro-animazioni su hover, emoji e illustrazioni semplici, badge colorati per categorie, bottoni pill-shaped.
- **Vibe**: pulito ma divertente — "marketplace friendly", non SaaS freddo.

## Architettura tecnica

**Frontend** (React + Vite + Tailwind + shadcn/ui)
- `src/pages/Landing.tsx` — home pubblica
- `src/pages/Auth.tsx` — signup / login
- `src/pages/Dashboard.tsx` — storico analisi dell'utente (protetta)
- `src/pages/NewAnalysis.tsx` — upload foto + form prezzo (protetta)
- `src/pages/AnalysisResult.tsx` — risultato dettagliato + grafico Recharts + generazione annuncio (protetta)
- `src/features/analysis/` — componenti: `PhotoDropzone`, `IdentityCard`, `StoryCard`, `PriceEstimate`, `ProfitChart`, `VintedListingCard`
- `src/services/analysis.ts` — chiamate edge functions
- React Query per stato server, Zustand solo se servirà.

**Backend** (Lovable Cloud = Supabase)
- Tabelle:
  - `profiles` — user_id, display_name (trigger auto-create on signup)
  - `analyses` — id, user_id, created_at, photos (array URL), purchase_price, ai_result (jsonb), vinted_listing (jsonb)
- Storage bucket `item-photos` (privato, RLS: utente legge/scrive solo i propri file)
- RLS su `analyses`: utente vede/modifica solo i propri record

**Edge Functions**
- `analyze-item` — riceve gli URL delle foto + prezzo acquisto. Step interni:
  1. Chiamata a **Lovable AI** (google/gemini-3-flash-preview) con vision per identificare oggetto, brand, artista, epoca, categoria.
  2. Chiamata a **Perplexity** (`sonar-pro`) per recuperare prezzi reali di riferimento su eBay / Vinted / Discogs / Catawiki + storia brand/artista, con citazioni.
  3. Nuova chiamata a Lovable AI con structured output (tool calling) per produrre il JSON finale: identificazione, storia, stimaAttuale {min, max}, stimaFutura {anno1, anno3, anno5}, confidenza, fonti.
- `generate-listing` — riceve l'analisi + preferenze utente, produce via Lovable AI (tool calling) il JSON: `{ titolo, descrizione, hashtag[], prezzoVendita, categoriaVinted }`. Prompt ottimizzato per mercato europeo multilingua (default italiano).

**Integrazione esterna**
- **Perplexity** (connector) per stime di prezzo basate su ricerche web reali con citazioni — serve la tua chiave, la colleghiamo al primo uso.
- **Lovable AI** per vision, scrittura storia, generazione annuncio — pre-configurata, nessuna chiave richiesta.

## Cosa ti serve per partire

1. Attivare **Lovable Cloud** (auth + database + storage + edge functions).
2. Collegare il **connector Perplexity** (ti guido al momento giusto — ti servirà un account Perplexity con crediti API).

## Cosa lasciamo fuori da questa prima versione

- Pubblicazione automatica su Vinted (Vinted non ha API pubblica — l'utente copia/incolla).
- Pagamenti / piani premium.
- Notifiche email.
- Analytics condivise tra utenti.

## Prima iterazione consegnata

Landing + auth + upload + analisi AI completa + grafico guadagno + generazione annuncio + storico personale. Tutto in italiano di default, facilmente estendibile ad altre lingue europee in una fase successiva.
