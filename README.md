# World Cup 2026 Progress Tracker (API-driven)

API-driven fork of the progress tracker. Live scores and statuses come from [football-data.org](https://www.football-data.org/documentation/quickstart); the local schedule (`fixtures.json`) provides match IDs, knockout structure, and FOX/Tubi broadcast labels.

**Static version:** see the `main` branch (no API key, static export).

## Features

Everything from the static app, plus:

- **Live scores** from football-data.org merged onto the canonical 104-match schedule
- **Live-aware polling** — refreshes every minute during live matches and for ~10 minutes after; otherwise waits until the next kickoff
- **API usage footer** — remaining requests per minute and cache expiry
- **Mock mode** — fall back to time-based static progress without an API key

## Setup

```bash
npm install
cp .env.example .env.local
```

Register for a free token at [football-data.org](https://www.football-data.org/client/register), then add it to `.env.local`:

```
FOOTBALL_DATA_API_KEY=your_token_here
```

Or preview without a key:

```
NEXT_PUBLIC_USE_MOCK=true
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## API usage strategy (free tier)

football-data.org free plan: **10 requests/minute** ([docs](https://www.football-data.org/documentation/api)). This app polls **once per minute only while a match is live (plus ~10 minutes after)**, then caches until the next kickoff — typically **1–2 calls per match day**.

One call fetches all 104 matches:

```
GET https://api.football-data.org/v4/competitions/WC/matches?season=2026
X-Auth-Token: YOUR_TOKEN
```

Protections built in:

- Server-side cache (memory + `data/cache.json`) — **1 min TTL during live windows**, up to **24h** on rest days; **cleared on server start** so stale TTLs never carry over
- Manual refresh blocked while the current cache is still fresh
- **429** responses extend cache and serve stale data instead of retrying

The footer shows your football-data.org **per-minute** quota as `remaining/limit` (e.g. `9/10 left · per minute` on the free tier), plus when the rolling counter resets. This is not a daily limit.

## Architecture

```
Browser → GET /api/progress
              ↓
         football-data.ts (cache)
              ↓ (on cache miss)
         football-data.org v4: /competitions/WC/matches
              ↓
         merge-api.ts — overlay scores/status on fixtures.json
              ↓
         progress.ts — shared UI logic (bracket, schedule, bars)
```

Status mapping from football-data.org:

| API status | Display |
|------------|---------|
| SCHEDULED, TIMED | Not started |
| LIVE, IN_PLAY, PAUSED | Live |
| FINISHED | Full time (+ AET/PEN from duration) |

## Deploy

Requires a **Node.js host** (Vercel, etc.) — not a static export.

```bash
npm run build
npm start
```

Set `FOOTBALL_DATA_API_KEY` in your host's environment variables.

## Branches

| Branch | Data source | Deploy |
|--------|-------------|--------|
| `main` | Static `fixtures.json` | Static (`out/`) |
| `api-driven` | football-data.org + fixtures merge | Node server |

## Note on competition access

[FIFA World Cup is included on the free tier](https://www.football-data.org/coverage) — register at [football-data.org](https://www.football-data.org/client/register), copy your token into `FOOTBALL_DATA_API_KEY`, and restart the dev server.

If the API still fails, common causes are a missing/invalid token (400), rate limiting (429), or the 2026 season not being published yet (empty match list). The app falls back to schedule-only mode and shows the error in the footer banner.
