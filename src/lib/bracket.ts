import type { BracketData, BracketSlot, FixturesFile, MatchSummary } from "./types";
import { isFinished, isLive, KNOCKOUT_ROUND_ORDER, roundShortName } from "./types";
import { KNOCKOUT_START_MS } from "./knockout-schedule";
import fixturesData from "@/data/fixtures.json";
import {
  buildKnockoutFeeders,
  buildKnockoutTreeMeta,
} from "./bracket-layout";

const WINNER_RE = /^Match (\d+) Winner$/;
const LOSER_RE = /^Match (\d+) Loser$/;

function matchWinner(summary: MatchSummary): "home" | "away" | null {
  if (!isFinished(summary.status)) return null;
  if (summary.homeGoals === null || summary.awayGoals === null) return null;
  if (summary.homeGoals > summary.awayGoals) return "home";
  if (summary.awayGoals > summary.homeGoals) return "away";
  return null;
}

function resolveLabel(
  label: string,
  byId: Map<number, MatchSummary>,
): string {
  const winner = label.match(WINNER_RE);
  if (winner) {
    const source = byId.get(Number(winner[1]));
    if (!source) return label;
    const side = matchWinner(source);
    if (side === "home") return source.homeTeam;
    if (side === "away") return source.awayTeam;
    return label;
  }

  const loser = label.match(LOSER_RE);
  if (loser) {
    const source = byId.get(Number(loser[1]));
    if (!source) return label;
    const side = matchWinner(source);
    if (side === "home") return source.awayTeam;
    if (side === "away") return source.homeTeam;
    return label;
  }

  return label;
}

function toBracketSlot(
  summary: MatchSummary,
  byId: Map<number, MatchSummary>,
): BracketSlot {
  return {
    id: summary.id,
    homeTeam: resolveLabel(summary.homeTeam, byId),
    awayTeam: resolveLabel(summary.awayTeam, byId),
    homeGoals: summary.homeGoals,
    awayGoals: summary.awayGoals,
    status: summary.status,
    isLive: isLive(summary.status),
    isFinished: isFinished(summary.status),
    venue: summary.venue,
    city: summary.city,
    foxChannel: summary.foxChannel,
    onTubi: summary.onTubi,
  };
}

export function buildBracket(
  summaries: MatchSummary[],
  now: number,
): BracketData {
  const knockout = summaries.filter((m) => m.id >= 73);
  const byId = new Map(summaries.map((m) => [m.id, m]));

  const knockoutStarted =
    now >= KNOCKOUT_START_MS ||
    knockout.some((m) => m.status === "LIVE" || isFinished(m.status));

  const previewBracket =
    typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_PREVIEW_BRACKET === "true";

  const thirdPlaceMatch = knockout.find((m) => m.round === "Third Place");

  const rounds = KNOCKOUT_ROUND_ORDER.map((name) => ({
    name,
    shortName: roundShortName(name),
    matches: knockout
      .filter((m) => m.round === name)
      .sort((a, b) => a.id - b.id)
      .map((m) => toBracketSlot(m, byId)),
  }));

  // Feeder links must come from static fixture labels ("Match N Winner"), not
  // resolved team names — otherwise finished R16+ matches collapse to leaves
  // and R32 slots (e.g. M73, M75, M77, M78) never render in the tree.
  const feederSource = (fixturesData as FixturesFile).matches.filter(
    (m) => m.id >= 73 && m.round !== "Third Place",
  );
  const feeders = buildKnockoutFeeders(feederSource);
  const knockoutTree = buildKnockoutTreeMeta(feeders);

  return {
    active: knockoutStarted || previewBracket,
    rounds,
    thirdPlace: thirdPlaceMatch
      ? toBracketSlot(thirdPlaceMatch, byId)
      : null,
    knockoutTree,
  };
}
