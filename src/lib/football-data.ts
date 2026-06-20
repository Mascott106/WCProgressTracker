import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import {
  API_FETCH_INTERVAL_MS,
  FORCE_REFRESH_MIN_AGE_MS,
  FREE_TIER_REQUESTS_PER_MINUTE,
  OVERTIME_RETRY_MS,
  RATE_LIMIT_BACKOFF_MS,
} from "./api-limits";
import {
  buildProgressFromExternal,
  countMatchedFixtures,
  type ExternalMatch,
} from "./merge-api";
import type { ProgressData } from "./types";
import { statusLabel, TOTAL_GAMES } from "./types";

const API_BASE = "https://api.football-data.org/v4";
const WORLD_CUP_CODE = "WC";
const WORLD_CUP_SEASON = 2026;

const CACHE_DIR = path.join(process.cwd(), "data");
const CACHE_FILE = path.join(CACHE_DIR, "cache.json");

export interface ProgressApiMeta {
  source: "api" | "cache" | "static-fallback";
  /** Server will not call football-data.org before this time. */
  cacheExpiresAt: string;
  /** Remaining calls in the current minute window (from X-Requests-Available-Minute). */
  apiRequestsRemaining: number | null;
  /** Plan limit for the current minute window (10 on free tier). */
  apiRequestsLimit: number | null;
  /** When football-data.org resets the per-minute counter. */
  apiRequestResetAt: string | null;
  matchedFixtures: number;
  totalFixtures: number;
  /** Set when live API failed and static schedule was used instead. */
  apiError?: string;
  /** True when a manual refresh was skipped to protect the rate limit. */
  refreshSkipped?: boolean;
}

export interface ProgressApiResponse {
  data: ProgressData;
  meta: ProgressApiMeta;
}

interface CacheEntry {
  matches: ExternalMatch[];
  fetchedAt: number;
  expiresAt: number;
  requestsRemaining: number | null;
  requestResetAt: string | null;
}

interface FootballDataScoreSide {
  home?: number | null;
  away?: number | null;
  homeTeam?: number | null;
  awayTeam?: number | null;
}

interface FootballDataMatch {
  utcDate: string;
  status: string;
  homeTeam: { name: string | null } | null;
  awayTeam: { name: string | null } | null;
  score?: {
    duration?: string | null;
    fullTime?: FootballDataScoreSide | null;
  };
}

interface FootballDataMatchesResponse {
  matches: FootballDataMatch[];
  message?: string;
  errorCode?: number;
}

let memoryCache: CacheEntry | null = null;
let lastUpstreamFetchAt = 0;
let rateLimitUntil = 0;

function mapStatus(
  status: string,
  duration?: string | null,
): { status: string; statusLong: string } {
  switch (status) {
    case "SCHEDULED":
    case "TIMED":
      return { status: "NS", statusLong: statusLabel("NS") };
    case "LIVE":
    case "IN_PLAY":
    case "PAUSED":
      return { status: "LIVE", statusLong: statusLabel("LIVE") };
    case "FINISHED":
      if (duration === "PENALTY_SHOOTOUT") {
        return { status: "PEN", statusLong: statusLabel("PEN") };
      }
      if (duration === "EXTRA_TIME") {
        return { status: "AET", statusLong: statusLabel("AET") };
      }
      return { status: "FT", statusLong: statusLabel("FT") };
    case "POSTPONED":
      return { status: "POSTPONED", statusLong: "Postponed" };
    case "SUSPENDED":
      return { status: "SUSPENDED", statusLong: "Suspended" };
    case "CANCELLED":
      return { status: "CANCELLED", statusLong: "Cancelled" };
    default:
      return { status, statusLong: status };
  }
}

function extractGoals(fullTime?: FootballDataScoreSide | null): {
  home: number | null;
  away: number | null;
} {
  if (!fullTime) return { home: null, away: null };
  return {
    home: fullTime.home ?? fullTime.homeTeam ?? null,
    away: fullTime.away ?? fullTime.awayTeam ?? null,
  };
}

export function toExternalMatches(
  apiMatches: FootballDataMatch[],
): ExternalMatch[] {
  return apiMatches.map((match) => {
    const mapped = mapStatus(match.status, match.score?.duration);
    const goals = extractGoals(match.score?.fullTime);

    return {
      date: match.utcDate,
      status: mapped.status,
      statusLong: mapped.statusLong,
      homeTeam: match.homeTeam?.name ?? null,
      awayTeam: match.awayTeam?.name ?? null,
      homeGoals: goals.home,
      awayGoals: goals.away,
    };
  });
}

async function readDiskCache(): Promise<CacheEntry | null> {
  try {
    const raw = await readFile(CACHE_FILE, "utf8");
    return JSON.parse(raw) as CacheEntry;
  } catch {
    return null;
  }
}

async function writeDiskCache(entry: CacheEntry): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(CACHE_FILE, JSON.stringify(entry, null, 2));
}

/** Enforce the 1-minute polling policy even for legacy cache entries. */
function effectiveCacheExpiresAt(entry: CacheEntry): number {
  return Math.min(entry.expiresAt, entry.fetchedAt + API_FETCH_INTERVAL_MS);
}

function isCacheFresh(entry: CacheEntry, now: number): boolean {
  return effectiveCacheExpiresAt(entry) > now;
}

function normalizeCacheEntry(entry: CacheEntry): CacheEntry {
  const expiresAt = effectiveCacheExpiresAt(entry);
  return expiresAt === entry.expiresAt ? entry : { ...entry, expiresAt };
}

function canFetchUpstream(now: number, requestsRemaining: number | null): boolean {
  if (now < rateLimitUntil) return false;
  if (now - lastUpstreamFetchAt < API_FETCH_INTERVAL_MS) return false;
  if (requestsRemaining !== null && requestsRemaining <= 0) return false;
  return true;
}

async function fetchMatches(apiKey: string): Promise<{
  matches: ExternalMatch[];
  requestsRemaining: number | null;
  requestResetAt: string | null;
}> {
  const url = `${API_BASE}/competitions/${WORLD_CUP_CODE}/matches?season=${WORLD_CUP_SEASON}`;
  const res = await fetch(url, {
    headers: { "X-Auth-Token": apiKey },
    cache: "no-store",
  });

  const remaining = res.headers.get("X-Requests-Available-Minute");
  const requestsRemaining = remaining ? Number(remaining) : null;
  const resetSeconds = res.headers.get("X-RequestCounter-Reset");
  const requestResetAt =
    resetSeconds && Number(resetSeconds) > 0
      ? new Date(Date.now() + Number(resetSeconds) * 1000).toISOString()
      : null;
  const body = (await res.json()) as FootballDataMatchesResponse;

  if (res.status === 429) {
    rateLimitUntil = Date.now() + RATE_LIMIT_BACKOFF_MS;
    throw new Error("Rate limit exceeded — try again in a few minutes");
  }

  if (!res.ok) {
    const msg =
      body.message ??
      (typeof body === "object" && "error" in body
        ? String((body as { error: string }).error)
        : `API error ${res.status}`);
    throw new Error(msg);
  }

  lastUpstreamFetchAt = Date.now();

  return {
    matches: toExternalMatches(body.matches ?? []),
    requestsRemaining,
    requestResetAt,
  };
}

function toResponse(
  entry: CacheEntry,
  source: ProgressApiMeta["source"],
  now: number,
  extra?: Partial<ProgressApiMeta>,
): ProgressApiResponse {
  const data = buildProgressFromExternal(entry.matches, now);
  return {
    data: {
      ...data,
      // Client timer follows server cache schedule, not local kickoff math.
      nextStatusChangeAt: new Date(effectiveCacheExpiresAt(entry)).toISOString(),
    },
    meta: {
      source,
      cacheExpiresAt: new Date(effectiveCacheExpiresAt(entry)).toISOString(),
      apiRequestsRemaining: entry.requestsRemaining,
      apiRequestsLimit: entry.requestsRemaining !== null ? FREE_TIER_REQUESTS_PER_MINUTE : null,
      apiRequestResetAt: entry.requestResetAt ?? null,
      matchedFixtures: countMatchedFixtures(entry.matches),
      totalFixtures: TOTAL_GAMES,
      ...extra,
    },
  };
}

function shouldSkipForceRefresh(entry: CacheEntry, now: number): boolean {
  if (isCacheFresh(entry, now)) return true;
  if (now - entry.fetchedAt < FORCE_REFRESH_MIN_AGE_MS) return true;
  return false;
}

async function staticFallbackResponse(
  now: number,
  apiError?: string,
): Promise<ProgressApiResponse> {
  const { getProgress } = await import("./world-cup");
  return {
    data: getProgress(now),
    meta: {
      source: "static-fallback",
      cacheExpiresAt: new Date(now + 60_000).toISOString(),
      apiRequestsRemaining: null,
      apiRequestsLimit: null,
      apiRequestResetAt: null,
      matchedFixtures: 0,
      totalFixtures: TOTAL_GAMES,
      apiError,
    },
  };
}

export async function getProgressFromApi(
  apiKey: string,
  options: { forceRefresh?: boolean; useStaticFallback?: boolean } = {},
): Promise<ProgressApiResponse> {
  const now = Date.now();
  const { forceRefresh = false, useStaticFallback = false } = options;

  if (useStaticFallback) {
    return staticFallbackResponse(now);
  }

  let entry: CacheEntry | null = null;

  if (memoryCache) {
    memoryCache = normalizeCacheEntry(memoryCache);
    if (isCacheFresh(memoryCache, now)) {
      entry = memoryCache;
    }
  }

  if (!entry) {
    const disk = await readDiskCache();
    if (disk) {
      entry = normalizeCacheEntry(disk);
      memoryCache = entry;
      if (entry !== disk) {
        await writeDiskCache(entry);
      }
    }
  }

  const cacheValid = entry !== null && isCacheFresh(entry, now);

  if (forceRefresh && entry && shouldSkipForceRefresh(entry, now)) {
    return toResponse(entry, "cache", now, { refreshSkipped: true });
  }

  const needsFetch = !cacheValid || forceRefresh;

  if (needsFetch) {
    const remaining = entry?.requestsRemaining ?? null;
    if (!canFetchUpstream(now, remaining) && entry) {
      return toResponse(entry, "cache", now);
    }

    try {
      const { matches, requestsRemaining, requestResetAt } = await fetchMatches(apiKey);
      entry = {
        matches,
        fetchedAt: now,
        expiresAt: now + API_FETCH_INTERVAL_MS,
        requestsRemaining,
        requestResetAt,
      };
      memoryCache = entry;
      await writeDiskCache(entry);
      return toResponse(entry, "api", now);
    } catch (error) {
      if (entry) {
        entry.expiresAt = Math.max(
          entry.expiresAt,
          now + Math.min(RATE_LIMIT_BACKOFF_MS, OVERTIME_RETRY_MS),
        );
        memoryCache = entry;
        await writeDiskCache(entry);
        return toResponse(entry, "cache", now);
      }
      if (useStaticFallback) {
        return await staticFallbackResponse(now);
      }
      return await staticFallbackResponse(
        now,
        error instanceof Error ? error.message : "Failed to fetch from API",
      );
    }
  }

  return toResponse(entry!, "cache", now);
}
