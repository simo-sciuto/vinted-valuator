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
        visualAnalysis: {
          type: "string",
          description: "STEP 1: Descrivi minuziosamente cosa vedi nelle foto. Leggi ogni singola etichetta, logo, scritta o dettaglio del design PRIMA di identificare l'oggetto. Usa questo campo per ragionare ad alta voce.",
        },
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
            materials: {
              type: "array",
              items: { type: "string" },
              description: "Lista dei materiali riconosciuti o probabili (es. 'pelle', 'cotone', 'plastica', 'legno').",
            },
            style: {
              type: "string",
              description: "Stile o estetica dell'oggetto (es. 'Y2K', 'Streetwear', 'Mid-Century Modern', 'Boho').",
            },
            confidence: { type: "number", minimum: 0, maximum: 1, description: "Quanto sei sicuro dell'identificazione" },
          },
          required: ["name", "category", "brand", "artist", "era", "estimatedAge", "condition", "materials", "style", "confidence"],
          additionalProperties: false,
        },
        marketAnalysis: {
          type: "object",
          description: "Analisi di mercato e consigli pratici per la rivendita.",
          properties: {
            rareFactors: { type: "string", description: "Perché questo oggetto è ricercato o raro? Quali dettagli (colorway, anno) ne alzano il valore? Spiega bene." },
            targetAudience: { type: "string", description: "Chi è l'acquirente ideale per questo oggetto? Profilo dettagliato (es. 'Collezionisti di sneaker anni 90', 'Appassionati di design scandinavo')." },
            similarSoldPrice: { type: "string", description: "Prezzo storico o di riferimento a cui oggetti simili sono stati venduti (es. 'Venduto a 80€ su eBay US a Gennaio 2024')." },
            authenticityClues: { type: "string", description: "Dettagli chiave (legit check) per capire se questo specifico pezzo è originale (es. font dell'etichetta, tipo di zip YKK, cuciture)." },
            restorationTips: { type: "string", description: "Consigli dell'esperto su come pulire, smacchiare o presentare al meglio l'oggetto prima di fare le foto per Vinted." },
            stylingAdvice: { type: "string", description: "Come consiglieresti di abbinarlo o descriverlo nel titolo/testo di Vinted per attirare click (es. 'Perfetto per look Gorpcore / Y2K')." },
          },
          required: ["rareFactors", "targetAudience", "similarSoldPrice", "authenticityClues", "restorationTips", "stylingAdvice"],
          additionalProperties: false,
        },
        historicalContext: {
          type: "object",
          description: "Un'analisi storico-culturale molto approfondita e raffinata dell'oggetto. Le risposte devono essere paragrafi lunghi, descrittivi e affascinanti (minimo 150-200 parole per sezione).",
          properties: {
            brandHistory: { type: "string", description: "Una cronistoria ricca, esaustiva e dettagliata del brand o dell'artista. Menziona anni chiave, fondatori, evoluzione aziendale, aneddoti memorabili e la filosofia dietro la creazione. Scrivi molto." },
            culturalSignificance: { type: "string", description: "Il peso culturale di questo oggetto. Spiega in modo esteso come si inserisce nella storia della moda, del design o dell'arte, descrivi i movimenti sociali associati, icone di stile che l'hanno indossato e l'impatto duraturo." },
            manufacturingDetails: { type: "string", description: "Dettagli tecnici estremamente approfonditi sulla manifattura (es. tipologia di telaio, metodi di concia, tecniche di cucitura, origini dei materiali). Spiega in modo dettagliato perché l'ingegneria o l'artigianato dietro questo pezzo è superiore." },
            funFact: { type: "string", description: "Un aneddoto lungo, una controversia, un gossip storico, un retroscena di produzione o una curiosità pazzesca legata a questo specifico modello che un vero esperto del settore racconterebbe." },
          },
          required: ["brandHistory", "culturalSignificance", "manufacturingDetails", "funFact"],
          additionalProperties: false,
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
      required: ["visualAnalysis", "identification", "marketAnalysis", "historicalContext", "currentEstimate", "futureEstimate"],
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
          "Sei un perito di livello mondiale, storico del design e massimo esperto di mercato secondario (Vinted/Grailed). " +
          "ATTENZIONE: La precisione è vitale. Usa il campo 'visualAnalysis' per studiare attentamente le foto prima di azzardare un brand o un nome. " +
          "Leggi le etichette, scruta i loghi e confrontali mentalmente con il tuo database. Se non sei sicuro del brand, lascialo vuoto piuttosto che inventare. " +
          "La tua analisi deve essere un testo RICCO, VERBOSO e COLTO. Voglio paragrafi lunghi ed esaustivi, non singole frasi. " +
          "Analizza i materiali, spiega esattamente come capire se è originale (legit check), dai trucchi di restauro/lavaggio. " +
          "Sii precisissimo sui prezzi basandoti sullo storico di mercato europeo. " +
          "Rispondi in italiano con un tono sofisticato.",
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
        model: "gpt-4o",
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
