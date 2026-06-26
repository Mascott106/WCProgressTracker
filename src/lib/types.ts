export const TOTAL_GAMES = 104;

/** Minutes after kickoff before a match counts as complete */
export const MATCH_DURATION_MINUTES = 120;

export const FINISHED_STATUSES = new Set(["FT", "AET", "PEN", "AWD", "WO"]);
export const LIVE_STATUSES = new Set(["1H", "HT", "2H", "ET", "BT", "P", "LIVE"]);

export const KNOCKOUT_FIRST_MATCH_ID = 73;

/** Group-stage matches (ids 1–72) before Round of 32. */
export const GROUP_STAGE_GAMES = KNOCKOUT_FIRST_MATCH_ID - 1;

/** Match-count progress (0–100) when knockout begins. */
export function matchProgressKnockoutPercent(
  totalGames = TOTAL_GAMES,
): number {
  return (GROUP_STAGE_GAMES / totalGames) * 100;
}

export const KNOCKOUT_ROUND_ORDER = [
  "Round of 32",
  "Round of 16",
  "Quarter-finals",
  "Semi-finals",
  "Final",
] as const;

export interface StaticMatch {
  id: number;
  date: string;
  homeTeam: string;
  awayTeam: string;
  round: string;
  group: string | null;
  venue: string;
  city: string;
  /** Set manually to override time-based status */
  status: string | null;
  homeGoals: number | null;
  awayGoals: number | null;
}

export type FoxChannel = "FOX" | "FS1";

export interface MatchSummary {
  id: number;
  date: string;
  round: string;
  status: string;
  statusLong: string;
  homeTeam: string;
  awayTeam: string;
  homeGoals: number | null;
  awayGoals: number | null;
  venue: string;
  city: string;
  foxChannel: FoxChannel;
  onTubi: boolean;
}

export interface BracketSlot {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeGoals: number | null;
  awayGoals: number | null;
  status: string;
  isLive: boolean;
  isFinished: boolean;
  venue: string;
  city: string;
  foxChannel: FoxChannel;
  onTubi: boolean;
}

export interface BracketRound {
  name: string;
  shortName: string;
  matches: BracketSlot[];
}

export interface KnockoutSchedule {
  active: boolean;
  milestones: KnockoutRoundMilestone[];
  currentRound: string | null;
}

export interface KnockoutRoundMilestone {
  name: string;
  shortName: string;
  startsAt: string;
  endsAt: string;
  totalMatches: number;
  completedMatches: number;
  status: "complete" | "current" | "upcoming";
}

export interface BracketData {
  /** True once the Round of 32 has begun */
  active: boolean;
  rounds: BracketRound[];
  thirdPlace: BracketSlot | null;
}

export interface ScheduleDay {
  dateIso: string;
  matches: MatchSummary[];
  isToday: boolean;
  isTomorrow: boolean;
}

export interface TimeProgress {
  /** First match kickoff */
  startAt: string;
  /** Last match kickoff + match duration (2 hours) */
  endAt: string;
  percent: number;
}

export interface ProgressData {
  totalGames: number;
  completedGames: number;
  liveGames: number;
  remainingGames: number;
  progressPercent: number;
  timeProgress: TimeProgress;
  lastCompleted: MatchSummary[];
  liveMatches: MatchSummary[];
  upcomingDays: ScheduleDay[];
  bracket: BracketData;
  knockoutSchedule: KnockoutSchedule;
  /** When the next live/complete status transition is expected */
  nextStatusChangeAt: string;
}

export interface FixturesFile {
  matches: StaticMatch[];
}

const STATUS_LABELS: Record<string, string> = {
  NS: "Not Started",
  LIVE: "In Progress",
  FT: "Full Time",
  AET: "After Extra Time",
  PEN: "Penalties",
};

const ROUND_SHORT: Record<string, string> = {
  "Round of 32": "R32",
  "Round of 16": "R16",
  "Quarter-finals": "QF",
  "Semi-finals": "SF",
  Final: "Final",
  "Third Place": "3rd",
};

export function roundShortName(round: string): string {
  return ROUND_SHORT[round] ?? round;
}

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export function isFinished(status: string): boolean {
  return FINISHED_STATUSES.has(status);
}

export function isLive(status: string): boolean {
  return LIVE_STATUSES.has(status) || status === "LIVE";
}

export function isKnockoutRound(round: string): boolean {
  return (
    round === "Round of 32" ||
    round === "Round of 16" ||
    round === "Quarter-finals" ||
    round === "Semi-finals" ||
    round === "Final" ||
    round === "Third Place"
  );
}

export function hasMatchScore(
  match: Pick<MatchSummary, "homeGoals" | "awayGoals">,
): boolean {
  return match.homeGoals !== null && match.awayGoals !== null;
}

export function formatMatchVenue(
  match: Pick<MatchSummary, "venue" | "city">,
): string {
  return `${match.venue}, ${match.city}`;
}

/** Winning team name, or null if undecided / draw / no score. */
export function getMatchWinnerTeam(
  match: Pick<
    MatchSummary,
    "status" | "homeTeam" | "awayTeam" | "homeGoals" | "awayGoals"
  >,
): string | null {
  if (!isFinished(match.status) || !hasMatchScore(match)) return null;
  if (match.homeGoals! > match.awayGoals!) return match.homeTeam;
  if (match.awayGoals! > match.homeGoals!) return match.awayTeam;
  return null;
}
