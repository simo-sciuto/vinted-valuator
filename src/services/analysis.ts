import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import type { AnalysisResult, AnalysisRow, MultiPlatformListing } from "@/types/analysis";

export async function uploadPhotos(userId: string, files: File[]): Promise<string[]> {
  return Promise.all(
    files.map(async (file) => {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("item-photos").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (error) throw error;
      return path;
    }),
  );
}

export async function getPhotoUrls(paths: string[], ttlSeconds = 3600): Promise<string[]> {
  const { data, error } = await supabase.storage
    .from("item-photos")
    .createSignedUrls(paths, ttlSeconds);
  if (error) throw error;
  return (data ?? []).map((d) => d.signedUrl);
}

async function resolvePhotoUrls(rows: AnalysisRow[]): Promise<AnalysisRow[]> {
  const paths = [...new Set(rows.flatMap((r) => r.photos).filter((p) => !p.startsWith("https://")))];
  if (paths.length === 0) return rows;
  const { data } = await supabase.storage.from("item-photos").createSignedUrls(paths, 60 * 60 * 24 * 7);
  const urlMap = new Map((data ?? []).map((d) => [d.path, d.signedUrl]));
  return rows.map((r) => ({
    ...r,
    photos: r.photos.map((p) => (p.startsWith("https://") ? p : (urlMap.get(p) ?? p))),
  }));
}

async function extractFunctionError(error: unknown): Promise<Error> {
  if (error && typeof error === "object" && "context" in error) {
    try {
      const body = await (error as { context: Response }).context.json();
      if (body?.error) return new Error(body.error);
    } catch {}
  }
  return new Error(error instanceof Error ? error.message : "Errore sconosciuto");
}

export async function callAnalyzeItem(photoUrls: string[], purchasePrice: number | null): Promise<AnalysisResult> {
  const { data, error } = await supabase.functions.invoke("analyze-item", {
    body: { photoUrls, purchasePrice },
  });
  if (error) throw await extractFunctionError(error);
  if (!data?.result) throw new Error("Risposta del server non valida");
  return data.result as AnalysisResult;
}

export async function callGenerateListing(analysis: AnalysisResult): Promise<MultiPlatformListing> {
  const { data, error } = await supabase.functions.invoke("generate-listing", {
    body: { analysis },
  });
  if (error) throw await extractFunctionError(error);
  if (!data?.listing) throw new Error("Annuncio non generato");
  return data.listing as MultiPlatformListing;
}

export async function createAnalysisRecord(input: {
  userId: string;
  photos: string[];
  purchasePrice: number | null;
  result: AnalysisResult;
}): Promise<string> {
  const { data, error } = await supabase
    .from("analyses")
    .insert([
      {
        user_id: input.userId,
        photos: input.photos,
        purchase_price: input.purchasePrice,
        ai_result: input.result as unknown as Json,
        status: "completed",
      },
    ])
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function updateAnalysisListing(id: string, listing: MultiPlatformListing): Promise<void> {
  const { error } = await supabase
    .from("analyses")
    .update({ vinted_listing: listing as unknown as Json })
    .eq("id", id);
  if (error) throw error;
}

export async function fetchUserAnalyses(): Promise<AnalysisRow[]> {
  const { data, error } = await supabase
    .from("analyses")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return resolvePhotoUrls((data ?? []) as unknown as AnalysisRow[]);
}

export async function fetchAnalysisById(id: string): Promise<AnalysisRow | null> {
  const { data, error } = await supabase.from("analyses").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const rows = await resolvePhotoUrls([data as unknown as AnalysisRow]);
  return rows[0] ?? null;
}

export async function deleteAnalysis(id: string): Promise<void> {
  const { error } = await supabase.from("analyses").delete().eq("id", id);
  if (error) throw error;
}

export async function markAsSold(id: string, aiResult: AnalysisResult, purchasePrice: number | null, soldPrice: number): Promise<void> {
  const updatedAiResult = { ...aiResult };
  
  if (!updatedAiResult.profit) {
    updatedAiResult.profit = {
      purchasePrice: purchasePrice ?? 0,
      currentProfit: 0,
      currentProfitPercent: null,
      futureProfitYear5: 0,
    };
  }
  
  updatedAiResult.profit.soldPrice = soldPrice;
  const cost = purchasePrice ?? 0;
  updatedAiResult.profit.actualProfit = soldPrice - cost;

  const { error } = await supabase
    .from("analyses")
    .update({ 
      status: "sold",
      ai_result: updatedAiResult as unknown as Json,
    })
    .eq("id", id);
    
  if (error) throw error;
}
