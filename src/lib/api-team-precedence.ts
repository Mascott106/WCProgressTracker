import { isUndeterminedTeamName } from "./placeholders";
import { teamsMatch } from "./team-names";
import type { MatchSummary } from "./types";

function concreteApiTeamName(name: string | null | undefined): string | null {
  if (!name?.trim() || isUndeterminedTeamName(name)) return null;
  return name.trim();
}

function logTeamMismatch(
  matchId: number,
  side: "home" | "away",
  resolved: string,
  api: string,
): void {
  console.warn(
    `[wc-progress] Match ${matchId} ${side}: resolved "${resolved}" ≠ API "${api}" — using API`,
  );
}

/**
 * Prefer football-data.org team names over locally resolved placeholders.
 * Logs when resolved names disagree with the API.
 */
export function applyApiTeamPrecedence(
  summaries: MatchSummary[],
): MatchSummary[] {
  return summaries.map((match) => {
    const apiHome = concreteApiTeamName(match.apiHomeTeam);
    const apiAway = concreteApiTeamName(match.apiAwayTeam);

    let homeTeam = match.homeTeam;
    let awayTeam = match.awayTeam;

    if (apiHome) {
      if (
        !isUndeterminedTeamName(homeTeam) &&
        !teamsMatch(homeTeam, apiHome)
      ) {
        logTeamMismatch(match.id, "home", homeTeam, apiHome);
      }
      homeTeam = apiHome;
    }

    if (apiAway) {
      if (
        !isUndeterminedTeamName(awayTeam) &&
        !teamsMatch(awayTeam, apiAway)
      ) {
        logTeamMismatch(match.id, "away", awayTeam, apiAway);
      }
      awayTeam = apiAway;
    }

    if (homeTeam === match.homeTeam && awayTeam === match.awayTeam) {
      return match;
    }

    return { ...match, homeTeam, awayTeam };
  });
}
