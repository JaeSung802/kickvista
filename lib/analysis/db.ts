/**
 * match_analyses DB operations
 */
import { createClient } from "@/lib/supabase/server";
import type { MatchAnalysis } from "@/lib/ai-analysis";

export interface DbAnalysis {
  id: string;
  fixture_id: number;
  type: "preview" | "recap";
  locale: "en" | "ko";
  slug: string;
  title: string;
  summary: string;
  insight: string;
  prediction: { outcome: string; label: string; confidence: number } | null;
  key_factors: { icon: string; label: string; labelKo: string; value: string; valueKo: string }[];
  tips: { label: string; labelKo: string }[];
  league_id: number | null;
  league_slug: string | null;
  home_team: string | null;
  away_team: string | null;
  match_date: string | null;
  ai_model: string;
  generated_at: string;
}

function toMatchAnalysis(row: DbAnalysis): MatchAnalysis {
  return {
    id: row.id,
    fixtureId: row.fixture_id,
    type: row.type,
    locale: row.locale,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    insight: row.insight,
    prediction: row.prediction
      ? { ...row.prediction, outcome: row.prediction.outcome as "home" | "away" | "draw" }
      : undefined,
    tips: row.tips ?? [],
    aiModel: row.ai_model,
    generatedAt: row.generated_at,
    disclaimer:
      row.locale === "ko"
        ? "AI 분석은 오락 목적으로만 제공됩니다. 과거 성과는 미래 결과를 보장하지 않습니다."
        : "AI predictions are for entertainment purposes only. Past performance does not guarantee future results.",
    isAiGenerated: true,
  };
}

/** List analyses for a locale, newest first. Optional type filter. */
export async function listAnalyses(
  locale: "en" | "ko",
  type?: "preview" | "recap",
  limit = 12
): Promise<MatchAnalysis[]> {
  const supabase = await createClient();

  let query = supabase
    .from("match_analyses")
    .select("*")
    .eq("locale", locale)
    .order("generated_at", { ascending: false })
    .limit(limit);

  if (type) {
    query = query.eq("type", type);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return (data as DbAnalysis[]).map(toMatchAnalysis);
}

/** List analyses filtered by league slug + locale. */
export async function listAnalysesByLeague(
  leagueSlug: string,
  locale: "en" | "ko",
  limit = 3
): Promise<MatchAnalysis[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("match_analyses")
    .select("*")
    .eq("league_slug", leagueSlug)
    .eq("locale", locale)
    .order("generated_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return (data as DbAnalysis[]).map(toMatchAnalysis);
}

/** Get a single analysis by slug + locale. */
export async function getAnalysisBySlug(
  slug: string,
  locale: "en" | "ko"
): Promise<MatchAnalysis | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("match_analyses")
    .select("*")
    .eq("slug", slug)
    .eq("locale", locale)
    .single();

  if (error || !data) return null;
  return toMatchAnalysis(data as DbAnalysis);
}

/**
 * Fetch all analyses for a given fixture ID + locale (preview + recap).
 * Returns an object with optional `preview` and `recap` entries.
 */
export async function getAnalysesByFixture(
  fixtureId: number,
  locale: "en" | "ko"
): Promise<{ preview: MatchAnalysis | null; recap: MatchAnalysis | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("match_analyses")
    .select("*")
    .eq("fixture_id", fixtureId)
    .eq("locale", locale)
    .order("generated_at", { ascending: false });

  if (error || !data) return { preview: null, recap: null };

  const rows = data as DbAnalysis[];
  const previewRow = rows.find((r) => r.type === "preview");
  const recapRow   = rows.find((r) => r.type === "recap");
  return {
    preview: previewRow ? toMatchAnalysis(previewRow) : null,
    recap:   recapRow   ? toMatchAnalysis(recapRow)   : null,
  };
}

/** Check if analysis already exists for this fixture+type+locale. */
export async function analysisExists(
  fixtureId: number,
  type: "preview" | "recap",
  locale: "en" | "ko"
): Promise<boolean> {
  const supabase = await createClient();

  const { count } = await supabase
    .from("match_analyses")
    .select("id", { count: "exact", head: true })
    .eq("fixture_id", fixtureId)
    .eq("type", type)
    .eq("locale", locale);

  return (count ?? 0) > 0;
}

/** Save (upsert) a generated analysis. */
export async function saveAnalysis(
  analysis: MatchAnalysis,
  meta: {
    leagueId?: number;
    leagueSlug?: string;
    homeTeam?: string;
    awayTeam?: string;
    matchDate?: string;
  }
): Promise<void> {
  const supabase = await createClient();

  await supabase.from("match_analyses").upsert(
    {
      fixture_id:  analysis.fixtureId,
      type:        analysis.type,
      locale:      analysis.locale,
      slug:        analysis.slug,
      title:       analysis.title,
      summary:     analysis.summary,
      insight:     analysis.insight,
      prediction:  analysis.prediction ?? null,
      key_factors: (analysis as { keyFactors?: unknown }).keyFactors ?? [],
      tips:        analysis.tips,
      league_id:   meta.leagueId ?? null,
      league_slug: meta.leagueSlug ?? null,
      home_team:   meta.homeTeam ?? null,
      away_team:   meta.awayTeam ?? null,
      match_date:  meta.matchDate ?? null,
      ai_model:    analysis.aiModel,
      generated_at: analysis.generatedAt,
    },
    { onConflict: "fixture_id,type,locale" }
  );
}
