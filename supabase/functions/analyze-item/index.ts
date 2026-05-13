import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

declare const Deno: { env: { get(key: string): string | undefined } };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const VISION_MODEL = "gpt-4o-mini";
const TEXT_MODEL = "gpt-4o-mini";

const ANALYZE_TOOL = {
  type: "function",
  function: {
    name: "submit_item_analysis",
    description: "Restituisce l'analisi completa di un oggetto da rivendere su Vinted.",
    parameters: {
      type: "object",
      properties: {
        visualAnalysis: { type: "string", description: "Descrizione dettagliata di tutto ciò che vedi nelle foto." },
        identification: {
          type: "object",
          properties: {
            name: { type: "string" },
            category: { type: "string", description: "Una di: abbigliamento, vinile, arte, libro, gioco, collezionismo, accessorio, altro" },
            brand: { type: "string" },
            artist: { type: "string" },
            era: { type: "string" },
            estimatedAge: { type: "string" },
            condition: { type: "string", description: "Una di: nuovo con etichetta, ottimo, buono, discreto, da sistemare" },
            materials: { type: "array", items: { type: "string" } },
            style: { type: "string" },
            confidence: { type: "number", minimum: 0, maximum: 1 },
          },
          required: ["name", "category", "brand", "artist", "era", "estimatedAge", "condition", "materials", "style", "confidence"],
        },
        marketAnalysis: {
          type: "object",
          properties: {
            rareFactors: { type: "string" },
            targetAudience: { type: "string" },
            similarSoldPrice: { type: "string" },
            authenticityClues: { type: "string" },
            restorationTips: { type: "string" },
            stylingAdvice: { type: "string" },
            negotiationScript: { type: "string", description: "Script di 2-3 frasi in italiano da inviare al venditore per trattare il prezzo. Tono amichevole, cita difetti specifici o prezzi di mercato. Es: 'Ciao! Ho visto l'annuncio, interessante. Ho notato [difetto]. Sui siti come eBay e Vinted questo modello si trova intorno a €X. Potresti scendere a €Y?'" },
            listingKeywords: { type: "array", items: { type: "string" }, description: "10-14 parole chiave ad alta ricerca da mettere nel titolo/descrizione Vinted. Include: brand esatto, modello, anno/era, taglia/misura, colore, stile, materiale. Tutto minuscolo." },
          },
          required: ["rareFactors", "targetAudience", "similarSoldPrice", "authenticityClues", "restorationTips", "stylingAdvice", "negotiationScript", "listingKeywords"],
        },
        historicalContext: {
          type: "object",
          properties: {
            brandHistory: { type: "string", description: "Storia del brand/artista/manifattura. Usa la tua conoscenza: anno di fondazione, fondatore, heritage, evoluzione. NON scrivere 'non specificato' — fornisci sempre informazioni reali." },
            culturalSignificance: { type: "string", description: "Importanza culturale, icone che hanno indossato/usato questo prodotto, momenti storici o sottoculture legate al brand/oggetto. Sii specifico." },
            manufacturingDetails: { type: "string", description: "Dettagli di produzione: paese, materiali tipici, tecniche artigianali, eventuali cambiamenti nel tempo. Usa la tua conoscenza." },
            funFact: { type: "string", description: "Fatto curioso, aneddoto, collaborazione famosa, o informazione sorprendente sul brand/oggetto. Deve essere interessante e specifico." },
          },
          required: ["brandHistory", "culturalSignificance", "manufacturingDetails", "funFact"],
        },
        currentEstimate: {
          type: "object",
          properties: {
            min: { type: "number" },
            max: { type: "number" },
            reasoning: { type: "string" },
          },
          required: ["min", "max", "reasoning"],
        },
        pricePoints: {
          type: "array",
          items: {
            type: "object",
            properties: {
              source: { type: "string" },
              price: { type: "number" },
              kind: { type: "string", description: "Una di: sold, listed, estimate" },
              year: { type: "number" },
              note: { type: "string" },
            },
            required: ["source", "price", "kind", "year"],
          },
        },
        futureEstimate: {
          type: "object",
          properties: {
            year1: { type: "number" },
            year3: { type: "number" },
            year5: { type: "number" },
            trend: { type: "string", description: "Una di: in forte crescita, in crescita, stabile, in calo" },
            note: { type: "string" },
          },
          required: ["year1", "year3", "year5", "trend", "note"],
        },
        saleSuccessProbability: {
          type: "object",
          properties: {
            score: { type: "number", description: "Probabilità di vendita su Vinted Italia entro 30 giorni, 0-100. Considera domanda, condizione, brand, prezzo, categoria." },
            label: { type: "string", description: "Una di: molto alta, alta, media, bassa, molto bassa" },
            timeToSell: { type: "number", description: "Giorni medi stimati per vendere al prezzo di mercato consigliato" },
            factors: { type: "array", items: { type: "string" }, description: "3-5 fattori chiave che influenzano la vendibilità (positivi e negativi)" },
          },
          required: ["score", "label", "timeToSell", "factors"],
        },
        platformPrices: {
          type: "object",
          properties: {
            vinted: { type: "number", description: "Prezzo realistico in EUR su Vinted Italia (commissioni ~8%, audience italiana)" },
            ebay: { type: "number", description: "Prezzo realistico in EUR su eBay Italia/Europa (commissioni ~12%, collezionisti europei)" },
            depop: { type: "number", description: "Prezzo realistico in EUR su Depop (commissioni ~10%, forte per streetwear e vintage aesthetics)" },
            bestPlatform: { type: "string", description: "Piattaforma con maggiore potenziale: Vinted, eBay o Depop" },
            reasoning: { type: "string", description: "Motivo breve del perché quella piattaforma massimizza il guadagno" },
          },
          required: ["vinted", "ebay", "depop", "bestPlatform", "reasoning"],
        },
        bestPostingTime: {
          type: "object",
          properties: {
            days: { type: "array", items: { type: "string" }, description: "Giorni della settimana ottimali per pubblicare (es. ['giovedì', 'domenica']). Basati sulla categoria: abbigliamento e sneakers → giovedì/venerdì/domenica sera; vinile e collezionismo → domenica mattina; borse lusso → martedì/mercoledì." },
            timeSlot: { type: "string", description: "Fascia oraria consigliata in formato 'HH:MM – HH:MM'. Es: '19:00 – 21:30'. Per la maggior parte delle categorie le ore serali italiane sono le più trafficate su Vinted." },
            reasoning: { type: "string", description: "Spiegazione breve (1-2 frasi) del perché quei giorni/orari funzionano per questa categoria e questo pubblico specifico." },
            tip: { type: "string", description: "Un consiglio pratico aggiuntivo per massimizzare la visibilità al momento della pubblicazione. Es: rispondere ai primi messaggi entro 30 minuti, aggiungere video, fare un piccolo sconto all'uscita." },
          },
          required: ["days", "timeSlot", "reasoning", "tip"],
        },
      },
      required: ["visualAnalysis", "identification", "marketAnalysis", "historicalContext", "currentEstimate", "pricePoints", "futureEstimate", "saleSuccessProbability", "platformPrices", "bestPostingTime"],
    },
  },
};

interface AnalyzeRequest {
  photoUrls: string[];
  purchasePrice?: number | null;
}

function getApiKey(): string {
  const key = Deno.env.get("OPENAI_API_KEY");
  if (!key) throw new Error("OPENAI_API_KEY non configurata");
  return key;
}

async function sendAiRequest(apiKey: string, url: string, body: unknown, retries = 2): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const resp = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (resp.ok || attempt === retries) return resp;
    if (resp.status === 429) {
      const retryAfter = Number(resp.headers.get("retry-after") ?? 0);
      await new Promise((resolve) => setTimeout(resolve, (retryAfter || (attempt + 1) * 3) * 1000));
    } else {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }
  return fetch(url);
}

function normalize(val: string, map: Record<string, string>, validValues: string[], fallback: string): string {
  const raw = String(val ?? "").toLowerCase().trim();
  if (!raw) return fallback;
  if (validValues.includes(raw)) return raw;
  for (const [k, v] of Object.entries(map)) {
    if (raw.includes(k)) return v;
  }
  return fallback;
}

function normalizeNumber(value: unknown, fallback: number) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function parseFunctionArguments(data: any): string | null {
  return data?.choices?.[0]?.message?.function_call?.arguments ?? null;
}

function getCategoryInstructions(visualDesc: string): string {
  const d = visualDesc.toLowerCase();
  if (d.includes("scarpe") || d.includes("sneaker") || d.includes("nike") || d.includes("adidas") || d.includes("jordan") || d.includes("yeezy") || d.includes("new balance")) {
    return "CATEGORIA SNEAKERS — cita taglia esatta, colorway preciso (nome ufficiale), anno da pull-tab/heel tab, stato air bubble/suola/midsole separatamente, codice SKU/stile se visibile. PricePoints da StockX sold, eBay US completed, Vinted IT. listingKeywords: includi modello, colorway, anno, taglia, condizione.";
  }
  if (d.includes("vinile") || d.includes("lp ") || d.includes("disco") || d.includes("copertina") || d.includes("33 giri") || d.includes("album")) {
    return "CATEGORIA VINILE — valuta VG/VG+/EX/NM per vinile E copertina separatamente. Identifica se è stampa originale o ristampa (leggi la matrice deadwax se visibile). PricePoints da Discogs sold, mercati locali. Nella stima considera fortemente lo stato del vinile. listingKeywords: artista, titolo album, anno, etichetta, paese di stampa.";
  }
  if (d.includes("borsa") || d.includes("bag") || d.includes("louis vuitton") || d.includes("gucci") || d.includes("prada") || d.includes("chanel") || d.includes("hermes") || d.includes("bottega")) {
    return "CATEGORIA BORSA LUSSO — verifica materiale (vera pelle vs sintetico, tipo pelle), hardware (colore, stato), datecode/seriale se visibile, presenza di dustbag/scatola/certificato. PricePoints da Vestiaire Collective sold, eBay IT/FR completati, Vinted IT. listingKeywords: brand, modello esatto, colore, hardware, dimensione, anno (se noto).";
  }
  if (d.includes("giacca") || d.includes("maglione") || d.includes("felpa") || d.includes("jeans") || d.includes("camicia") || d.includes("cappotto") || d.includes("abbigliamento") || d.includes("vestito")) {
    return "CATEGORIA ABBIGLIAMENTO — cita country of origin dall'etichetta, composizione tessuto (% cotone/lana/etc.), misure reali (spalle, petto, vita, lunghezza) oltre alla taglia etichetta, difetti localizzati (dove esattamente). PricePoints da Vinted IT/DE/FR sold, eBay IT sold. listingKeywords: brand, modello/linea, taglia, colore, materiale, paese produzione, anno se rilevante.";
  }
  if (d.includes("collezionismo") || d.includes("vintage") || d.includes("action figure") || d.includes("carta") || d.includes("pokemon") || d.includes("lego")) {
    return "CATEGORIA COLLEZIONISMO — verifica complete vs. pezzi mancanti, packaging originale, data di produzione, varianti rare. PricePoints da eBay sold (filtro completati), mercati specializzati. listingKeywords: brand/IP, set/modello, anno, condizione, completo/scatola originale.";
  }
  return "";
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = getApiKey();
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

    const imageContent = body.photoUrls.map((url) => ({
      type: "image_url",
      image_url: { url },
    }));

    const visionRequestBody = {
      model: VISION_MODEL,
      messages: [
        {
          role: "system",
          content:
            "Sei un autenticatore e perito visivo professionale per il mercato secondhand europeo. " +
            "La tua analisi deve essere tecnica, precisa e basata solo su ciò che vedi. " +
            "Rispondi con un sommario strutturato contenente le sezioni: IDENTIFICAZIONE, MATERIALI, CONDIZIONE DETTAGLIATA, AUTENTICITÀ, EPOCA/PRODUZIONE, ELEMENTI RARI O SPECIALI.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Analizza queste foto con precisione da perito. Trascrivi testo, loghi, materiali e difetti visibili." },
            ...imageContent,
          ],
        },
      ],
      temperature: 0.05,
      max_tokens: 2200,
    };

    const visionResp = await sendAiRequest(apiKey, OPENAI_URL, visionRequestBody);

    if (!visionResp.ok) {
      const text = await visionResp.text();
      let detail = text;
      try { detail = JSON.parse(text)?.error?.message ?? text; } catch { /* */ }
      console.error("vision error:", visionResp.status, detail);
      return new Response(JSON.stringify({ error: `Errore AI: ${detail}` }), {
        status: visionResp.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const visionData = await visionResp.json();
    const rawDescription = visionData.choices?.[0]?.message?.content ?? "";
    if (!rawDescription) {
      return new Response(JSON.stringify({ error: "Il modello visivo non ha restituito una descrizione." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const visualDescription = rawDescription.length > 3500
      ? rawDescription.slice(0, 3500) + "\n[descrizione troncata per limiti di lunghezza]"
      : rawDescription;

    const analysisRequestBody = {
      model: TEXT_MODEL,
      messages: [
        {
          role: "system",
          content:
            "Sei un valutatore secondhand esperto per il mercato europeo. " +
            "Valuta ogni oggetto come se dovessi rivenderlo su Vinted.it entro 30 giorni. " +
            "Le tue stime devono essere conservative, realistiche e ancorate a vendite effettive. " +
            "Per saleSuccessProbability: considera domanda attuale, condizione, brand awareness, competitività del prezzo, categoria su Vinted Italia. Sneakers e abbigliamento brand vendono in <14 giorni = alta. Vinili rari e oggetti di nicchia = media/bassa. " +
            "Per platformPrices: eBay raggiunge collezionisti europei e vale di più per vintage raro; Depop è ideale per streetwear/aesthetic anni '80-'90; Vinted è il più liquido per moda quotidiana e abbigliamento. Considera le commissioni nel prezzo netto. " +
            "Per bestPostingTime: basati sui pattern reali di traffico Vinted Italia. Gli orari di punta sono 19:00-22:00 nei giorni feriali e 10:00-13:00 la domenica. Abbigliamento: giovedì/venerdì/domenica sera. Sneakers: domenica pomeriggio + giovedì sera. Vinile/collezionismo: domenica mattina. Borse lusso: martedì/mercoledì sera. Adatta sempre alla categoria identificata. Il tip deve essere azionabile e specifico (non generico). " +
            "Rispondi esclusivamente con la chiamata di funzione submit_item_analysis e non con un testo libero extra.",
        },
        {
          role: "user",
          content:
            "Ecco la descrizione visiva risultante dall'analisi delle foto:\n" +
            visualDescription + "\n\n" +
            "Istruzioni importanti:\n" +
            "- currentEstimate è il prezzo realistico di vendita su Vinted in 30 giorni.\n" +
            "- Includi almeno 4 pricePoints, con almeno 2 sold da Vinted o mercati italiani/europei.\n" +
            "- Se citi eBay internazionale o Grailed, flagga quelle voci come listed.\n" +
            "- Non usare prezzi retail, outlet o stock.\n" +
            "- Usa i termini di categoria italiani richiesti.\n" +
            "- Per historicalContext, usa la tua conoscenza enciclopedica del brand.\n" +
            "- Non scrivere mai 'non specificato', 'non disponibile', 'sconosciuto' o simili.\n" +
            "- negotiationScript: scrivi in italiano, cita almeno un difetto visibile o dato di mercato reale.\n" +
            "- listingKeywords: solo parole che gli acquirenti cercano davvero su Vinted, no frasi generiche.\n" +
            (getCategoryInstructions(visualDescription) ? `\nISTRUZIONI CATEGORIA:\n${getCategoryInstructions(visualDescription)}\n` : ""),
        },
      ],
      functions: [ANALYZE_TOOL.function],
      function_call: { name: "submit_item_analysis" },
      temperature: 0.12,
      max_tokens: 3200,
    };

    const analysisResp = await sendAiRequest(apiKey, OPENAI_URL, analysisRequestBody);

    if (!analysisResp.ok) {
      if (analysisResp.status === 429) {
        return new Response(JSON.stringify({ error: "Troppe richieste, riprova tra qualche istante." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await analysisResp.text();
      let detail = "";
      try { detail = JSON.parse(text)?.error?.message ?? text; } catch { detail = text; }
      console.error("analysis error:", analysisResp.status, detail);
      return new Response(JSON.stringify({ error: `Errore AI (analisi): ${detail || analysisResp.status}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const analysisData = await analysisResp.json();
    const rawArguments = parseFunctionArguments(analysisData);
    if (!rawArguments) {
      console.error("No function call in response", JSON.stringify(analysisData));
      return new Response(JSON.stringify({ error: "L'AI non ha restituito un risultato valido." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(rawArguments);
    result.visualAnalysis = result.visualAnalysis || visualDescription;

    const PLACEHOLDER_RE = /^(non\s+specificat|non\s+disponibil|non\s+identificabil|sconosciut|n\/a|unknown|not\s+specified)/i;
    const HISTORY_FALLBACKS: Record<string, string> = {
      brandHistory: "Informazioni storiche non disponibili per questo brand.",
      culturalSignificance: "Oggetto rappresentativo della sua categoria merceologica.",
      manufacturingDetails: "Dettagli di produzione non determinabili dalle foto fornite.",
      funFact: "Conserva scontrino o documenti originali: aumentano sensibilmente il valore di rivendita.",
    };
    if (result.historicalContext) {
      for (const key of Object.keys(HISTORY_FALLBACKS)) {
        const val = String(result.historicalContext[key] ?? "");
        if (!val || PLACEHOLDER_RE.test(val.trim())) {
          result.historicalContext[key] = HISTORY_FALLBACKS[key as keyof typeof HISTORY_FALLBACKS];
        }
      }
    }

    const CONDITION_MAP: Record<string, string> = {
      "nuovo": "nuovo con etichetta", "new": "nuovo con etichetta", "deadstock": "nuovo con etichetta",
      "ottimo": "ottimo", "mint": "ottimo", "eccellente": "ottimo",
      "buono": "buono", "good": "buono",
      "discreto": "discreto", "fair": "discreto", "used": "discreto",
      "da sistemare": "da sistemare", "poor": "da sistemare", "worn": "da sistemare",
    };
    const CATEGORY_MAP: Record<string, string> = {
      "vestiti": "abbigliamento", "clothing": "abbigliamento", "fashion": "abbigliamento",
      "record": "vinile", "vinyl": "vinile", "lp": "vinile",
      "art": "arte", "artwork": "arte",
      "book": "libro", "libri": "libro",
      "game": "gioco", "games": "gioco", "giochi": "gioco",
      "collectible": "collezionismo", "collector": "collezionismo",
      "bag": "accessorio", "shoes": "accessorio", "scarpe": "accessorio", "borsa": "accessorio",
    };
    const TREND_MAP: Record<string, string> = {
      "crescita forte": "in forte crescita", "forte crescita": "in forte crescita", "strong growth": "in forte crescita",
      "crescita": "in crescita", "growing": "in crescita", "growth": "in crescita",
      "stable": "stabile", "flat": "stabile",
      "declining": "in calo", "calo": "in calo", "down": "in calo",
    };
    const KIND_MAP: Record<string, string> = {
      "venduto": "sold", "sold listing": "sold", "completed": "sold",
      "listato": "listed", "listing": "listed", "active": "listed",
      "stima": "estimate", "estimated": "estimate",
    };

    const validConditions = ["nuovo con etichetta", "ottimo", "buono", "discreto", "da sistemare"];
    const validCategories = ["abbigliamento", "vinile", "arte", "libro", "gioco", "collezionismo", "accessorio", "altro"];
    const validTrends = ["in forte crescita", "in crescita", "stabile", "in calo"];
    const validKinds = ["sold", "listed", "estimate"];

    if (result.identification) {
      result.identification.condition = normalize(result.identification.condition ?? "", CONDITION_MAP, validConditions, "buono");
      result.identification.category = normalize(result.identification.category ?? "", CATEGORY_MAP, validCategories, "altro");
      result.identification.brand = String(result.identification.brand ?? "").trim();
      result.identification.name = String(result.identification.name ?? "").trim();
      result.identification.materials = Array.isArray(result.identification.materials)
        ? result.identification.materials.map((m: unknown) => String(m ?? "").trim()).filter(Boolean)
        : [];
      if (!result.identification.materials.length) result.identification.materials = ["materiale non specificato"];
    }
    if (result.futureEstimate) {
      result.futureEstimate.trend = normalize(result.futureEstimate.trend ?? "", TREND_MAP, validTrends, "stabile");
    }
    if (Array.isArray(result.pricePoints)) {
      result.pricePoints = result.pricePoints.map((p: Record<string, unknown>) => ({
        ...p,
        kind: normalize(String(p.kind ?? ""), KIND_MAP, validKinds, "estimate"),
      }));
    }

    const SALE_LABEL_MAP: Record<string, string> = {
      "molto alta": "molto alta", "very high": "molto alta", "altissima": "molto alta",
      "alta": "alta", "high": "alta",
      "media": "media", "medium": "media", "moderata": "media",
      "bassa": "bassa", "low": "bassa",
      "molto bassa": "molto bassa", "very low": "molto bassa", "bassissima": "molto bassa",
    };
    const validSaleLabels = ["molto alta", "alta", "media", "bassa", "molto bassa"];
    if (result.saleSuccessProbability) {
      result.saleSuccessProbability.score = Math.max(0, Math.min(100, Number(result.saleSuccessProbability.score) || 50));
      result.saleSuccessProbability.label = normalize(result.saleSuccessProbability.label ?? "", SALE_LABEL_MAP, validSaleLabels, "media");
      result.saleSuccessProbability.timeToSell = Math.max(1, Number(result.saleSuccessProbability.timeToSell) || 21);
      result.saleSuccessProbability.factors = Array.isArray(result.saleSuccessProbability.factors)
        ? result.saleSuccessProbability.factors.slice(0, 5)
        : [];
    }
    if (result.platformPrices) {
      const pp = result.platformPrices;
      pp.vinted = normalizeNumber(pp.vinted, 0);
      pp.ebay = normalizeNumber(pp.ebay, 0);
      pp.depop = normalizeNumber(pp.depop, 0);
      pp.bestPlatform = String(pp.bestPlatform ?? "Vinted").trim();
    }

    const points: Array<{ source: string; price: number; kind: string; year: number; weight: number }> = [];
    const currentYear = new Date().getFullYear();
    const kindWeight: Record<string, number> = { sold: 1.0, listed: 0.5, estimate: 0.2 };
    const sourceWeight: Record<string, number> = {
      vinted: 1.0, subito: 1.0, ebay: 0.85, depop: 0.8, grailed: 0.7, discogs: 0.8, altro: 0.5,
    };

    if (Array.isArray(result.pricePoints)) {
      for (const p of result.pricePoints) {
        if (typeof p.price !== "number" || p.price <= 0 || p.price > 100000) continue;
        const year = Number(p.year) || currentYear;
        const age = Math.max(0, currentYear - year);
        const recency = Math.exp(-age / 2);
        const srcKey = String(p.source || "").toLowerCase();
        const sourceFactor = Object.entries(sourceWeight).find(([key]) => srcKey.includes(key))?.[1] ?? 0.5;
        const weight = (kindWeight[p.kind] ?? 0.3) * sourceFactor * recency;
        points.push({ ...p, year, weight });
      }
    }

    if (points.length >= 2) {
      const sorted = [...points].sort((a, b) => a.price - b.price);
      const q1 = sorted[Math.floor((sorted.length - 1) * 0.25)].price;
      const q3 = sorted[Math.floor((sorted.length - 1) * 0.75)].price;
      const iqr = q3 - q1;
      const filtered = sorted.filter((p) => p.price >= q1 - 1.5 * iqr && p.price <= q3 + 1.5 * iqr);
      const used = filtered.length >= 2 ? filtered : sorted;
      const totalWeight = used.reduce((sum, p) => sum + p.weight, 0) || 1;
      const weightedAverage = used.reduce((sum, p) => sum + p.price * p.weight, 0) / totalWeight;
      const variance = used.reduce((sum, p) => sum + p.weight * (p.price - weightedAverage) ** 2, 0) / totalWeight;
      const stdDev = Math.sqrt(variance);
      const soldRatio = used.filter((p) => p.kind === "sold").length / used.length;
      const confidence = Number(
        (
          Math.min(1, used.length / 6) * 0.4 +
          Math.min(1, 1 / (stdDev / (weightedAverage || 1))) * 0.4 +
          soldRatio * 0.2
        ).toFixed(2),
      );
      const level = confidence >= 0.7 ? "alta" : confidence >= 0.45 ? "media" : "bassa";
      const calMin = Math.max(1, Math.round(weightedAverage - stdDev));
      const calMax = Math.max(calMin + 1, Math.round(weightedAverage + stdDev));
      const blend = used.length >= 3 ? 0.7 : 0.5;
      const aiMin = normalizeNumber(result.currentEstimate?.min, 0);
      const aiMax = normalizeNumber(result.currentEstimate?.max, 0);

      result.priceCalibration = {
        weightedAverage: Number(weightedAverage.toFixed(2)),
        stdDeviation: Number(stdDev.toFixed(2)),
        coefficientOfVariation: Number((stdDev / (weightedAverage || 1)).toFixed(3)),
        sampleSize: used.length,
        outliersRemoved: points.length - used.length,
        confidence,
        level,
        aiOriginal: { min: aiMin, max: aiMax },
      };
      result.currentEstimate = {
        min: Math.round(calMin * blend + aiMin * (1 - blend)),
        max: Math.round(calMax * blend + aiMax * (1 - blend)),
        reasoning: `Media ponderata €${weightedAverage.toFixed(0)} su ${used.length} fonti (σ €${stdDev.toFixed(0)}, confidenza ${level}). ${String(result.currentEstimate?.reasoning ?? "").trim()}`,
      };
    } else {
      result.priceCalibration = {
        weightedAverage: null,
        sampleSize: points.length,
        confidence: 0.3,
        level: "bassa",
        note: "Pochi dati di mercato, stima basata soprattutto sull'analisi qualitativa.",
        aiOriginal: { min: normalizeNumber(result.currentEstimate?.min, 0), max: normalizeNumber(result.currentEstimate?.max, 0) },
      };
    }

    if (typeof body.purchasePrice === "number" && body.purchasePrice >= 0) {
      const avgNow = (normalizeNumber(result.currentEstimate.min, 0) + normalizeNumber(result.currentEstimate.max, 0)) / 2;
      result.profit = {
        purchasePrice: body.purchasePrice,
        currentProfit: Number((avgNow - body.purchasePrice).toFixed(2)),
        currentProfitPercent:
          body.purchasePrice > 0 ? Number((((avgNow - body.purchasePrice) / body.purchasePrice) * 100).toFixed(1)) : null,
        futureProfitYear5: Number(((normalizeNumber(result.futureEstimate?.year5, 0) - body.purchasePrice)).toFixed(2)),
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
