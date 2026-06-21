/**
 * football-data.org free tier: 10 requests/minute (registered).
 * @see https://www.football-data.org/documentation/api
 */
export const FREE_TIER_REQUESTS_PER_MINUTE = 10;

/** Poll every minute while a match is live (+ after full time until lock). */
export const API_FETCH_INTERVAL_MS = 60_000;

/** Keep polling after expected full time for VAR / score corrections. */
export const POST_LIVE_POLL_MS = 30 * 60 * 1000;

/** Wait this long after expected full time before locking a final score. */
export const FINAL_SCORE_LOCK_DELAY_MS = POST_LIVE_POLL_MS;

/** Ignore manual refresh if cache is still fresh. */
export const FORCE_REFRESH_MIN_AGE_MS = API_FETCH_INTERVAL_MS;

/** No matches soon — cache up to 24 hours. */
export const REST_DAY_CACHE_MS = 24 * 60 * 60 * 1000;

/** If a match runs long (ET/penalties), retry at most this often after errors. */
export const OVERTIME_RETRY_MS = 30 * 60 * 1000;

/** When rate-limited (429), back off this long before retrying upstream. */
export const RATE_LIMIT_BACKOFF_MS = 5 * 60 * 1000;

export const MATCH_DURATION_MS = 120 * 60 * 1000;
