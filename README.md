# World Cup 2026 Progress Tracker

A progress page for the FIFA World Cup 2026 showing how far through the tournament's **104 matches** you are. The full schedule is baked in — no API key, no backend, no polling external services.

## Features

- **Match progress bar** — completed games out of 104
- **Real time bar** — elapsed tournament time from first kickoff to two hours after the final
- **Live / last completed** match cards
- **Upcoming schedule** — tomorrow and the day after (group stage)
- **Knockout bracket** — auto-activates June 28 with winner/loser propagation from scores
- **Knockout round timeline** — R32 through Final with status
- **FOX / FS1 / Tubi** broadcast labels per match
- **Automatic status** — matches go live at kickoff and complete ~2 hours later
- **Optional manual scores** — edit `src/data/fixtures.json` to add results

## How progress works

Progress is computed locally from kickoff times:

| Time relative to kickoff | Status |
|--------------------------|--------|
| Before kickoff | Not started |
| 0–120 minutes | Live |
| After 120 minutes | Complete |

To record actual scores, edit a match in `src/data/fixtures.json`:

```json
{
  "id": 1,
  "homeGoals": 2,
  "awayGoals": 1,
  "status": "FT"
}
```

Setting `status` to `"FT"` locks that match as complete regardless of time.

## Knockout bracket

From **June 28** (Round of 32), the dashboard swaps the upcoming schedule for a **5-column knockout bracket** (R32 → R16 → QF → SF → Final, plus 3rd-place match).

- Placeholder slots (e.g. `Match 73 Winner`) **auto-fill** when the source match has a final score in `fixtures.json`
- Live knockout matches highlight in red
- Winners show in gold

Preview the bracket before knockout starts:

```bash
# .env.local
NEXT_PUBLIC_PREVIEW_BRACKET=true
```

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

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

## Deploy

Static export — no server or secrets required.

```bash
npm run build
```

Deploy the `out/` directory to any static host (GitHub Pages, S3, Netlify, etc.).
