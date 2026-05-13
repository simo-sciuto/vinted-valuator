import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

declare const Deno: { env: { get(key: string): string | undefined } };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o-mini";

const LISTING_TOOL = {
  type: "function",
  function: {
    name: "submit_vinted_listing",
    description: "Restituisce un annuncio Vinted ottimizzato pronto da pubblicare.",
    parameters: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Titolo SEO ottimizzato per Vinted Europa, max 60 caratteri, include brand + tipo oggetto + caratteristica chiave.",
        },
        description: {
          type: "string",
          description: "Descrizione per Vinted: informale e umana, 4-7 frasi corte. Tono diretto, amichevole. In italiano.",
        },
        depopDescription: {
          type: "string",
          description: "Descrizione per Depop: molto aesthetic, focus su stile. Include 3-5 hashtag specifici alla fine. In italiano.",
        },
        ebayDescription: {
          type: "string",
          description: "Descrizione per eBay: professionale, tecnica, dettagliata su condizioni e spedizione. In italiano.",
        },
        hashtags: {
          type: "array",
          items: { type: "string" },
          description: "Hashtag senza #, tutto minuscolo, mix tra brand, stile, decennio, categoria.",
        },
        suggestedPrice: {
          type: "number",
          description: "Prezzo di vendita realistico in EUR per Vinted (70-85% del prezzo di mercato max).",
        },
        vintedCategory: {
          type: "string",
          description: "Categoria Vinted suggerita (es. 'Donna > Borse > A spalla').",
        },
        sellingTip: {
          type: "string",
          description: "Un consiglio breve per vendere meglio (1 frase).",
        },
      },
      required: ["title", "description", "depopDescription", "ebayDescription", "hashtags", "suggestedPrice", "vintedCategory", "sellingTip"],
    },
  },
};

interface AnalysisPayload {
  identification?: {
    name?: string;
    brand?: string;
    category?: string;
    era?: string;
    estimatedAge?: string;
    condition?: string;
    materials?: string[];
    style?: string;
  };
  marketAnalysis?: {
    rareFactors?: string;
    targetAudience?: string;
    authenticityClues?: string;
  };
  historicalContext?: { culturalSignificance?: string };
  currentEstimate?: { min?: number; max?: number };
}

interface ListingRequest {
  analysis: AnalysisPayload;
}

function getApiKey(): string {
  const key = Deno.env.get("OPENAI_API_KEY");
  if (!key) throw new Error("OPENAI_API_KEY non configurata");
  return key;
}

function normalizeCategory(category?: string): string {
  if (!category) return "Altro";
  const raw = category.toLowerCase();
  if (raw.includes("donna") || raw.includes("uomo") || raw.includes("abbigliamento") || raw.includes("borsa") || raw.includes("scarpe")) return "Donna > Abbigliamento > Tutto";
  if (raw.includes("borsa")) return "Donna > Borse > A spalla";
  if (raw.includes("scarpe") || raw.includes("sneaker")) return "Donna > Scarpe > Sneakers";
  if (raw.includes("gioiello") || raw.includes("collana") || raw.includes("orologio")) return "Donna > Accessori > Gioielli";
  if (raw.includes("vinile") || raw.includes("lp") || raw.includes("disco")) return "Donna > Musica > Vinili";
  return "Altro";
}

function buildAnalysisSummary(analysis: AnalysisPayload) {
  const id = analysis.identification ?? {};
  const mkt = analysis.marketAnalysis ?? {};
  const hist = analysis.historicalContext ?? {};
  const est = analysis.currentEstimate ?? {};

  return [
    `name: ${id.name ?? ""}`,
    `brand: ${id.brand ?? ""}`,
    `category: ${id.category ?? ""}`,
    `era: ${id.era ?? ""}`,
    `estimatedAge: ${id.estimatedAge ?? ""}`,
    `condition: ${id.condition ?? ""}`,
    `materials: ${Array.isArray(id.materials) ? id.materials.join(", ") : ""}`,
    `style: ${id.style ?? ""}`,
    `rareFactors: ${mkt.rareFactors ?? ""}`,
    `targetAudience: ${mkt.targetAudience ?? ""}`,
    `authenticityClues: ${mkt.authenticityClues ?? ""}`,
    `culturalSignificance: ${hist.culturalSignificance ?? ""}`,
    `priceMin: ${typeof est.min === "number" ? est.min : ""}`,
    `priceMax: ${typeof est.max === "number" ? est.max : ""}`,
  ]
    .filter(Boolean)
    .join("\\n");
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = getApiKey();
    const body = (await req.json()) as ListingRequest;
    if (!body.analysis) {
      return new Response(JSON.stringify({ error: "Analisi mancante" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const analysisStr = buildAnalysisSummary(body.analysis);
    const vintedCategory = normalizeCategory(body.analysis.identification?.category);
    const priceCalc = typeof body.analysis.currentEstimate?.max === "number"
      ? Math.round(body.analysis.currentEstimate.max * 0.8)
      : typeof body.analysis.currentEstimate?.min === "number"
      ? Math.round(body.analysis.currentEstimate.min * 1.2)
      : 20;

    const requestBody: any = {
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "Sei un copywriter esperto di marketplace secondhand italiani. " +
            "Crea un annuncio Vinted adatto a vendere entro 14 giorni. " +
            "Il titolo deve essere SEO-friendly, max 60 caratteri, con brand, oggetto e dettaglio unico. " +
            "La descrizione Vinted deve essere 4-6 frasi concise, oneste e orientate al lettore. " +
            "La descrizione Depop deve usare un tono aesthetic, includere 3-5 hashtag alla fine e un sentimento di scoperta vintage. " +
            "La descrizione eBay deve essere professionale, dettagliata, con condizioni e spedizione. " +
            "Gli hashtag devono essere specifici e minuscoli, non generici. " +
            "Il prezzo suggerito deve essere realistico e coerente con i valori dati; usa solo numeri interi. " +
            "Fornisci solo la risposta in JSON valido usando la funzione submit_vinted_listing. " +
            "Se il campo priceMax manca, usa priceMin * 1.2 per la stima. " +
            "Non includere unità di misura dentro i campi numerici; lascia le descrizioni libere. " +
            "Valuta la categoria Vinted proposta come: " + vintedCategory + ".",
        },
        {
          role: "user",
          content:
            "Analisi oggetto:\n" + analysisStr + "\n\n" +
            `priceMax: ${body.analysis.currentEstimate?.max ?? ""}` + "\n" +
            `priceMin: ${body.analysis.currentEstimate?.min ?? ""}` + "\n" +
            "Usa suggestedPrice basato su questi valori.",
        },
      ],
    };

    requestBody.functions = [LISTING_TOOL.function];
    requestBody.function_call = { name: "submit_vinted_listing" };
    requestBody.temperature = 0.35;
    requestBody.max_tokens = 1000;

    const aiResponse = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!aiResponse.ok) {
      const t = await aiResponse.text();
      console.error("listing error:", aiResponse.status, t);
      return new Response(JSON.stringify({ error: `Errore AI: ${aiResponse.status}` }), {
        status: aiResponse.status === 429 ? 429 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResponse.json();
    const rawArgs = data?.choices?.[0]?.message?.function_call?.arguments ?? null;
    let listing: any = null;

    if (rawArgs) {
      try {
        listing = JSON.parse(rawArgs);
      } catch (err) {
        console.warn("listing parse error", err, rawArgs);
      }
    }

    if (!listing) {
      const text = data.choices?.[0]?.message?.content ?? "";
      try {
        const parsed = JSON.parse(text);
        listing = parsed;
      } catch {
        // fallback
      }
    }

    if (!listing?.title || !listing?.description) {
      return new Response(JSON.stringify({ error: "Annuncio non generato in modo valido" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    listing.suggestedPrice = typeof listing.suggestedPrice === "number" ? listing.suggestedPrice : priceCalc;
    listing.vintedCategory = listing.vintedCategory || vintedCategory;
    listing.hashtags = Array.isArray(listing.hashtags) ? listing.hashtags.slice(0, 10) : [];

    return new Response(JSON.stringify({ listing }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-listing error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Errore sconosciuto" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
