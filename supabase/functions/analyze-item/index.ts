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
        pricePoints: {
          type: "array",
          description: "Estrai TUTTI i prezzi di vendita reali trovati nella ricerca di mercato fornita nel prompt. Includi anche prezzi attualmente in vendita se non hai dati di sold. Minimo 3 punti se disponibili.",
          items: {
            type: "object",
            properties: {
              source: { type: "string", description: "Piattaforma: ebay, vinted, depop, discogs, grailed, catawiki, altro" },
              price: { type: "number", description: "Prezzo in EUR (convertito se necessario)" },
              kind: { type: "string", enum: ["sold", "listed", "estimate"], description: "sold = realmente venduto (peso massimo), listed = attualmente in vendita, estimate = stima generica" },
              year: { type: "number", description: "Anno della vendita o annuncio (es. 2024, 2025)" },
              note: { type: "string", description: "Breve nota su condizione o variante" },
            },
            required: ["source", "price", "kind", "year"],
            additionalProperties: false,
          },
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
      required: ["visualAnalysis", "identification", "marketAnalysis", "historicalContext", "currentEstimate", "pricePoints", "futureEstimate"],
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

    // ============ STEP 1: identificazione + ricerca di mercato con web grounding ============
    const researchMessages = [
      {
        role: "system",
        content:
          "Sei un perito di mercato secondario (Vinted, eBay, Depop, Discogs, Grailed, Catawiki). " +
          "Hai accesso alla ricerca web tramite lo strumento google_search: USALO SEMPRE per verificare prezzi attuali e dettagli sull'oggetto in foto. " +
          "Cerca su eBay 'sold/venduti', Vinted Italia, Discogs marketplace, Grailed, Catawiki. " +
          "Scrivi in italiano. Restituisci un report di max 800 parole con: " +
          "1) identificazione precisa (brand, modello, anno), 2) 3-6 esempi di vendite recenti reali (piattaforma, prezzo €, anno), " +
          "3) range prezzo attuale onesto in EUR, 4) trend futuro 1/3/5 anni con motivazione, " +
          "5) elenco URL fonti consultate (una per riga, formato: URL | titolo breve).",
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Identifica questo oggetto e ricerca su web prezzi di vendita reali per la rivendita in Europa." },
          ...body.photoUrls.map((url) => ({ type: "image_url", image_url: { url } })),
        ],
      },
    ];

    let marketResearch = "";
    const sources: { title: string; url: string }[] = [];

    try {
      const researchResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
          messages: researchMessages,
          tools: [{ type: "google_search" }],
        }),
      });

      if (researchResp.ok) {
        const rData = await researchResp.json();
        marketResearch = rData.choices?.[0]?.message?.content ?? "";

        // estrai citazioni dai metadata grounding (Gemini)
        const grounding =
          rData.choices?.[0]?.message?.grounding_metadata ??
          rData.choices?.[0]?.grounding_metadata ??
          rData.choices?.[0]?.message?.citations;
        if (Array.isArray(grounding)) {
          for (const g of grounding) {
            if (g?.url) sources.push({ url: g.url, title: g.title ?? g.url });
          }
        } else if (grounding?.grounding_chunks) {
          for (const c of grounding.grounding_chunks) {
            const w = c?.web;
            if (w?.uri) sources.push({ url: w.uri, title: w.title ?? w.uri });
          }
        }

        // fallback: estrai URL dal testo (formato "URL | titolo")
        if (sources.length === 0 && marketResearch) {
          const urlRegex = /(https?:\/\/[^\s|)\]]+)\s*\|?\s*([^\n]*)/g;
          let m;
          while ((m = urlRegex.exec(marketResearch)) !== null && sources.length < 10) {
            const url = m[1].replace(/[.,;)]+$/, "");
            const title = (m[2] || "").trim().slice(0, 80) || new URL(url).hostname.replace("www.", "");
            if (!sources.some((s) => s.url === url)) sources.push({ url, title });
          }
        }
      } else {
        console.warn("Research step failed:", researchResp.status, await researchResp.text());
      }
    } catch (err) {
      console.warn("Research step error:", err);
    }

    // ============ STEP 2: analisi strutturata, calibrata sulla ricerca ============
    const userContent: Array<Record<string, unknown>> = [
      {
        type: "text",
        text:
          "Sei un perito di livello mondiale e storico del design. " +
          "Analizza le foto e produci una scheda strutturata RICCA e VERBOSA (paragrafi lunghi). " +
          "Sii preciso su legit check, materiali, restauro. Rispondi in italiano colto.\n\n" +
          (marketResearch
            ? "=== RICERCA DI MERCATO REALE (usala come fonte primaria per i prezzi) ===\n" + marketResearch
            : "(ricerca web non disponibile, usa la tua conoscenza)"),
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
              "Sei un perito di oggetti vintage, vinili, arte e abbigliamento di seconda mano. " +
              "Conosci il mercato europeo (Vinted, eBay, Discogs, Catawiki). " +
              "Le stime in EUR DEVONO essere coerenti con i prezzi reali forniti nel contesto di ricerca. " +
              "Chiama sempre submit_item_analysis con il risultato strutturato.",
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
    result.marketResearch = marketResearch || undefined;
    result.sources = sources.length > 0 ? sources : undefined;

    // ============ CALIBRAZIONE: media ponderata + scarti + confidenza ============
    const points: Array<{ source: string; price: number; kind: string; year: number; weight: number }> = [];
    const currentYear = new Date().getFullYear();
    const kindWeight: Record<string, number> = { sold: 1.0, listed: 0.6, estimate: 0.3 };
    const sourceWeight: Record<string, number> = {
      ebay: 1.0, discogs: 1.0, catawiki: 0.95, grailed: 0.9, vinted: 0.8, depop: 0.75, altro: 0.5,
    };

    if (Array.isArray(result.pricePoints)) {
      for (const p of result.pricePoints) {
        if (typeof p.price !== "number" || p.price <= 0 || p.price > 1_000_000) continue;
        const ageYears = Math.max(0, currentYear - (p.year ?? currentYear));
        const recency = Math.exp(-ageYears / 2); // decadimento esponenziale, half-life ~1.4 anni
        const ks = String(p.kind || "").toLowerCase();
        const ss = String(p.source || "").toLowerCase();
        const w = (kindWeight[ks] ?? 0.4) * (sourceWeight[ss] ?? 0.5) * recency;
        points.push({ ...p, weight: w });
      }
    }

    if (points.length >= 2) {
      // rimuovi outlier estremi tramite IQR
      const sorted = [...points].sort((a, b) => a.price - b.price);
      const q = (p: number) => sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))].price;
      const q1 = q(0.25), q3 = q(0.75);
      const iqr = q3 - q1;
      const lo = q1 - 1.5 * iqr;
      const hi = q3 + 1.5 * iqr;
      const filtered = sorted.filter((p) => p.price >= lo && p.price <= hi);
      const used = filtered.length >= 2 ? filtered : sorted;

      const totW = used.reduce((s, p) => s + p.weight, 0) || 1;
      const wMean = used.reduce((s, p) => s + p.price * p.weight, 0) / totW;
      const wVar = used.reduce((s, p) => s + p.weight * (p.price - wMean) ** 2, 0) / totW;
      const wStd = Math.sqrt(wVar);
      const cv = wMean > 0 ? wStd / wMean : 1; // coefficiente di variazione

      // confidenza: più punti + meno dispersione = più alta
      const nFactor = Math.min(1, used.length / 6);
      const dispFactor = Math.max(0, 1 - Math.min(cv, 1));
      const soldRatio = used.filter((p) => p.kind === "sold").length / used.length;
      const confidence = Number((0.35 * nFactor + 0.45 * dispFactor + 0.20 * soldRatio).toFixed(2));
      const level = confidence >= 0.7 ? "alta" : confidence >= 0.45 ? "media" : "bassa";

      // fascia calibrata = media ± 1σ (clampata >0)
      const calMin = Math.max(1, Math.round(wMean - wStd));
      const calMax = Math.max(calMin + 1, Math.round(wMean + wStd));

      // miscela con la stima AI (70% calibrata se >=3 punti, altrimenti 50/50)
      const blend = used.length >= 3 ? 0.7 : 0.5;
      const aiMin = result.currentEstimate.min;
      const aiMax = result.currentEstimate.max;
      const finalMin = Math.round(calMin * blend + aiMin * (1 - blend));
      const finalMax = Math.round(calMax * blend + aiMax * (1 - blend));

      result.priceCalibration = {
        weightedAverage: Number(wMean.toFixed(2)),
        stdDeviation: Number(wStd.toFixed(2)),
        coefficientOfVariation: Number(cv.toFixed(3)),
        sampleSize: used.length,
        outliersRemoved: points.length - used.length,
        confidence,
        level,
        aiOriginal: { min: aiMin, max: aiMax },
      };
      result.currentEstimate = {
        min: finalMin,
        max: finalMax,
        reasoning: `Media ponderata €${wMean.toFixed(0)} su ${used.length} fonti reali (σ €${wStd.toFixed(0)}, confidenza ${level}). ${result.currentEstimate.reasoning}`,
      };
    } else {
      result.priceCalibration = {
        weightedAverage: null,
        sampleSize: points.length,
        confidence: 0.3,
        level: "bassa",
        note: "Pochi dati di mercato reali, stima basata principalmente su conoscenza AI.",
        aiOriginal: { min: result.currentEstimate.min, max: result.currentEstimate.max },
      };
    }

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
