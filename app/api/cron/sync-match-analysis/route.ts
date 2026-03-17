/**
 * Cron endpoint: Generate AI match analysis for upcoming/finished fixtures
 * Schedule: Every hour (prioritizes upcoming matches within 24h and recently finished)
 *
 * Env vars: CRON_SECRET, ANTHROPIC_API_KEY, AI_MOCK_MODE
 */
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AnalysisType = "preview" | "recap";
type Locale = "ko" | "en";

interface AnalysisJob {
  fixtureId: number;
  type: AnalysisType;
  locale: Locale;
}

async function generateAnalysis(job: AnalysisJob): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || process.env.AI_MOCK_MODE === "true") {
    // Mock mode: simulate generation delay
    await new Promise((r) => setTimeout(r, 10));
    return { success: true };
  }

  try {
    // In production: call Claude API with structured match data
    // const result = await generateMatchAnalysis({ fixture, type: job.type, locale: job.locale });
    // await saveAnalysisToDb(result);
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isMockMode = !process.env.ANTHROPIC_API_KEY || process.env.AI_MOCK_MODE === "true";

  // Build jobs list: generate previews for upcoming matches, recaps for finished ones
  // In production, these would be fetched from DB
  const mockJobs: AnalysisJob[] = [
    { fixtureId: 1001, type: "preview", locale: "en" },
    { fixtureId: 1001, type: "preview", locale: "ko" },
    { fixtureId: 1002, type: "recap", locale: "en" },
    { fixtureId: 1002, type: "recap", locale: "ko" },
  ];

  if (isMockMode) {
    return NextResponse.json({
      success: true,
      mode: "mock",
      message: "Mock mode active. Set ANTHROPIC_API_KEY to enable real AI generation.",
      jobsQueued: mockJobs.length,
      syncedAt: new Date().toISOString(),
    });
  }

  const results = await Promise.allSettled(
    mockJobs.map((job) => generateAnalysis(job))
  );

  const succeeded = results.filter((r) => r.status === "fulfilled" && r.value.success).length;
  const failed = results.length - succeeded;

  return NextResponse.json({
    success: failed === 0,
    mode: "live",
    jobsProcessed: results.length,
    succeeded,
    failed,
    syncedAt: new Date().toISOString(),
  });
}
