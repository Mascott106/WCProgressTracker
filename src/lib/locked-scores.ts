import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { FINAL_SCORE_LOCK_DELAY_MS, MATCH_DURATION_MS } from "./api-limits";
import {
  isFinished,
  statusLabel,
  type MatchSummary,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const LOCKED_SCORES_FILE = path.join(DATA_DIR, "locked-scores.json");

export interface LockedMatchScore {
  matchId: number;
  homeGoals: number | null;
  awayGoals: number | null;
  status: string;
  statusLong: string;
  lockedAt: string;
}

type LockedScoresStore = Record<string, LockedMatchScore>;

export function scoreLockTime(kickoffIso: string): number {
  return new Date(kickoffIso).getTime() + MATCH_DURATION_MS + FINAL_SCORE_LOCK_DELAY_MS;
}

export function isPastScoreLockTime(kickoffIso: string, now: number): boolean {
  return now >= scoreLockTime(kickoffIso);
}

function readLockedScores(): LockedScoresStore {
  try {
    if (!existsSync(LOCKED_SCORES_FILE)) return {};
    return JSON.parse(readFileSync(LOCKED_SCORES_FILE, "utf8")) as LockedScoresStore;
  } catch {
    return {};
  }
}

function writeLockedScores(store: LockedScoresStore): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  writeFileSync(LOCKED_SCORES_FILE, JSON.stringify(store, null, 2));
}

function toLockedRecord(match: MatchSummary, now: number): LockedMatchScore {
  return {
    matchId: match.id,
    homeGoals: match.homeGoals,
    awayGoals: match.awayGoals,
    status: match.status,
    statusLong: match.statusLong,
    lockedAt: new Date(now).toISOString(),
  };
}

function applyLockedRecord(match: MatchSummary, locked: LockedMatchScore): MatchSummary {
  return {
    ...match,
    homeGoals: locked.homeGoals,
    awayGoals: locked.awayGoals,
    status: locked.status,
    statusLong: locked.statusLong,
  };
}

/**
 * Delay accepting final scores until 10 minutes after expected full time so
 * brief API corrections (e.g. VAR reversals) do not stick. Locked scores are
 * written once and never updated.
 */
export function applyScoreLocks(
  summaries: MatchSummary[],
  now = Date.now(),
): MatchSummary[] {
  const store = readLockedScores();
  let dirty = false;

  const result = summaries.map((match) => {
    const key = String(match.id);
    const existing = store[key];

    if (existing) {
      return applyLockedRecord(match, existing);
    }

    if (!isFinished(match.status)) {
      return match;
    }

    if (!isPastScoreLockTime(match.date, now)) {
      return {
        ...match,
        status: "LIVE",
        statusLong: statusLabel("LIVE"),
      };
    }

    store[key] = toLockedRecord(match, now);
    dirty = true;
    return match;
  });

  if (dirty) {
    writeLockedScores(store);
  }

  return result;
}

/** Clear locked scores (e.g. tests or server reset). */
export function clearLockedScores(): void {
  writeLockedScores({});
}

export function getLockedScoresForDebug(): LockedScoresStore {
  return readLockedScores();
}
