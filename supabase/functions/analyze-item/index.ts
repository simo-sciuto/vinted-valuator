import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ANALYZE_TOOL = {
  type: "function",
  function: {
    name: "submit_item_analysis",
    description:
      "Restituisce l'analisi completa di un oggetto da rivendere su Vinted: identificazione, storia, stima attuale e proiezione futura.",
    parameters: {
      type: "object",
      properties: {
        identification: {
          type: "object",
          properties: {
            name: { type: "string", description: "Nome dell'oggetto, breve e specifico" },
            category: {
              type: "string",
              enum: ["abbigliamento", "vinile", "arte", "libro", "gioco", "collezionismo", "accessorio", "altro"],
            },
            brand: { type: "string", description: "Brand, marca o etichetta. Stringa vuota se sconosciuto." },
            artist: {
              type: "string",
              description:
                "Artista, autore o band se applicabile (vinili, quadri, illustrazioni, libri). Stringa vuota se non applicabile.",
            },
            era: { type: "string", description: "Decennio o periodo (es. 'anni 70', 'metà XX secolo')." },
            estimatedAge: { type: "string", description: "Età stimata in anni o range (es. '40-50 anni')." },
            condition: {
              type: "string",
              enum: ["nuovo con etichetta", "ottimo", "buono", "discreto", "da sistemare"],
            },
            confidence: { type: "number", minimum: 0, maximum: 1, description: "Quanto sei sicuro dell'identificazione" },
          },
          required: ["name", "category", "brand", "artist", "era", "estimatedAge", "condition", "confidence"],
          additionalProperties: false,
        },
        story: {
          type: "string",
          description:
            "Racconto coinvolgente di 3-5 frasi sulla storia del brand, dell'artista o del contesto culturale dell'oggetto. Tono caldo, da intenditore.",
        },
        currentEstimate: {
          type: "object",
          properties: {
            min: { type: "number", description: "Stima minima in EUR per la rivendita su mercato consumer" },
            max: { type: "number", description: "Stima massima in EUR" },
            reasoning: { type: "string", description: "Una frase su come hai stimato il prezzo" },
          },
          required: ["min", "max", "reasoning"],
          additionalProperties: false,
        },
        futureEstimate: {
          type: "object",
          properties: {
            year1: { type: "number", description: "Stima media in EUR tra 1 anno" },
            year3: { type: "number", description: "Stima media in EUR tra 3 anni" },
            year5: { type: "number", description: "Stima media in EUR tra 5 anni" },
            trend: {
              type: "string",
              enum: ["in forte crescita", "in crescita", "stabile", "in calo"],
            },
            note: { type: "string", description: "Una frase sul perché del trend." },
          },
          required: ["year1", "year3", "year5", "trend", "note"],
          additionalProperties: false,
        },
      },
      required: ["identification", "story", "currentEstimate", "futureEstimate"],
      additionalProperties: false,
    },
  },
} as const;

interface AnalyzeRequest {
  photoUrls: string[];
  purchasePrice?: number | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY non configurata");

    const body = (await req.json()) as AnalyzeRequest;
    if (!body.photoUrls?.length) {
      return new Response(JSON.stringify({ error: "Almeno una foto è richiesta" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (body.photoUrls.length > 5) {
      return new Response(JSON.stringify({ error: "Massimo 5 foto per analisi" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userContent: Array<Record<string, unknown>> = [
      {
        type: "text",
        text:
          "Analizza queste foto come un esperto di rivendita su Vinted e mercato dell'usato/vintage europeo. " +
          "Identifica con precisione l'oggetto, racconta la storia del brand o dell'artista se rilevante, " +
          "e fornisci stime di prezzo realistiche per il mercato europeo basate sulla tua conoscenza di " +
          "Vinted, eBay, Discogs, Catawiki e simili. Sii onesto sulla confidenza. Tutto in italiano.",
      },
      ...body.photoUrls.map((url) => ({ type: "image_url", image_url: { url } })),
    ];

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "system",
            content:
              "Sei un esperto perito di oggetti vintage, vinili, arte e abbigliamento di seconda mano. " +
              "Conosci bene il mercato europeo della rivendita (Vinted, eBay, Discogs, Catawiki). " +
              "Restituisci sempre stime in euro realistiche e prudenti, mai gonfiate. " +
              "Devi sempre chiamare la funzione submit_item_analysis con il risultato strutturato.",
          },
          { role: "user", content: userContent },
        ],
        tools: [ANALYZE_TOOL],
        tool_choice: { type: "function", function: { name: "submit_item_analysis" } },
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
          JSON.stringify({ error: "Crediti AI esauriti. Aggiungi credito al workspace Lovable." }),
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
      console.error("No tool call in response", JSON.stringify(data));
      return new Response(JSON.stringify({ error: "L'AI non ha restituito un risultato valido." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(toolCall.function.arguments);

    if (typeof body.purchasePrice === "number" && body.purchasePrice >= 0) {
      const avgNow = (result.currentEstimate.min + result.currentEstimate.max) / 2;
      result.profit = {
        purchasePrice: body.purchasePrice,
        currentProfit: Number((avgNow - body.purchasePrice).toFixed(2)),
        currentProfitPercent:
          body.purchasePrice > 0 ? Number((((avgNow - body.purchasePrice) / body.purchasePrice) * 100).toFixed(1)) : null,
        futureProfitYear5: Number((result.futureEstimate.year5 - body.purchasePrice).toFixed(2)),
      };
    }

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-item error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Errore sconosciuto" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
