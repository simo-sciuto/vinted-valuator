import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

declare const Deno: { env: { get(key: string): string | undefined } };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const TEXT_MODEL = "gpt-4o-mini";

const VINTED_PATTERN = /^https?:\/\/(www\.)?vinted\.(it|fr|de|be|nl|es|pt|pl|cz|sk|at|com|co\.uk)\/items\/\d+/i;

const CHECK_DEAL_TOOL = {
  type: "function",
  function: {
    name: "submit_deal_check",
    description: "Analisi completa di un annuncio secondhand: valutazione prezzo, convenienza e deal simili.",
    parameters: {
      type: "object",
      properties: {
        item: {
          type: "object",
          properties: {
            name: { type: "string" },
            brand: { type: "string" },
            category: { type: "string", description: "Categoria (es. sneakers, abbigliamento, accessorio, vinile, elettronica)" },
            condition: { type: "string", description: "Condizione stimata dall'annuncio" },
            estimatedYear: { type: "string", description: "Anno o periodo di produzione" },
          },
          required: ["name", "brand", "category", "condition"],
        },
        market: {
          type: "object",
          properties: {
            estimatedMin: { type: "number", description: "Valore di mercato minimo realistico in EUR" },
            estimatedMax: { type: "number", description: "Valore di mercato massimo realistico in EUR" },
            dealScore: { type: "number", description: "Punteggio convenienza 0-100" },
            verdict: { type: "string", description: "Una di: ottimo affare, buon affare, prezzo equo, sopravvalutato, da evitare" },
            savingsAmount: { type: "number", description: "EUR risparmiati vs valore medio (negativo se sopravvalutato)" },
            savingsPercent: { type: "number", description: "Percentuale risparmio (negativo se sopravvalutato)" },
            reasoning: { type: "string", description: "Spiegazione 2-3 frasi" },
            buyRecommendation: { type: "boolean" },
            sellingTip: { type: "string", description: "Dove/come rivenderlo" },
            resaleProbability: { type: "number", description: "Probabilità 0-100 di riuscire a rivendere questo oggetto entro 30 giorni su Vinted/eBay/Depop (misura liquidità e domanda, NON il prezzo)" },
          },
          required: ["estimatedMin", "estimatedMax", "dealScore", "verdict", "savingsAmount", "savingsPercent", "reasoning", "buyRecommendation", "sellingTip", "resaleProbability"],
        },
        negotiationScript: {
          type: "string",
          description: "Script di 2-3 frasi in italiano da copiare e inviare al venditore per trattare il prezzo. Tono amichevole e diretto. Cita il prezzo richiesto, il valore di mercato reale e proponi una cifra specifica più bassa. Es: 'Ciao! Ho visto il tuo annuncio, mi interessa. Ho controllato e su Vinted articoli simili si trovano a €X–€Y. Saresti disposto a scendere a €Z?' Adatta alla categoria e al contesto specifico dell'annuncio.",
        },
        similarDeals: {
          type: "array",
          description: "2-4 item simili da cercare per confronto o flip",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              platform: { type: "string", description: "Una di: Vinted, eBay, Depop" },
              priceRange: { type: "string", description: "Range di prezzo atteso (es. '25-40')" },
              link: { type: "string", description: "URL di ricerca pre-compilato" },
              whyInteresting: { type: "string" },
            },
            required: ["name", "platform", "priceRange", "link", "whyInteresting"],
          },
        },
      },
      required: ["item", "market", "negotiationScript", "similarDeals"],
    },
  },
};

const VERDICT_MAP: Record<string, string> = {
  "ottimo affare": "ottimo affare", "ottimo": "ottimo affare", "eccellente": "ottimo affare",
  "affare eccellente": "ottimo affare", "affare fantastico": "ottimo affare",
  "buon affare": "buon affare", "buono": "buon affare", "buona offerta": "buon affare", "conveniente": "buon affare",
  "prezzo equo": "prezzo equo", "equo": "prezzo equo", "giusto": "prezzo equo", "nella norma": "prezzo equo", "nella media": "prezzo equo",
  "sopravvalutato": "sopravvalutato", "caro": "sopravvalutato", "troppo caro": "sopravvalutato", "overpriced": "sopravvalutato",
  "da evitare": "da evitare", "evitare": "da evitare", "truffa": "da evitare", "pessimo": "da evitare",
};

function normalizeVerdict(v: string): string {
  return VERDICT_MAP[(v ?? "").toLowerCase().trim()] ?? "prezzo equo";
}

function getMeta(html: string, property: string): string {
  const re1 = new RegExp(`property="${property}"[^>]*?content="([^"]*)"`, "i");
  const re2 = new RegExp(`content="([^"]*)"[^>]*?property="${property}"`, "i");
  return (html.match(re1)?.[1] || html.match(re2)?.[1] || "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ");
}

function parsePrice(s: string): number {
  return parseFloat(String(s).replace(",", ".").replace(/[^\d.]/g, "")) || 0;
}

interface ListingData {
  title: string;
  description: string;
  price: number;
  brand: string;
  condition: string;
  imageUrl: string;
}

async function scrapeVintedListing(url: string): Promise<ListingData | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);

  let resp: Response;
  try {
    resp = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "it-IT,it;q=0.9,en;q=0.8",
        "Cache-Control": "no-cache",
      },
      redirect: "follow",
    });
  } finally {
    clearTimeout(timer);
  }

  if (!resp.ok) return null;
  const html = await resp.text();

  // Method 1: JSON-LD Product schema (most reliable for SEO-aware pages)
  for (const match of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(match[1].trim());
      const candidates: unknown[] = Array.isArray(data) ? data : [data];
      const product = candidates.find((d) => (d as Record<string, unknown>)?.["@type"] === "Product") as Record<string, unknown> | undefined;
      if (product) {
        const offers = (product.offers ?? {}) as Record<string, unknown>;
        const rawImg = product.image;
        return {
          title: String(product.name ?? ""),
          description: String(product.description ?? "").slice(0, 1200),
          price: parsePrice(String(offers.price ?? "0")),
          brand: String((product.brand as Record<string, unknown>)?.name ?? ""),
          condition: String(offers.itemCondition ?? "").replace(/^https?:\/\/schema\.org\//, ""),
          imageUrl: Array.isArray(rawImg) ? String(rawImg[0] ?? "") : String(rawImg ?? ""),
        };
      }
    } catch { /* continue */ }
  }

  // Method 2: OG + product meta tags fallback
  const title = getMeta(html, "og:title");
  if (title) {
    return {
      title,
      description: getMeta(html, "og:description").slice(0, 1200),
      price: parsePrice(getMeta(html, "product:price:amount")),
      brand: "",
      condition: "",
      imageUrl: getMeta(html, "og:image"),
    };
  }

  return null;
}

interface CheckDealRequest {
  listingUrl: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY non configurata");

    const body = (await req.json()) as CheckDealRequest;
    const listingUrl = body.listingUrl?.trim() ?? "";

    if (!VINTED_PATTERN.test(listingUrl)) {
      return new Response(
        JSON.stringify({ error: "Inserisci un link valido di Vinted (es. https://www.vinted.it/items/...)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Scrape listing
    let listing: ListingData | null = null;
    try {
      listing = await scrapeVintedListing(listingUrl);
    } catch (e) {
      console.error("Scrape error:", e);
    }

    if (!listing || !listing.title) {
      return new Response(
        JSON.stringify({ error: "Impossibile leggere l'annuncio. Verifica che il link sia corretto e che l'annuncio sia ancora attivo." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const priceContext = listing.price > 0 ? `€${listing.price}` : "non specificato";

    const userPrompt =
      `Analizza questo annuncio Vinted e dimmi se è un buon affare.\n\n` +
      `Titolo: ${listing.title}\n` +
      `Brand: ${listing.brand || "non specificato"}\n` +
      `Condizione: ${listing.condition || "non specificata"}\n` +
      `Prezzo richiesto: ${priceContext}\n` +
      `Descrizione:\n---\n${listing.description || "(nessuna descrizione)"}\n---\n\n` +
      `Sii preciso e realistico sui prezzi di mercato 2024-2025.\n` +
      `Per i similarDeals usa URL reali:\n` +
      `Vinted: https://www.vinted.it/catalog?search_text=QUERY&price_to=PREZZO\n` +
      `eBay: https://www.ebay.it/sch/i.html?_nkw=QUERY&_udhi=PREZZO\n` +
      `Depop: https://www.depop.com/search/?q=QUERY&max_price=PREZZO\n` +
      `(spazi → + nella query)`;

    const aiResponse = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: TEXT_MODEL,
        messages: [
          {
            role: "system",
            content:
              "Sei un esperto reseller con 10 anni di esperienza sui marketplace secondhand europei (Vinted, eBay, Depop Italia). " +
              "Conosci i prezzi di mercato 2024-2025-2026 per: sneakers (Nike, Adidas, NB, Asics), abbigliamento vintage (Levi's, Ralph Lauren, Stone Island, CP Company, Carhartt), " +
              "borse di lusso vintage, vinili, elettronica vintage. " +
              "Valuti con precisione: né ottimista né pessimista. " +
              "Per resaleProbability: misura la facilità di rivendita (liquidità e domanda), NON il prezzo. Sneakers Nike comuni = 85+, brand fashion riconoscibili = 70-80, vinili rari = 55-65, oggetti molto di nicchia = <50. È indipendente da dealScore. " +
              "Per negotiationScript: scrivi sempre in italiano, usa il titolo/brand reale dell'annuncio, cita il prezzo richiesto e il valore di mercato che hai stimato, proponi una cifra concreta ~15-25% sotto il prezzo richiesto (mai meno del tuo estimatedMin). Se il prezzo è già equo o ottimo, proponi uno sconto simbolico di €3-5 per chiudere più velocemente. " +
              "Chiama submit_deal_check con il risultato. Tutto in italiano.",
          },
          { role: "user", content: userPrompt },
        ],
        tools: [CHECK_DEAL_TOOL],
        tool_choice: { type: "function", function: { name: "submit_deal_check" } },
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Troppe richieste, riprova tra qualche istante." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await aiResponse.text();
      console.error("Groq error:", aiResponse.status, t);
      let detail = `Groq ${aiResponse.status}`;
      try { detail = JSON.parse(t)?.error?.message ?? detail; } catch { /* */ }
      return new Response(
        JSON.stringify({ error: `Errore AI: ${detail}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await aiResponse.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("No tool call in check-deal response", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "Analisi non disponibile." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const result = JSON.parse(toolCall.function.arguments);
    result.market.verdict = normalizeVerdict(result.market.verdict);
    result.market.askingPrice = listing.price;
    result.market.resaleProbability = Math.max(0, Math.min(100, Number(result.market.resaleProbability) || 60));
    result.negotiationScript = String(result.negotiationScript ?? "").trim();
    if (!Array.isArray(result.similarDeals)) {
      result.similarDeals = result.similarDeals ? [result.similarDeals] : [];
    }

    return new Response(
      JSON.stringify({
        listing: {
          title: listing.title,
          price: listing.price,
          imageUrl: listing.imageUrl,
          brand: listing.brand,
          condition: listing.condition,
          url: listingUrl,
        },
        result,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("check-deal error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Errore sconosciuto" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
