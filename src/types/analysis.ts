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
  identification: {
    name: string;
    category: ItemCategory;
    brand: string;
    artist: string;
    era: string;
    estimatedAge: string;
    condition: string;
    confidence: number;
  };
  story: string;
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
  profit?: {
    purchasePrice: number;
    currentProfit: number;
    currentProfitPercent: number | null;
    futureProfitYear5: number;
  };
}

export interface VintedListing {
  title: string;
  description: string;
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
  vinted_listing: VintedListing | null;
  status: string;
  created_at: string;
  updated_at: string;
}
