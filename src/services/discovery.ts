import { supabase } from "@/integrations/supabase/client";
import type { DealCheckResponse } from "@/types/analysis";

export interface MarketOpportunity {
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
  searchUrl: string;
  saleSuccessProbability?: number;
  // Real listing extras (populated when isReal = true)
  isReal?: boolean;
  imageUrl?: string;
  directUrl?: string;
  dealScore?: number;
  verdict?: string;
}

export type FlipDeal = MarketOpportunity;

async function extractFunctionError(error: unknown): Promise<Error> {
  if (error && typeof error === "object" && "context" in error) {
    try {
      const body = await (error as { context: Response }).context.json();
      if (body?.error) return new Error(body.error);
    } catch {}
  }
  return new Error(error instanceof Error ? error.message : "Errore sconosciuto");
}

export const fetchHotDeals = async (
  tag?: string,
  maxPrice?: number,
): Promise<{ opportunities: MarketOpportunity[]; hasRealListings: boolean }> => {
  const { data, error } = await supabase.functions.invoke("scout-deals", {
    body: { tag: tag ?? "", maxPrice: maxPrice ?? 60 },
  });

  if (error) throw await extractFunctionError(error);

  return {
    opportunities: (data?.opportunities ?? []) as MarketOpportunity[],
    hasRealListings: Boolean(data?.hasRealListings),
  };
};

export async function callCheckDeal(listingUrl: string): Promise<DealCheckResponse> {
  const { data, error } = await supabase.functions.invoke("check-deal", {
    body: { listingUrl },
  });
  if (error) throw await extractFunctionError(error);
  if (!data?.result || !data?.listing) throw new Error("Analisi non disponibile");
  return data as DealCheckResponse;
}

export const getTrendingSearches = () => [
  "Jordan 4", "Stone Island", "Carhartt", "Vinili", "Dunk Low",
];
