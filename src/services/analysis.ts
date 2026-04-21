import { supabase } from "@/integrations/supabase/client";
import type { AnalysisResult, AnalysisRow, VintedListing } from "@/types/analysis";

export async function uploadPhotos(userId: string, files: File[]): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("item-photos").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) throw error;
    const { data } = await supabase.storage.from("item-photos").createSignedUrl(path, 60 * 60 * 24 * 7);
    if (!data?.signedUrl) throw new Error("Impossibile creare URL firmato");
    urls.push(data.signedUrl);
  }
  return urls;
}

export async function callAnalyzeItem(photoUrls: string[], purchasePrice: number | null): Promise<AnalysisResult> {
  const { data, error } = await supabase.functions.invoke("analyze-item", {
    body: { photoUrls, purchasePrice },
  });
  if (error) throw new Error(error.message);
  if (!data?.result) throw new Error("Risposta AI non valida");
  return data.result as AnalysisResult;
}

export async function callGenerateListing(analysis: AnalysisResult): Promise<VintedListing> {
  const { data, error } = await supabase.functions.invoke("generate-listing", {
    body: { analysis },
  });
  if (error) throw new Error(error.message);
  if (!data?.listing) throw new Error("Annuncio non generato");
  return data.listing as VintedListing;
}

export async function createAnalysisRecord(input: {
  userId: string;
  photos: string[];
  purchasePrice: number | null;
  result: AnalysisResult;
}): Promise<string> {
  const { data, error } = await supabase
    .from("analyses")
    .insert({
      user_id: input.userId,
      photos: input.photos,
      purchase_price: input.purchasePrice,
      ai_result: input.result as unknown as Record<string, unknown>,
      status: "completed",
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function updateAnalysisListing(id: string, listing: VintedListing): Promise<void> {
  const { error } = await supabase
    .from("analyses")
    .update({ vinted_listing: listing as unknown as Record<string, unknown> })
    .eq("id", id);
  if (error) throw error;
}

export async function fetchUserAnalyses(): Promise<AnalysisRow[]> {
  const { data, error } = await supabase
    .from("analyses")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as AnalysisRow[];
}

export async function fetchAnalysisById(id: string): Promise<AnalysisRow | null> {
  const { data, error } = await supabase.from("analyses").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as unknown as AnalysisRow) ?? null;
}

export async function deleteAnalysis(id: string): Promise<void> {
  const { error } = await supabase.from("analyses").delete().eq("id", id);
  if (error) throw error;
}
