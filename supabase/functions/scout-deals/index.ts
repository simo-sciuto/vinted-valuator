// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

declare const Deno: { env: { get(key: string): string | undefined } };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o-mini";

// ── Types ────────────────────────────────────────────────────────────────────

interface RawListing {
  title: string;
  price: number;
  url: string;
  brand: string;
  condition: string;
  imageUrl: string;
}

interface ScoutResult {
  id: string;
  title: string;
  category: string;
  searchQuery: string;
  buyMaxPrice: number;
  sellEstimate: number;
  profitEstimate: number;
  whyUndervalued: string;
  spotTip: string;
  marketContext: string;
  saleSuccessProbability: number;
  searchUrl: string;
  isReal?: boolean;
  imageUrl?: string;
  directUrl?: string;
  dealScore?: number;
  verdict?: string;
}

// ── AI Tools ─────────────────────────────────────────────────────────────────

const EVALUATE_TOOL = {
  type: "function",
  function: {
    name: "evaluate_listings",
    description: "Valuta una lista di annunci Vinted reali e identifica quelli sottovalutati",
    parameters: {
      type: "object",
      properties: {
        evaluations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              index: { type: "number", description: "Indice 0-based dell'annuncio nella lista" },
              category: { type: "string", description: "Categoria (es. sneakers, abbigliamento, vinile, accessorio)" },
              marketValue: { type: "number", description: "Prezzo di mercato realistico in EUR (cosa vale su eBay/Depop)" },
              dealScore: { type: "number", description: "Convenienza 0-100: 100 = affare eccezionale, 50 = prezzo equo" },
              verdict: { type: "string", description: "Una di: ottimo affare, buon affare, prezzo equo, sopravvalutato" },
              whyUndervalued: { type: "string", description: "Motivo breve in max 12 parole" },
              spotTip: { type: "string", description: "Cosa verificare prima di comprare, max 12 parole" },
              whereToResell: { type: "string", description: "Piattaforma migliore per rivendita, max 8 parole" },
              saleSuccessProbability: { type: "number", description: "Probabilità di rivendita 0-100" },
            },
            required: ["index", "category", "marketValue", "dealScore", "verdict", "whyUndervalued", "spotTip", "whereToResell", "saleSuccessProbability"],
          },
        },
      },
      required: ["evaluations"],
    },
  },
};

const SCOUT_TOOL = {
  type: "function",
  function: {
    name: "suggest_opportunities",
    description: "Genera opportunità di acquisto su Vinted con guida pratica per reseller",
    parameters: {
      type: "object",
      properties: {
        opportunities: {
          type: "array",
          description: "Lista di 4-5 opportunità concrete di acquisto e rivendita",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              category: { type: "string" },
              searchQuery: { type: "string" },
              buyMaxPrice: { type: "number" },
              sellEstimate: { type: "number" },
              profitEstimate: { type: "number" },
              whyUndervalued: { type: "string" },
              spotTip: { type: "string" },
              marketContext: { type: "string" },
              saleSuccessProbability: { type: "number", description: "Probabilità di rivendita 0-100" },
            },
            required: ["title", "category", "searchQuery", "buyMaxPrice", "sellEstimate", "profitEstimate", "whyUndervalued", "spotTip", "marketContext", "saleSuccessProbability"],
          },
        },
      },
      required: ["opportunities"],
    },
  },
};

// ── Fallback data ─────────────────────────────────────────────────────────────

const DEFAULT_OPPORTUNITIES: ScoutResult[] = [
  {
    id: "default-0", title: "Stone Island Vintage Pre-2000", category: "Abbigliamento",
    searchQuery: "stone island vintage jacket", buyMaxPrice: 45, sellEstimate: 180, profitEstimate: 108,
    whyUndervalued: "I venditori non riconoscono i pezzi pre-2000 con il badge circolare originale.",
    spotTip: "Cerca il badge circolare con bussola e anno <2000.",
    marketContext: "Grailed e eBay UK/USA. I collezionisti pagano premium per il vintage anni '90.",
    saleSuccessProbability: 72, searchUrl: "https://www.vinted.it/catalog?search_text=stone+island+vintage+jacket&price_to=45",
  },
  {
    id: "default-1", title: "Levi's 501 Made in USA", category: "Abbigliamento",
    searchQuery: "levis 501 made usa vintage", buyMaxPrice: 25, sellEstimate: 85, profitEstimate: 52,
    whyUndervalued: "Molti venditori non distinguono i 501 made in USA (anni '80-'90) da quelli moderni.",
    spotTip: "Controlla etichetta 'Made in USA' e patch in cuoio con codice.",
    marketContext: "eBay e Depop verso acquirenti USA e giapponesi.",
    saleSuccessProbability: 82, searchUrl: "https://www.vinted.it/catalog?search_text=levis+501+made+usa&price_to=25",
  },
  {
    id: "default-2", title: "Nike Air Max 95 OG", category: "Sneakers",
    searchQuery: "nike air max 95 originali", buyMaxPrice: 55, sellEstimate: 160, profitEstimate: 93,
    whyUndervalued: "Le colorway OG anni '90 vengono vendute come 'scarpe Nike' senza specificare il modello.",
    spotTip: "Verifica anno sul tallone interno. Cerca colorway OG, non reprint.",
    marketContext: "StockX e eBay. Le OG in buone condizioni hanno domanda stabile.",
    saleSuccessProbability: 78, searchUrl: "https://www.vinted.it/catalog?search_text=nike+air+max+95&price_to=55",
  },
  {
    id: "default-3", title: "Vinile Jazz/Soul anni '60-'70", category: "Vinili",
    searchQuery: "vinile jazz soul anni 70 lp", buyMaxPrice: 8, sellEstimate: 45, profitEstimate: 30,
    whyUndervalued: "Chi vende i vinili del nonno non conosce il valore. Blue Note spesso sotto €10.",
    spotTip: "Fotografa il label: cerca 'Blue Note', 'Prestige', 'Atlantic'.",
    marketContext: "Discogs e negozi di dischi. Prime stampe in buone condizioni: €30-100+.",
    saleSuccessProbability: 60, searchUrl: "https://www.vinted.it/catalog?search_text=vinile+jazz+soul+anni+70&price_to=8",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getApiKey(): string {
  const key = Deno.env.get("OPENAI_API_KEY");
  if (!key) throw new Error("OPENAI_API_KEY non configurata");
  return key;
}

function parsePrice(s: string | number): number {
  if (typeof s === "number") return s;
  return parseFloat(String(s).replace(",", ".").replace(/[^\d.]/g, "")) || 0;
}

// ── Real listing scraper ──────────────────────────────────────────────────────

async function scrapeCatalogListings(searchText: string, maxPrice: number): Promise<RawListing[]> {
  const commonHeaders = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept-Language": "it-IT,it;q=0.9,en;q=0.8",
    "Cache-Control": "no-cache",
  };

  // Strategy 1: Vinted internal catalog API (returns JSON without auth on some regions)
  try {
    const apiUrl = `https://www.vinted.it/api/v2/catalog/items?search_text=${encodeURIComponent(searchText)}&price_to=${maxPrice}&per_page=20&order=newest_first&page=1`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    let apiResp: Response;
    try {
      apiResp = await fetch(apiUrl, {
        signal: controller.signal,
        headers: {
          ...commonHeaders,
          "Accept": "application/json, text/javascript, */*; q=0.01",
          "X-Requested-With": "XMLHttpRequest",
          "Referer": "https://www.vinted.it/catalog",
        },
      });
    } finally {
      clearTimeout(timer);
    }

    if (apiResp.ok) {
      const data = await apiResp.json();
      const items: unknown[] = data?.items ?? data?.catalog_items ?? [];
      if (Array.isArray(items) && items.length > 0) {
        const results = items
          .slice(0, 24)
          .map((item: any) => ({
            title: String(item.title ?? item.name ?? ""),
            price: parsePrice(item.price_numeric ?? item.price ?? 0),
            url: String(item.url ?? `https://www.vinted.it/items/${item.id}`),
            brand: String(item.brand_title ?? (item.brand as any)?.title ?? item.brand ?? ""),
            condition: String(item.status ?? item.condition ?? ""),
            imageUrl: String(item.photos?.[0]?.url ?? item.photo?.url ?? item.image ?? ""),
          }))
          .filter((i) => i.price > 0 && i.title.length > 3);
        if (results.length > 0) {
          console.log(`Strategy 1 (API) succeeded: ${results.length} items`);
          return results;
        }
      }
    }
  } catch (e) {
    console.warn("Strategy 1 (API) failed:", e instanceof Error ? e.message : e);
  }

  // Strategy 2: HTML scraping — JSON-LD ItemList + embedded script JSON
  try {
    const htmlUrl = `https://www.vinted.it/catalog?search_text=${encodeURIComponent(searchText)}&price_to=${maxPrice}&order=newest_first`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    let htmlResp: Response;
    try {
      htmlResp = await fetch(htmlUrl, {
        signal: controller.signal,
        headers: {
          ...commonHeaders,
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Dest": "document",
        },
        redirect: "follow",
      });
    } finally {
      clearTimeout(timer);
    }

    if (!htmlResp.ok) throw new Error(`HTML fetch status: ${htmlResp.status}`);
    const html = await htmlResp.text();

    // 2a: JSON-LD ItemList / ProductList schema
    for (const match of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
      try {
        const parsed = JSON.parse(match[1].trim());
        const schemas: unknown[] = Array.isArray(parsed) ? parsed : [parsed];
        for (const schema of schemas) {
          const s = schema as Record<string, unknown>;
          const type = s["@type"];
          if (type === "ItemList" || type === "ProductListing" || type === "ProductGroup") {
            const elements: unknown[] = (s.itemListElement as unknown[] ?? s.item as unknown[] ?? []);
            const items = elements
              .map((el: any) => el.item ?? el)
              .filter((item: any) => item?.offers?.price || item?.price)
              .map((item: any) => ({
                title: String(item.name ?? ""),
                price: parsePrice(item.offers?.price ?? item.price ?? "0"),
                url: String(item.url ?? item["@id"] ?? ""),
                brand: String((item.brand as any)?.name ?? ""),
                condition: String(item.offers?.itemCondition ?? "").replace(/https?:\/\/schema\.org\//, ""),
                imageUrl: Array.isArray(item.image) ? String(item.image[0]) : String(item.image ?? ""),
              }))
              .filter((i) => i.price > 0 && i.url && i.title.length > 3);
            if (items.length > 0) {
              console.log(`Strategy 2a (JSON-LD) succeeded: ${items.length} items`);
              return items;
            }
          }
        }
      } catch { /* continue */ }
    }

    // 2b: Embedded JSON in script tags (Next.js / window.__INITIAL_STATE__ patterns)
    const scriptPatterns = [
      /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/,
      /window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\});\s*(?:window|<\/script)/,
      /window\.__catalog\s*=\s*(\{[\s\S]*?\});\s*(?:window|<\/script)/,
    ];

    for (const pattern of scriptPatterns) {
      const match = html.match(pattern);
      if (!match) continue;
      try {
        const data = JSON.parse(match[1]);
        const findItemArray = (obj: unknown, depth = 0): unknown[] => {
          if (depth > 5 || !obj || typeof obj !== "object") return [];
          if (Array.isArray(obj) && obj.length > 2) {
            const first = (obj as any[])[0];
            if (first?.title && (first?.price || first?.price_numeric)) return obj as unknown[];
          }
          for (const key of Object.keys(obj as Record<string, unknown>)) {
            if (["items", "catalog_items", "products", "listings"].includes(key)) {
              const val = (obj as any)[key];
              if (Array.isArray(val) && val.length > 0 && val[0]?.title) return val;
            }
            const found = findItemArray((obj as any)[key], depth + 1);
            if (found.length > 0) return found;
          }
          return [];
        };

        const rawItems = findItemArray(data);
        if (rawItems.length > 0) {
          const items = (rawItems as any[])
            .slice(0, 24)
            .map((item) => ({
              title: String(item.title ?? item.name ?? ""),
              price: parsePrice(item.price_numeric ?? item.price ?? 0),
              url: String(item.url ?? `https://www.vinted.it/items/${item.id}`),
              brand: String(item.brand_title ?? item.brand?.title ?? item.brand ?? ""),
              condition: String(item.status ?? item.condition ?? ""),
              imageUrl: String(item.photos?.[0]?.url ?? item.photo?.url ?? item.image ?? ""),
            }))
            .filter((i) => i.price > 0 && i.title.length > 3);
          if (items.length > 0) {
            console.log(`Strategy 2b (embedded JSON) succeeded: ${items.length} items`);
            return items;
          }
        }
      } catch { /* continue */ }
    }

    console.warn("Strategy 2 (HTML) found no parseable item data");
  } catch (e) {
    console.warn("Strategy 2 (HTML) failed:", e instanceof Error ? e.message : e);
  }

  return [];
}

// ── Batch AI evaluation of real listings ──────────────────────────────────────

async function evaluateListings(listings: RawListing[], apiKey: string): Promise<ScoutResult[]> {
  if (listings.length === 0) return [];

  const listingsSummary = listings
    .map((l, i) =>
      `${i}: "${l.title}" | Brand: ${l.brand || "N/D"} | Condizione: ${l.condition || "N/D"} | Prezzo: €${l.price}`,
    )
    .join("\n");

  const resp = await fetch(OPENAI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "Sei un esperto reseller con profonda conoscenza dei prezzi 2024-2025 su Vinted Italia, eBay, Depop, Grailed. " +
            "Valuta ogni annuncio realisticamente. dealScore >65 = prezzo significativamente sotto mercato. " +
            "Ignora annunci di privati con prezzi gonfiati. Sii conservativo sul marketValue. " +
            "Fornisci solo la risposta con la funzione evaluate_listings.",
        },
        {
          role: "user",
          content:
            "Valuta questi annunci trovati ADESSO su Vinted. " +
            "Per ognuno: calcola il valore di mercato reale, il dealScore e se vale la pena comprare per rivendere.\n\n" +
            listingsSummary,
        },
      ],
      functions: [EVALUATE_TOOL.function],
      function_call: { name: "evaluate_listings" },
      temperature: 0.15,
      max_tokens: 2500,
    }),
  });

  if (!resp.ok) {
    console.error("evaluate listings error:", resp.status);
    return [];
  }

  const data = await resp.json();
  const rawArgs = data?.choices?.[0]?.message?.function_call?.arguments ?? null;
  if (!rawArgs) return [];

  try {
    const parsed = JSON.parse(rawArgs);
    const evaluations: any[] = parsed.evaluations ?? [];

    return evaluations
      .filter((e) => typeof e.index === "number" && e.dealScore >= 55 && listings[e.index])
      .map((e) => {
        const listing = listings[e.index];
        const marketVal = Math.max(listing.price + 5, Number(e.marketValue) || listing.price * 1.5);
        const profitEstimate = Math.max(0, Math.round(marketVal * 0.85 - listing.price));
        return {
          id: `real-${Date.now()}-${e.index}`,
          title: listing.title,
          category: String(e.category ?? "Altro"),
          searchQuery: listing.title.split(" ").slice(0, 3).join(" ").toLowerCase(),
          buyMaxPrice: listing.price,
          sellEstimate: Math.round(marketVal),
          profitEstimate,
          whyUndervalued: String(e.whyUndervalued ?? ""),
          spotTip: String(e.spotTip ?? "Verifica condizioni prima di comprare"),
          marketContext: String(e.whereToResell ?? "Vinted, eBay"),
          saleSuccessProbability: Math.max(0, Math.min(100, Number(e.saleSuccessProbability) || 65)),
          searchUrl: listing.url,
          isReal: true as const,
          imageUrl: listing.imageUrl || undefined,
          directUrl: listing.url,
          dealScore: Math.min(100, Math.max(0, Number(e.dealScore))),
          verdict: String(e.verdict ?? "buon affare"),
        };
      })
      .sort((a, b) => (b.dealScore ?? 0) - (a.dealScore ?? 0))
      .slice(0, 5);
  } catch (e) {
    console.error("evaluate parse error:", e);
    return [];
  }
}

// ── AI-generated opportunities (fallback) ────────────────────────────────────

async function fetchAiOpportunities(tag: string, apiKey: string): Promise<ScoutResult[]> {
  const categoryContext = tag
    ? `Concentrati esclusivamente su: "${tag}". Genera 4-5 opportunità specifiche.`
    : "Scegli le migliori opportunità tra: abbigliamento vintage italiano/europeo, sneakers da collezione, accessori di lusso usati, vinili, workwear. Solo idee realistiche trovabili su Vinted Italia oggi.";

  const resp = await fetch(OPENAI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "Sei un reseller esperto con 10 anni di esperienza nei mercati secondhand europei. " +
            "Conosci i prezzi reali su Vinted Italia, eBay, Grailed nel 2024-2025. " +
            "Ogni opportunità deve essere azionabile con risultati realistici. " +
            "Profitto netto include commissioni (~15%) e spedizione (~5€). " +
            "Per saleSuccessProbability: sneakers Nike/Adidas = 80+, brand vintage riconoscibili = 70-80, vinili rari = 50-65. " +
            "Genera solo un JSON valido con suggest_opportunities.",
        },
        {
          role: "user",
          content:
            `${categoryContext}\n\n` +
            "searchQuery: formato Vinted Italia, breve, minuscolo. Prezzi in EUR interi. Descrizioni brevi e pratiche.",
        },
      ],
      functions: [SCOUT_TOOL.function],
      function_call: { name: "suggest_opportunities" },
      temperature: 0.85,
      max_tokens: 1400,
    }),
  });

  if (!resp.ok) return DEFAULT_OPPORTUNITIES;

  const data = await resp.json();
  const rawArgs = data?.choices?.[0]?.message?.function_call?.arguments ?? null;
  if (!rawArgs) return DEFAULT_OPPORTUNITIES;

  try {
    const parsed = JSON.parse(rawArgs);
    return (parsed.opportunities ?? DEFAULT_OPPORTUNITIES) as ScoutResult[];
  } catch {
    return DEFAULT_OPPORTUNITIES;
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = getApiKey();
    const body = await req.json();
    const tag = typeof body.tag === "string" ? body.tag.trim() : "";
    const maxPrice = typeof body.maxPrice === "number" && body.maxPrice > 0 ? body.maxPrice : 60;

    let realDeals: ScoutResult[] = [];
    let hasRealListings = false;

    // Only attempt scraping when a specific search term is provided
    if (tag) {
      try {
        const rawListings = await scrapeCatalogListings(tag, maxPrice);
        console.log(`Scraped ${rawListings.length} listings for "${tag}" ≤€${maxPrice}`);

        if (rawListings.length >= 4) {
          realDeals = await evaluateListings(rawListings, apiKey);
          hasRealListings = realDeals.length > 0;
        }
      } catch (e) {
        console.warn("Live scouting failed:", e instanceof Error ? e.message : e);
      }
    }

    // If we have enough real deals, return only those
    if (realDeals.length >= 2) {
      return new Response(
        JSON.stringify({
          opportunities: realDeals.map((d, i) => ({
            ...d,
            id: d.id ?? `real-${Date.now()}-${i}`,
            searchUrl: d.directUrl ?? d.searchUrl,
          })),
          hasRealListings: true,
          scrapedCount: realDeals.length,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Fallback: AI-generated opportunities
    const aiOpportunities = await fetchAiOpportunities(tag, apiKey);
    const result = aiOpportunities.slice(0, 5).map((opp, i) => ({
      id: `scout-${Date.now()}-${i}`,
      ...opp,
      saleSuccessProbability: Math.max(0, Math.min(100, Number(opp.saleSuccessProbability) || 65)),
      searchUrl: `https://www.vinted.it/catalog?search_text=${encodeURIComponent(opp.searchQuery)}&price_to=${opp.buyMaxPrice}&order=newest_first`,
    }));

    return new Response(
      JSON.stringify({
        opportunities: result,
        hasRealListings: false,
        scrapedCount: 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("scout-deals error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Errore sconosciuto" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
