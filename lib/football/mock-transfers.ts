/**
 * Mock /transfers?team= responses for local development (FOOTBALL_MOCK_MODE=true outside Vercel only).
 * Same shape as the API-Football spec example. Names are placeholders, not real transfers; dates are
 * relative to today so the default period always has rows.
 */
import { addDays, kstToday } from "./transfers";

const logo = (id: number) => `https://media.api-sports.io/football/teams/${id}.png`;
const t = (id: number, name: string) => ({ id, name, logo: logo(id) });

export function mockTeamTransfers(teamId: number): unknown[] {
  const today = kstToday();
  const self = t(teamId, `Team ${teamId}`);
  const other = t(900000 + teamId, "Mock Other FC");
  return [
    { player: { id: teamId * 100 + 1, name: "Mock Player A" }, update: `${today}T00:00:00+00:00`,
      transfers: [{ date: addDays(today, -3), type: "€ 12.5M", teams: { in: self, out: other } }] },
    { player: { id: teamId * 100 + 2, name: "Mock Player B" }, update: `${today}T00:00:00+00:00`,
      transfers: [{ date: addDays(today, -10), type: "Loan", teams: { in: other, out: self } }] },
    { player: { id: teamId * 100 + 3, name: "Mock Player C" }, update: `${today}T00:00:00+00:00`,
      transfers: [{ date: addDays(today, -20), type: "Free", teams: { in: self, out: other } }] },
  ];
}
