# Runbook

Operational playbook for the World Cup 2026 Progress Tracker in production. This assumes the [VPS deploy setup](README.md#vps-digitalocean) — nginx → PM2 (`wc-progress`) → Next.js on `127.0.0.1:3000`.

Keep this doc updated as the deploy shape changes. If a scenario below is wrong or missing after an incident, fix it while the details are fresh.

## Archived tournament

The site is frozen: **`TOURNAMENT_ARCHIVED`** in `src/lib/football-data.ts` serves [`src/data/tournament-results.json`](src/data/tournament-results.json) only. Deploy/restart will **not** call football-data.org or refresh live scores. Footer shows source **archive**; the Refresh control is hidden.

To correct a score after archive, edit the matching entry in `tournament-results.json` (or use `data/manual-scores.json` pins) and redeploy.

## Quick reference

| Task | Command |
|---|---|
| Check app status | `pm2 status` |
| Tail logs | `pm2 logs wc-progress --lines 50` |
| Restart app | `pm2 restart wc-progress` |
| Health check (on VPS) | `curl -sf http://127.0.0.1:3000/api/progress \| head` |
| Confirm archive | `curl -s http://127.0.0.1:3000/api/progress \| jq '{source:.meta.source, completed:.data.completedGames, final:.data.finalMatchStatus}'` |
| Deploy latest `main` | `./scripts/update-site.sh` (on VPS) or `./scripts/update-site.sh --from-local` (from Mac) |
| Pin a wrong score | `./scripts/pin-score.sh MATCH_ID HOME AWAY "note"` then `pm2 restart wc-progress` |
| Remove a pin | `./scripts/unpin-score.sh MATCH_ID` then `pm2 restart wc-progress` |
| Reload nginx after config change | `sudo nginx -t && sudo systemctl reload nginx` |

SSH target for `update-site.sh --from-local` defaults to `deploy@67.205.131.84` (override with `DEPLOY_HOST`).

---

## 1. A match score is wrong on the site

**Symptom:** football-data.org reports a score that's incorrect or stuck (e.g. VAR overturned a goal and the API never updated), and it's visible on the live dashboard or bracket.

1. Confirm the correct score and get the match ID from `src/data/fixtures.json` (search by team names or kickoff time).
2. Pin the score:
   ```bash
   ./scripts/pin-score.sh MATCH_ID HOME_GOALS AWAY_GOALS "why — e.g. VAR disallowed 5th goal, API stuck at 5-0"
   pm2 restart wc-progress
   ```
3. Verify on the live site: refresh the dashboard, check the match card and (if applicable) the knockout bracket for correct winner propagation.
4. Leave the pin in place — pinned scores survive restarts and are skipped by auto-lock, so no further action is needed once the API eventually corrects itself.
5. **Only if you later want the API to drive that match again** (e.g. you pinned prematurely):
   ```bash
   ./scripts/unpin-score.sh MATCH_ID
   pm2 restart wc-progress
   ```

Reference: `manual-scores.example.json` for the on-disk format; pins live in `data/manual-scores.json` (gitignored, VPS-local — not synced by git pull or rsync).

---

## 2. Site is down / not loading

**Symptom:** `http://` or `https://` domain returns an error, times out, or shows the wrong content.

1. **Check nginx is serving the right thing:**
   ```bash
   curl -sI http://127.0.0.1  # from VPS, should proxy through
   ```
   - Default **"Welcome to nginx"** page → the `wc-progress` site isn't enabled or the default site wasn't removed. Re-check `/etc/nginx/sites-enabled/` — should contain `wc-progress`, not `default`.
   - Connection refused on 80/443 → nginx isn't running (`sudo systemctl status nginx`) or UFW is blocking (`sudo ufw status`, should allow `Nginx Full`).

2. **Check the app itself is up:**
   ```bash
   pm2 status
   curl -sf http://127.0.0.1:3000/api/progress
   ```
   - If PM2 shows `wc-progress` as `errored` or `stopped`: `pm2 logs wc-progress --lines 50` to see why, then `pm2 restart wc-progress`.
   - If PM2 shows it `online` but curl fails/hangs: check logs for a crash loop or an unhandled exception on startup (often a missing/invalid `.env.local`).

3. **Check `.env.local` exists and is populated** (VPS-only file, not in git):
   ```bash
   cat .env.local   # confirm FOOTBALL_DATA_API_KEY, NODE_ENV=production, PORT=3000
   ```
   If missing: `cp .env.example .env.local` and fill in the API key, then `pm2 restart wc-progress`.

4. **If none of the above resolves it**, see [§5 Rollback](#5-rollback-a-bad-deploy).

Never browse to `http://YOUR_IP:3000` directly — UFW blocks port 3000 from the internet by design. Always go through nginx on port 80/443.

---

## 3. Deploying an update

**Normal update (VPS has enough RAM to build — 1 GB+ droplet):**
```bash
cd ~/WCProgressTracker
./scripts/update-site.sh
```
This pulls `main`, runs `npm ci && npm run build`, restarts PM2, and health-checks `/api/progress` for up to ~20s before failing loudly.

**512 MB droplet (recommended path — builds locally, avoids OOM):**
```bash
./scripts/update-site.sh --from-local
# or explicitly: ./scripts/update-site.sh --from-local deploy@67.205.131.84
```
This builds on your Mac, rsyncs the build output to the VPS (excluding `node_modules`, `.git`, `.env*`, `data/`), installs production deps remotely, restarts PM2, and health-checks over SSH.

**Before deploying, sanity-check locally:**
```bash
npm run lint
npm test        # if a test runner is configured — see package.json "scripts"
npm run build   # runs fixtures + i18n:check + next build; catches most issues before they hit prod
```
There is no CI gate yet — this manual check is the only thing standing between a bad commit and production. Do not skip it during matchdays.

**After deploying:** watch `pm2 logs wc-progress --lines 30` for a minute and load the site in a browser to confirm the dashboard renders and the footer shows a live API quota (`remaining/limit`), not an error banner.

---

## 4. Build fails with `Killed` (OOM)

**Symptom:** `npm run build` exits abruptly with `Killed` on the VPS — the Linux OOM killer terminated it (common on 512 MB droplets).

1. One-time fix — add swap:
   ```bash
   cd ~/WCProgressTracker
   sudo ./scripts/setup-swap.sh        # 2G default
   sudo ./scripts/setup-swap.sh 3G     # custom size
   ```
   Verify with `free -h` and `swapon --show`.
2. Going forward, prefer `./scripts/update-site.sh --from-local` on small droplets so the build never runs on the VPS at all.

---

## 5. Rollback a bad deploy

There's no automated rollback — do it manually via git.

1. Find the last known-good commit:
   ```bash
   cd ~/WCProgressTracker
   git log --oneline -10
   ```
2. Reset to it and rebuild:
   ```bash
   git checkout <good-commit-sha>
   npm ci && npm run build
   pm2 restart wc-progress
   curl -sf http://127.0.0.1:3000/api/progress
   ```
3. Once stable, decide whether to fix forward on `main` or leave the VPS pinned to the old commit until a fix lands. If leaving it pinned, note it somewhere visible (e.g. a comment in this file or a Slack/notes message to yourself) so a future `git pull` doesn't silently re-apply the bad commit.
4. When the fix is ready: `git checkout main && git pull && npm ci && npm run build && pm2 restart wc-progress`.

---

## 6. HTTPS / certificate issues

**Symptom:** browser shows a certificate warning, or `https://` doesn't work.

1. Confirm DNS actually points at the droplet: `dig +short wc.example.com` should return the droplet IP.
2. Re-run certbot if the cert is missing or misconfigured:
   ```bash
   sudo certbot --nginx -d wc.example.com
   ```
3. Certs auto-renew via a systemd timer. To confirm renewal still works:
   ```bash
   sudo certbot renew --dry-run
   ```
4. If nginx config looks wrong after a certbot run, check `/etc/nginx/sites-available/wc-progress` for the SSL block certbot injected, then `sudo nginx -t && sudo systemctl reload nginx`.

---

## 7. API rate limiting / stale data

**Symptom:** footer shows `0/10 left` or scores appear stale during a live match.

This is expected occasionally on the free tier (10 req/min) — the app caches and serves stale data on 429 rather than erroring. No action needed unless it persists for more than the current live window (~30 min post-match).

If it persists:
1. Check `data/cache.json` timestamp on the VPS to confirm the app is actually re-fetching.
2. Check `pm2 logs wc-progress` for repeated 429s or auth failures (401/400 usually means `FOOTBALL_DATA_API_KEY` is missing or invalid).
3. Confirm the key is valid by hitting the API directly:
   ```bash
   curl -s -H "X-Auth-Token: YOUR_TOKEN" "https://api.football-data.org/v4/competitions/WC/matches?season=2026" | head
   ```
4. As a last resort, restarting the app clears the in-memory cache and forces a fresh fetch: `pm2 restart wc-progress` (respect the 1-min TTL — don't restart-loop to force-refresh, you'll burn the rate limit).

---

## 8. Timezone / DST weirdness

**Symptom:** upcoming schedule shows matches on the wrong day, or times look off by an hour around a DST boundary.

1. Reproduce locally with the viewer's timezone: use the footer timezone picker to switch to the affected IANA zone and reload.
2. Check `src/lib/timezones.ts` and the tests in `src/lib/timezones.test.ts` / `schedule-day.test.ts` — these cover DST boundary cases; a regression here usually means a new edge case wasn't covered.
3. If a fix is needed, add a test case reproducing the exact date/zone before patching — this class of bug regresses easily.

---

## 9. Missing or broken translations

**Symptom:** UI shows a raw key (e.g. `schedule.upcoming.title`) instead of translated text, or `npm run build` fails i18n check.

1. Run the checker directly for details:
   ```bash
   npm run i18n:check
   ```
2. It validates all locale files in `locales/` have the same keys as `en.json` (the source of truth). Fix the reported file, re-run.
3. See `locales/README.md` for key conventions (plurals, nerd-mode `{ normal, nerd }` pairs) before editing.

---

## 10. Backup / data recovery

`data/` on the VPS (`cache.json`, `locked-scores.json`, `manual-scores.json`) is gitignored and **not** part of any deploy sync — it only exists on the VPS itself.

- `cache.json` — safe to lose; it's regenerated from the API on next request.
- `locked-scores.json` — auto-generated finalized scores; regenerable from the API, but if the API is wrong for a finished match, this is your only record of what was previously correct until you re-pin it.
- `manual-scores.json` — **not recoverable from the API by definition** (that's the whole point — it holds the corrections the API doesn't have). This is the one file worth backing up.

Recommended: before any deploy or VPS maintenance, snapshot it:
```bash
cp ~/WCProgressTracker/data/manual-scores.json ~/manual-scores.backup.$(date +%Y%m%d).json
```
There's no automated backup job for this yet — see the planning notes for adding one before the tournament gets underway (matchday corrections are exactly when you can't afford to lose this file).

---

## Escalation / known limits

- Single VPS, single PM2 process — no failover. An OS-level crash or droplet outage takes the site down until manually restarted.
- No error tracking or alerting — issues are only caught by manually checking logs or a user reporting them. Check `pm2 logs wc-progress` proactively during high-traffic windows (kickoffs, knockout rounds).
- No CI — a broken build or failing test can reach `main` and only surfaces at deploy time via `update-site.sh`'s health check. Run `npm run build` locally before every push during the tournament window.
