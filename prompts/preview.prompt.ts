import type { Fixture } from "../lib/football/types";
import type { AnalysisLocale } from "../lib/ai-analysis";

export function buildPreviewPrompt(fixture: Fixture, locale: AnalysisLocale): string {
  const isKo = locale === "ko";
  const matchInfo = [
    `Home: ${fixture.homeTeam.name}`,
    `Away: ${fixture.awayTeam.name}`,
    `Competition: ${fixture.leagueSlug}`,
    `Date: ${fixture.date}`,
    `Venue: ${fixture.venue ?? "TBD"}`,
    `Round: ${fixture.round}`,
  ].join("\n");

  if (isKo) {
    return `당신은 축구 분석 전문가입니다. 아래 경기 데이터만을 사용하여 한국어로 경기 프리뷰를 작성해주세요.

경기 정보:
${matchInfo}

지침:
- 제공된 데이터만 사용하세요. 추측하거나 만들어내지 마세요.
- 200-300자 내외로 작성하세요.
- 양 팀의 예상 전술과 주목 포인트를 포함하세요.
- 마지막에 예상 결과를 한 문장으로 제시하세요.
- 스포츠 오락 목적의 분석임을 명심하세요.`;
  }

  return `You are a football analyst. Using ONLY the provided match data below, write a concise match preview in English.

Match Information:
${matchInfo}

Guidelines:
- Use only the provided data. Do not speculate or invent facts.
- Write 150-200 words.
- Cover expected tactics and key areas to watch.
- End with a one-sentence prediction.
- Remember this is for entertainment/sports analysis purposes.`;
}
