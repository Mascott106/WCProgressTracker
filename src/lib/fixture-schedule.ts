import fixturesData from "@/data/fixtures.json";
import type { FixturesFile } from "./types";

export interface FixtureSchedule {
  date: string;
  round: string;
  venue: string;
  city: string;
  homeTeam: string;
  awayTeam: string;
}

const byId = new Map(
  (fixturesData as FixturesFile).matches.map((match) => [match.id, match]),
);

/** Static schedule row for a fixture id (knockout placeholders, etc.). */
export function getFixtureSchedule(matchId: number): FixtureSchedule | null {
  const match = byId.get(matchId);
  if (!match) return null;
  return {
    date: match.date,
    round: match.round,
    venue: match.venue,
    city: match.city,
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
  };
}
