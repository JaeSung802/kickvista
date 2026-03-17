import type { MatchDetail } from "../lib/football/types";
import type { AnalysisLocale } from "../lib/ai-analysis";

export function buildRecapPrompt(fixture: MatchDetail, locale: AnalysisLocale): string {
  const isKo = locale === "ko";
  const score = `${fixture.homeScore ?? 0}-${fixture.awayScore ?? 0}`;
  const events = fixture.events
    .map(
      (e) =>
        `${e.minute}' ${e.type}: ${e.playerName} (${
          e.teamId === fixture.homeTeam.id ? fixture.homeTeam.name : fixture.awayTeam.name
        })`
    )
    .join("\n");

  if (isKo) {
    return `당신은 축구 분석 전문가입니다. 아래 경기 결과 데이터만을 사용하여 한국어로 경기 리캡을 작성해주세요.

경기 결과:
홈: ${fixture.homeTeam.name} ${score} ${fixture.awayTeam.name} :원정
날짜: ${fixture.date}
대회: ${fixture.leagueSlug}

주요 이벤트:
${events || "이벤트 데이터 없음"}

지침:
- 제공된 데이터만 사용하세요.
- 200-300자 내외로 작성하세요.
- 경기 흐름과 결정적인 순간을 요약하세요.`;
  }

  return `You are a football analyst. Using ONLY the provided match data below, write a concise match recap in English.

Result:
Home: ${fixture.homeTeam.name} ${score} ${fixture.awayTeam.name} :Away
Date: ${fixture.date}
Competition: ${fixture.leagueSlug}

Key Events:
${events || "No event data available"}

Guidelines:
- Use only the provided data.
- Write 150-200 words.
- Summarize the flow of the match and decisive moments.`;
}
