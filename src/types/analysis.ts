export type ItemCategory =
  | "abbigliamento"
  | "vinile"
  | "arte"
  | "libro"
  | "gioco"
  | "collezionismo"
  | "accessorio"
  | "altro";

export interface AnalysisResult {
  visualAnalysis?: string;
  identification: {
    name: string;
    category: ItemCategory;
    brand: string;
    artist: string;
    era: string;
    estimatedAge: string;
    condition: string;
    materials: string[];
    style: string;
    confidence: number;
  };
  marketAnalysis: {
    rareFactors: string;
    targetAudience: string;
    similarSoldPrice: string;
    authenticityClues: string;
    restorationTips: string;
    stylingAdvice: string;
  };
  historicalContext: {
    brandHistory: string;
    culturalSignificance: string;
    manufacturingDetails: string;
    funFact: string;
  };
  currentEstimate: {
    min: number;
    max: number;
    reasoning: string;
  };
  futureEstimate: {
    year1: number;
    year3: number;
    year5: number;
    trend: "in forte crescita" | "in crescita" | "stabile" | "in calo";
    note: string;
  };
  marketResearch?: string;
  sources?: { title: string; url: string }[];
  pricePoints?: { source: string; price: number; kind: "sold" | "listed" | "estimate"; year: number; note?: string }[];
  priceCalibration?: {
    weightedAverage: number | null;
    stdDeviation?: number;
    coefficientOfVariation?: number;
    sampleSize: number;
    outliersRemoved?: number;
    confidence: number;
    level: "alta" | "media" | "bassa";
    note?: string;
    aiOriginal?: { min: number; max: number };
  };
  profit?: {
    purchasePrice: number;
    currentProfit: number;
    currentProfitPercent: number | null;
    futureProfitYear5: number;
    soldPrice?: number;
    actualProfit?: number;
  };
}

export interface MultiPlatformListing {
  title: string;
  description: string;
  depopDescription?: string;
  ebayDescription?: string;
  hashtags: string[];
  suggestedPrice: number;
  vintedCategory: string;
  sellingTip: string;
}

export interface AnalysisRow {
  id: string;
  user_id: string;
  photos: string[];
  purchase_price: number | null;
  ai_result: AnalysisResult | null;
  vinted_listing: MultiPlatformListing | null;
  status: string;
  created_at: string;
  updated_at: string;
}
