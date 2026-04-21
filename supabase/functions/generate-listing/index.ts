import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
          description:
            "Titolo SEO ottimizzato per Vinted Europa, max 60 caratteri, include brand + tipo oggetto + caratteristica chiave + parola vintage/originale se rilevante.",
        },
        description: {
          type: "string",
          description:
            "Descrizione informale e umana, 4-7 frasi corte. Tono diretto, amichevole, da reseller. Include condizioni, dimensioni se rilevanti, dettagli che fanno innamorare. Niente emoji esagerate. In italiano.",
        },
        hashtags: {
          type: "array",
          items: { type: "string" },
          minItems: 5,
          maxItems: 10,
          description: "Hashtag senza '#', tutto minuscolo, mix tra brand, stile, decennio, categoria.",
        },
        suggestedPrice: {
          type: "number",
          description:
            "Prezzo di vendita realistico in EUR per Vinted (di solito 70-85% del prezzo di mercato max), considera il tasso di commissione utente.",
        },
        vintedCategory: {
          type: "string",
          description:
            "Categoria Vinted suggerita (es. 'Donna > Borse > A spalla', 'Casa > Decorazione > Stampe e poster', 'Intrattenimento > Musica > Vinili').",
        },
        sellingTip: {
          type: "string",
          description: "Un consiglio breve per vendere meglio (1 frase).",
        },
      },
      required: ["title", "description", "hashtags", "suggestedPrice", "vintedCategory", "sellingTip"],
      additionalProperties: false,
    },
  },
} as const;

interface ListingRequest {
  analysis: unknown;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY non configurata");

    const body = (await req.json()) as ListingRequest;
    if (!body.analysis) {
      return new Response(JSON.stringify({ error: "Analisi mancante" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "Sei un copywriter esperto di marketplace di seconda mano in Europa, in particolare Vinted. " +
              "Scrivi annunci che convertono: titoli ottimizzati per la ricerca, descrizioni umane e oneste, " +
              "prezzi realistici. Tutto in italiano, tono amichevole ma diretto.",
          },
          {
            role: "user",
            content:
              "Crea un annuncio Vinted partendo da questa analisi dell'oggetto:\n\n" +
              JSON.stringify(body.analysis, null, 2),
          },
        ],
        tools: [LISTING_TOOL],
        tool_choice: { type: "function", function: { name: "submit_vinted_listing" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Troppe richieste, riprova tra qualche istante." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crediti AI esauriti." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, t);
      return new Response(JSON.stringify({ error: "Errore AI" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResponse.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("No tool call", JSON.stringify(data));
      return new Response(JSON.stringify({ error: "Annuncio non generato." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const listing = JSON.parse(toolCall.function.arguments);
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
