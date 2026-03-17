import type { LeagueSlug } from "./types";

export interface TeamEntry {
  id:         number;
  leagueSlug: LeagueSlug;
  nameEn:     string;
  nameKo:     string;
  flag:       string;
}

export const TEAM_REGISTRY: Record<string, TeamEntry> = {
  "arsenal":           { id: 42,  leagueSlug: "premier-league", nameEn: "Arsenal",            nameKo: "아스날",               flag: "🔴" },
  "man-city":          { id: 50,  leagueSlug: "premier-league", nameEn: "Man City",            nameKo: "맨체스터 시티",         flag: "🔵" },
  "liverpool":         { id: 40,  leagueSlug: "premier-league", nameEn: "Liverpool",           nameKo: "리버풀",               flag: "🔴" },
  "chelsea":           { id: 49,  leagueSlug: "premier-league", nameEn: "Chelsea",             nameKo: "첼시",                 flag: "🔵" },
  "man-united":        { id: 33,  leagueSlug: "premier-league", nameEn: "Man United",          nameKo: "맨체스터 유나이티드",   flag: "🔴" },
  "tottenham":         { id: 47,  leagueSlug: "premier-league", nameEn: "Tottenham",           nameKo: "토트넘",               flag: "⚪" },
  "newcastle":         { id: 34,  leagueSlug: "premier-league", nameEn: "Newcastle",           nameKo: "뉴캐슬",               flag: "⚫" },
  "aston-villa":       { id: 66,  leagueSlug: "premier-league", nameEn: "Aston Villa",         nameKo: "아스턴 빌라",          flag: "🟣" },
  "real-madrid":       { id: 541, leagueSlug: "la-liga",        nameEn: "Real Madrid",         nameKo: "레알 마드리드",         flag: "⚪" },
  "barcelona":         { id: 529, leagueSlug: "la-liga",        nameEn: "Barcelona",           nameKo: "바르셀로나",            flag: "🔵" },
  "atletico-madrid":   { id: 530, leagueSlug: "la-liga",        nameEn: "Atletico Madrid",     nameKo: "아틀레티코 마드리드",   flag: "🔴" },
  "sevilla":           { id: 536, leagueSlug: "la-liga",        nameEn: "Sevilla",             nameKo: "세비야",               flag: "⚪" },
  "real-betis":        { id: 543, leagueSlug: "la-liga",        nameEn: "Real Betis",          nameKo: "레알 베티스",           flag: "🟢" },
  "bayern-munich":     { id: 157, leagueSlug: "bundesliga",     nameEn: "Bayern Munich",       nameKo: "바이에른 뮌헨",         flag: "🔴" },
  "dortmund":          { id: 165, leagueSlug: "bundesliga",     nameEn: "Borussia Dortmund",   nameKo: "보루시아 도르트문트",   flag: "🟡" },
  "bayer-leverkusen":  { id: 168, leagueSlug: "bundesliga",     nameEn: "Bayer Leverkusen",    nameKo: "바이어 레버쿠젠",       flag: "🔴" },
  "rb-leipzig":        { id: 173, leagueSlug: "bundesliga",     nameEn: "RB Leipzig",          nameKo: "RB 라이프치히",         flag: "🔵" },
  "inter-milan":       { id: 505, leagueSlug: "serie-a",        nameEn: "Inter Milan",         nameKo: "인터 밀란",             flag: "🔵" },
  "ac-milan":          { id: 489, leagueSlug: "serie-a",        nameEn: "AC Milan",            nameKo: "AC 밀란",               flag: "🔴" },
  "juventus":          { id: 496, leagueSlug: "serie-a",        nameEn: "Juventus",            nameKo: "유벤투스",              flag: "⚫" },
  "napoli":            { id: 492, leagueSlug: "serie-a",        nameEn: "Napoli",              nameKo: "나폴리",               flag: "🔵" },
  "as-roma":           { id: 497, leagueSlug: "serie-a",        nameEn: "AS Roma",             nameKo: "AS 로마",               flag: "🔴" },
  "paris-sg":          { id: 85,  leagueSlug: "ligue-1",        nameEn: "Paris SG",            nameKo: "파리 생제르맹",         flag: "🔵" },
  "monaco":            { id: 91,  leagueSlug: "ligue-1",        nameEn: "Monaco",              nameKo: "모나코",               flag: "🔴" },
  "marseille":         { id: 81,  leagueSlug: "ligue-1",        nameEn: "Marseille",           nameKo: "마르세유",             flag: "🔵" },
  "lyon":              { id: 80,  leagueSlug: "ligue-1",        nameEn: "Lyon",                nameKo: "리옹",                 flag: "🔴" },
};

export const VALID_TEAM_SLUGS = Object.keys(TEAM_REGISTRY);
