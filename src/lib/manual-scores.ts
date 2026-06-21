import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { statusLabel, type MatchSummary } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const MANUAL_SCORES_FILE = path.join(DATA_DIR, "manual-scores.json");

export interface ManualMatchScore {
  matchId: number;
  homeGoals: number | null;
  awayGoals: number | null;
  status: string;
  statusLong: string;
  /** Why this was pinned (optional note for your future self). */
  note?: string;
  pinnedAt: string;
}

type ManualScoresStore = Record<string, ManualMatchScore>;

function readManualScores(): ManualScoresStore {
  try {
    if (!existsSync(MANUAL_SCORES_FILE)) return {};
    return JSON.parse(readFileSync(MANUAL_SCORES_FILE, "utf8")) as ManualScoresStore;
  } catch {
    return {};
  }
}

function writeManualScores(store: ManualScoresStore): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  writeFileSync(MANUAL_SCORES_FILE, JSON.stringify(store, null, 2));
}

function applyManualRecord(match: MatchSummary, manual: ManualMatchScore): MatchSummary {
  return {
    ...match,
    homeGoals: manual.homeGoals,
    awayGoals: manual.awayGoals,
    status: manual.status,
    statusLong: manual.statusLong,
  };
}

/** True when this match has a manual override on disk. */
export function hasManualScore(matchId: number): boolean {
  return Boolean(readManualScores()[String(matchId)]);
}

/** Apply manual score overrides (highest priority — beats API and auto-locks). */
export function applyManualScores(
  summaries: MatchSummary[],
): MatchSummary[] {
  const store = readManualScores();
  if (Object.keys(store).length === 0) return summaries;

  return summaries.map((match) => {
    const manual = store[String(match.id)];
    return manual ? applyManualRecord(match, manual) : match;
  });
}

/** Pin a match score so API / auto-lock never overwrites it. */
export function pinMatchScore(
  matchId: number,
  homeGoals: number,
  awayGoals: number,
  options: { status?: string; note?: string } = {},
): ManualMatchScore {
  const store = readManualScores();
  const status = options.status ?? "FT";
  const record: ManualMatchScore = {
    matchId,
    homeGoals,
    awayGoals,
    status,
    statusLong: statusLabel(status),
    note: options.note,
    pinnedAt: new Date().toISOString(),
  };
  store[String(matchId)] = record;
  writeManualScores(store);
  return record;
}

/** Remove a manual override so the API drives the score again. */
export function unpinMatchScore(matchId: number): boolean {
  const store = readManualScores();
  const key = String(matchId);
  if (!store[key]) return false;
  delete store[key];
  writeManualScores(store);
  return true;
}

export function getManualScoresForDebug(): ManualScoresStore {
  return readManualScores();
}
