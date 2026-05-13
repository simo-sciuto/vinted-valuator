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
    negotiationScript?: string;
    listingKeywords?: string[];
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
  saleSuccessProbability?: {
    score: number;
    label: "molto alta" | "alta" | "media" | "bassa" | "molto bassa";
    timeToSell: number;
    factors: string[];
  };
  platformPrices?: {
    vinted: number;
    ebay: number;
    depop: number;
    bestPlatform: string;
    reasoning: string;
  };
  bestPostingTime?: {
    days: string[];
    timeSlot: string;
    reasoning: string;
    tip: string;
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

export interface DealListingPreview {
  title: string;
  price: number;
  imageUrl: string;
  brand: string;
  condition: string;
  url: string;
}

export interface DealCheckResponse {
  listing: DealListingPreview;
  result: DealCheckResult;
}

export interface DealCheckResult {
  negotiationScript?: string;
  item: {
    name: string;
    brand: string;
    category: string;
    condition: string;
    estimatedYear: string;
  };
  market: {
    estimatedMin: number;
    estimatedMax: number;
    askingPrice: number;
    dealScore: number;
    verdict: "ottimo affare" | "buon affare" | "prezzo equo" | "sopravvalutato" | "da evitare";
    savingsAmount: number;
    savingsPercent: number;
    reasoning: string;
    buyRecommendation: boolean;
    sellingTip: string;
    resaleProbability: number;
  };
  similarDeals: Array<{
    name: string;
    platform: string;
    priceRange: string;
    link: string;
    whyInteresting: string;
  }>;
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
