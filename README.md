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

Register for a free token at [football-data.org](https://www.football-data.org/client/register), then create your local env file (`.env.local` is **not** in Git — secrets stay off GitHub):

```bash
cp .env.example .env.local
```

Edit `.env.local`:

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

### VPS (DigitalOcean)

These steps assume **Ubuntu 24.04** and the **`main`** branch.

**How traffic flows:** Browser → **nginx (port 80/443)** → **Next.js (port 3000, localhost only)**. Do not browse to `http://YOUR_IP:3000` — UFW blocks port 3000 from the internet. Use `http://YOUR_IP` or your domain after nginx is configured.

#### 1. Clone, build, and run the app

The repo is public — no GitHub token needed for `git clone`.

`.env.local` is **not** in Git (secrets stay off GitHub). Copy the template:

```bash
git clone https://github.com/Mascott106/WCProgressTracker.git
cd WCProgressTracker
npm ci && npm run build
mkdir -p data
cp .env.example .env.local
nano .env.local   # set FOOTBALL_DATA_API_KEY (and keep NODE_ENV=production, PORT=3000)
```

Install **PM2** (not included with Node — required to keep the app running after logout):

```bash
sudo npm install -g pm2
pm2 start npm --name wc-progress -- start
pm2 save
pm2 startup   # run the sudo command it prints so PM2 survives reboot
```

Verify the app responds **on the server** (this must work before nginx will help):

```bash
pm2 status
curl -s http://127.0.0.1:3000 | head
curl -s http://127.0.0.1:3000/api/progress | head
```

If `curl` fails, check logs: `pm2 logs wc-progress --lines 30`

On a **512 MB** Droplet, add **swap** before building (prevents `npm run build` from being killed):

```bash
sudo ./scripts/setup-swap.sh
```

Or build on your Mac and deploy with `./scripts/update-site.sh --from-local` (no VPS build needed).

#### 1b. Swap (512 MB droplets — run once)

If `npm run build` exits with `Killed`, the Linux OOM killer ran out of RAM. Add 2 GB of swap:

```bash
cd ~/WCProgressTracker
sudo ./scripts/setup-swap.sh
```

This creates `/swapfile`, enables it immediately, adds it to `/etc/fstab` (survives reboot), and sets `vm.swappiness=10` so swap is used only under memory pressure. Verify with `free -h`.

You can also set a custom size: `sudo ./scripts/setup-swap.sh 3G`

#### 2. Install nginx and open the firewall

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'   # HTTP 80 + HTTPS 443 only — not port 3000
sudo ufw enable
```

If you use a **DigitalOcean Cloud Firewall** on the Droplet, allow inbound **SSH (22)**, **HTTP (80)**, and **HTTPS (443)** there too. You do **not** need to open port 3000 in DigitalOcean networking or UFW.

#### 3. Nginx reverse proxy

If you see the **default "Welcome to nginx"** page at `http://YOUR_IP`, nginx is running but not yet proxying to the app. You must add a site config **and remove the default site**.

Point your domain's **A record** at the Droplet IP when you have one (Certbot requires a domain — it won't issue certs for a bare IP). For HTTP-only testing, use your Droplet IP as `server_name`.

```bash
sudo nano /etc/nginx/sites-available/wc-progress
```

Paste (replace `wc.example.com` with your domain, or your Droplet IP e.g. `67.205.131.84`):

```nginx
server {
    listen 80;
    server_name wc.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable your site, **disable the default welcome page**, and reload:

```bash
sudo ln -sf /etc/nginx/sites-available/wc-progress /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

Visit **http://YOUR_DROPLET_IP** or **http://wc.example.com** — you should see the World Cup tracker, not the nginx welcome page.

#### 4. HTTPS with Let's Encrypt (Certbot)

Once DNS for your domain points at the Droplet:

```bash
sudo certbot --nginx -d wc.example.com
```

Certbot will ask for an email, agree to the terms, and optionally redirect HTTP → HTTPS. Choose **redirect** when prompted so all traffic uses HTTPS.

Test automatic renewal (certs renew via a systemd timer):

```bash
sudo certbot renew --dry-run
```

Certbot edits your nginx config to add SSL. After it runs, your site is available at **https://wc.example.com**.

#### 5. Updates

**On the VPS** (if the droplet has enough RAM to build):

```bash
cd ~/WCProgressTracker
./scripts/update-site.sh
```

**From your Mac** (recommended on 512 MB droplets — builds locally, rsyncs to the server):

```bash
./scripts/update-site.sh --from-local
# or: ./scripts/update-site.sh --from-local deploy@YOUR_DROPLET_IP
```

Manual equivalent:

```bash
cd ~/WCProgressTracker
git pull
npm ci && npm run build
pm2 restart wc-progress
```

The app clears its API cache on each server start.

#### VPS troubleshooting

| What you see | Cause | Fix |
|--------------|-------|-----|
| `http://YOUR_IP:3000` times out | Port 3000 blocked by UFW (by design) | Use `http://YOUR_IP` (port 80) via nginx |
| Default **"Welcome to nginx"** page | Default site still active | Complete step 3 — add `wc-progress` site and `rm default` |
| Blank page / connection refused on port 80 | nginx not installed or UFW blocking 80 | Step 2 — `nginx` + `ufw allow 'Nginx Full'` |
| Port 80 works but wrong page | `proxy_pass` not pointing at app | Confirm `proxy_pass http://127.0.0.1:3000` and PM2 is running |
| `curl localhost:3000` fails on VPS | App not running | `pm2 status`, `pm2 logs wc-progress`, check `.env.local` |
| `pm2: command not found` | PM2 not installed | `sudo npm install -g pm2` |
| No `.env.local` after clone | Env files are gitignored | `cp .env.example .env.local` then edit |
| `npm run build` shows `Killed` | OOM on 512 MB RAM | `sudo ./scripts/setup-swap.sh` or use `./scripts/update-site.sh --from-local` |

To temporarily expose port 3000 for debugging only (not recommended for production):

```bash
sudo ufw allow 3000
# remove later: sudo ufw delete allow 3000
```

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
