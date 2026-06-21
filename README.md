# World Cup 2026 Progress Tracker

Live World Cup 2026 progress for all **104 matches**. Scores and statuses come from [football-data.org](https://www.football-data.org/documentation/quickstart); the local schedule (`fixtures.json`) provides match IDs, knockout structure, and FOX/Tubi broadcast labels.

## Features

- **Match progress bar** — completed games out of 104
- **Real time bar** — elapsed tournament time from first kickoff to two hours after the final
- **Live scores** from football-data.org merged onto the canonical schedule
- **Live / last completed** match cards with flags and winners
- **Upcoming schedule** — rest of today, tomorrow, and the day after (6 AM Eastern day boundaries)
- **Knockout bracket** — auto-activates June 28 with winner/loser propagation
- **FOX / FS1 / Tubi** broadcast labels per match
- **Live-aware polling** — refreshes every minute during live matches and for ~10 minutes after; otherwise waits until the next kickoff
- **Kickoff-based fallback** — live games still show if the API is down or delayed
- **Mock mode** — schedule + time-based status without an API key

## Setup

```bash
git clone https://github.com/Mascott106/WCProgressTracker.git
cd WCProgressTracker
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

Preview the knockout bracket before June 28:

```
NEXT_PUBLIC_PREVIEW_BRACKET=true
```

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

When the API still reports `NS` during play (common on the free tier), kickoff time is used to show **Live** until the API catches up.

## Deploy

Requires a **Node.js host** (VPS, Vercel, Railway, etc.) — not a static export.

```bash
npm run build
npm start
```

Set `FOOTBALL_DATA_API_KEY` in your host's environment variables. Create a writable `data/` directory for the API cache.

### VPS quick start (DigitalOcean)

```bash
git clone https://github.com/Mascott106/WCProgressTracker.git
cd WCProgressTracker
npm ci && npm run build
mkdir -p data
# add .env.local with FOOTBALL_DATA_API_KEY, NODE_ENV=production, PORT=3000
pm2 start npm --name wc-progress -- start
```

On a **512 MB** Droplet, build locally and `rsync` the project to the server instead of running `npm run build` on the VPS.

## Data

| File | Purpose |
|------|---------|
| `src/data/fixtures.json` | All 104 matches (June 11 – July 19, 2026) |
| `src/lib/broadcast.ts` | FOX / FS1 / Tubi assignments per match |
| `scripts/build-fixtures.mjs` | Regenerates `fixtures.json` from the embedded schedule |

Regenerate fixtures after editing the schedule table:

```bash
npm run fixtures
```

## Note on competition access

[FIFA World Cup is included on the free tier](https://www.football-data.org/coverage) — register at [football-data.org](https://www.football-data.org/client/register), copy your token into `FOOTBALL_DATA_API_KEY`, and restart the dev server.

If the API still fails, common causes are a missing/invalid token (400), rate limiting (429), or the 2026 season not being published yet (empty match list). The app falls back to schedule-only mode and shows the error in the footer banner.
