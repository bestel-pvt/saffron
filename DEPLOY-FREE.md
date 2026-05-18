# Deploying Saffron & Co Free — Render + Neon + Cloudflare R2

This guide deploys Saffron & Co at **zero monthly cost** with production-grade persistence by combining three free-tier services:

| Service | What it stores | Free tier |
|---|---|---|
| **Render** (web service) | Node.js app | 750 hours/mo, custom domain, HTTPS |
| **Neon** (Postgres) | Orders, customers, reviews | 3 GiB, forever free, no card |
| **Cloudflare R2** | EasyPaisa screenshots | 10 GB storage, no egress fees |

**Total: PKR 0/month.**

The trade-off: Render's free web service spins down after 15 minutes of inactivity (cold start ~1 minute on next request). Your data is safe in Neon + R2 across restarts — only the app cold-starts. For light-traffic stores, this is fine; if you get steady orders, upgrade to Render Starter ($7/mo) to keep it always-on.

If you'd rather pay $5/mo for simpler always-on hosting, see `DEPLOY.md` instead (Railway path).

---

## 1. Sign up

Create accounts (no credit card needed for any of them):

- **Render** — https://render.com (sign in with GitHub)
- **Neon** — https://neon.tech (sign in with GitHub)
- **Cloudflare** — https://dash.cloudflare.com (sign in with email; R2 is a free product inside)

---

## 2. Provision Neon Postgres

1. Open https://console.neon.tech/app/projects → **Create Project**
2. **Project name:** `saffron`
3. **Postgres version:** 16 (default is fine)
4. **Region:** pick closest to your customers. For Pakistan, **AWS ap-southeast-1** (Singapore) is the lowest-latency.
5. Click **Create Project**

Neon shows the connection string. Copy it — looks like:
```
postgresql://saffron_owner:abc...@ep-still-mountain-12345.ap-southeast-1.aws.neon.tech/saffron?sslmode=require
```

Save it somewhere safe — this becomes your `DATABASE_URL` in step 5.

No table creation needed — Saffron's backend runs migrations automatically on first boot.

---

## 3. Provision Cloudflare R2

1. Open https://dash.cloudflare.com → **R2 Object Storage** in left sidebar
2. First-time setup may prompt for a payment method *for verification only* — Cloudflare will not charge you within the 10 GB free tier
3. **Create bucket** → Name: `saffron-payment-proofs` (or similar) → **Standard** location → **Create**

### Make the bucket publicly readable

Payment-proof images need to be loadable by the admin browser without R2 credentials.

4. Open the bucket → **Settings** tab
5. Under **Public access**, click **Allow Access** → confirm
6. Copy the **Public R2.dev URL** — looks like `https://pub-abc123def456.r2.dev`

(Optional for production: instead of the `pub-xxx.r2.dev` URL, connect a custom subdomain like `proofs.saffronco.pk` to the bucket — Cloudflare handles the SSL.)

### Create API credentials

7. Back in the R2 home → **Manage R2 API Tokens** (top right)
8. **Create API Token** → **Token name:** `saffron-app`
9. **Permissions:** Object Read & Write
10. **Specify bucket:** `saffron-payment-proofs` (limits the token to this bucket only)
11. **TTL:** Forever
12. Click **Create API Token**

Cloudflare shows you 4 values **just once** — copy all of them:

- **Access Key ID**
- **Secret Access Key**
- **S3 endpoint** (looks like `https://<account_id>.r2.cloudflarestorage.com`)
- **Account ID** (extracted from the endpoint URL)

---

## 4. Deploy to Render

1. Push your Saffron repo to GitHub if not already
2. Open https://dashboard.render.com → **New +** → **Web Service**
3. **Connect a repository** → select your Saffron repo
4. Configure:

| Field | Value |
|---|---|
| **Name** | `saffron-co` (or anything; this becomes your `.onrender.com` subdomain) |
| **Region** | **Singapore** (closest to Pakistan) |
| **Branch** | `main` |
| **Runtime** | **Node** |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `node server/index.js` |
| **Instance Type** | **Free** |

5. Scroll down to **Environment Variables** — add all of these:

```
STORAGE_BACKEND        = postgres
DATABASE_URL           = postgresql://...neon.tech/saffron?sslmode=require    (from step 2)
JWT_SECRET             = run `openssl rand -hex 32` and paste the output
ADMIN_USERNAME         = admin
ADMIN_PASSWORD         = <a strong password — saved on first boot, change via DB later>
NODE_ENV               = production

R2_ACCOUNT_ID          = <from step 3>
R2_ACCESS_KEY_ID       = <from step 3>
R2_SECRET_ACCESS_KEY   = <from step 3>
R2_BUCKET              = saffron-payment-proofs
R2_PUBLIC_URL          = https://pub-xxxxx.r2.dev   (your public bucket URL from step 3)
```

6. Click **Create Web Service**

Render builds and deploys (first build takes 2-3 minutes). Watch the build log — you should see:

```
[db-pg] Migrations applied
[db-pg] Seeded default admin: admin
[store] Using Postgres backend
[orders] Payment proof storage: Cloudflare R2
[server] Saffron & Co API listening on http://localhost:3001
```

When the health check passes (~30 sec after build), the service is live.

---

## 5. Get the URL

Render shows your app URL at the top of the service page — typically `https://saffron-co.onrender.com`.

For a custom domain:
1. **Settings** → **Custom Domains** → **Add Custom Domain**
2. Enter `saffronco.pk` (and `www.saffronco.pk`)
3. Add the CNAME records Render gives you to your DNS provider (GoDaddy, Cloudflare, etc.)
4. Render auto-provisions Let's Encrypt SSL within ~5 minutes

---

## 6. Smoke test

```bash
# Health
curl https://saffron-co.onrender.com/api/health
# → {"status":"ok","timestamp":"..."}

# Products endpoint (static JSON)
curl https://saffron-co.onrender.com/api/products.json | head

# Admin login
curl -X POST https://saffron-co.onrender.com/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"YOUR_ADMIN_PASSWORD"}'
# → {"token":"...","username":"admin"}
```

Open the URL in a browser, place a test order with EasyPaisa, upload a proof image — verify:

- Order shows up in admin panel (proves Neon Postgres works)
- The proof image loads in the admin panel (proves R2 works)

---

## 7. Cold start handling

Render's free instance spins down after 15 minutes of inactivity. The first request after a cold spell takes ~1 minute. After that, the service is fast and stays warm.

To minimise cold starts for early customers, two options:

**Option A — UptimeRobot (free):**
1. Sign up at https://uptimerobot.com
2. Add a new HTTP(s) monitor
3. URL: `https://saffron-co.onrender.com/api/health`
4. Interval: **5 minutes**

This keeps the instance warm 24/7 without consuming much of your 750 hours/mo (since the instance is already running anyway).

**Option B — accept the cold start.** For a low-traffic store, customers landing during off-hours wait ~1 minute on first page load, then everything is fast. Many Pakistani e-commerce stores running on free hosting do this.

---

## 8. Backups

Neon includes automatic backups (point-in-time recovery within the last 24 hours on free tier). For longer retention, set up periodic exports.

### Easy manual backup

```bash
# Install pg_dump (already on most systems)
pg_dump "postgresql://...neon.tech/saffron?sslmode=require" > backup-$(date +%F).sql
```

### Automated daily backup via GitHub Actions

Create `.github/workflows/db-backup.yml`:

```yaml
name: Daily DB backup
on:
  schedule:
    - cron: '0 2 * * *'  # 2 AM UTC = 7 AM PKT
  workflow_dispatch:
jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install pg_dump
        run: sudo apt-get install -y postgresql-client
      - name: Dump DB
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: |
          mkdir -p backups
          pg_dump "$DATABASE_URL" > backups/db-$(date +%F).sql
          # keep only last 30 days
          find backups -name "db-*.sql" -mtime +30 -delete
      - uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: "DB backup $(date +%F)"
```

Add `DATABASE_URL` as a GitHub repo secret (Settings → Secrets and variables → Actions).

R2 doesn't need explicit backup — Cloudflare manages durability internally.

---

## 9. Switching back to lowdb locally

For local development, you don't want to touch your production Neon DB. Don't set `STORAGE_BACKEND` or `DATABASE_URL` locally — the app falls back to lowdb (a `db.json` file in `server/data/`) and local disk for payment proofs.

```bash
# Local development — no env vars needed
npm run dev
# → "[store] Using lowdb (local JSON) backend"
# → "[orders] Payment proof storage: local disk"
```

To test locally against your production Neon DB instead (useful for debugging production data), set the env vars before running:

```bash
export STORAGE_BACKEND=postgres
export DATABASE_URL="postgresql://...neon.tech/..."
export R2_ACCOUNT_ID=...
# ... (all R2 vars)
npm run dev
```

⚠️ Be careful — you're touching the real database. Don't run destructive queries.

---

## 10. Going-live checklist

- [ ] `JWT_SECRET` is a fresh 32-char random string (not "test_secret")
- [ ] `ADMIN_PASSWORD` is strong and not committed to git
- [ ] Neon DB region matches Render region (both Singapore → low latency)
- [ ] R2 bucket public access is enabled
- [ ] Test order placed → appears in admin
- [ ] Test payment proof uploaded → loads in admin panel
- [ ] Custom domain configured + SSL active
- [ ] UptimeRobot or similar pinging `/api/health` every 5 min
- [ ] Daily backup workflow active in GitHub Actions
- [ ] `EasyPaisa account 0344-4183049` updated to YOUR real EasyPaisa account if different

---

## 11. Costs at scale (when free isn't enough)

| Trigger | Upgrade path | Cost |
|---|---|---|
| Need always-on (no cold start) | Render Starter | $7/mo |
| 100s of orders/day, DB > 3 GiB | Neon Launch | $19/mo (10 GiB) |
| Lots of payment proofs (> 10 GB) | R2 stays cheap | $0.015/GB/mo beyond free tier |

Even at scale, this stack stays under $30/mo — much cheaper than Shopify equivalents.

---

## Architecture

```
                      ┌─────────────────────────────┐
                      │   Render (free tier)        │
   user request   →   │   Node + Express :3001      │
                      │     ├─ static frontend (dist/) │
                      │     ├─ /api/* dynamic        │
                      │     ├─ multer in-memory     │
                      │     └─ pg client            │
                      └──┬──────────────────┬───────┘
                         │                  │
                         ▼                  ▼
              ┌─────────────────┐  ┌────────────────────┐
              │   Neon Postgres │  │  Cloudflare R2     │
              │   (free 3 GiB)  │  │  (free 10 GB)      │
              │   orders, etc.  │  │  payment proofs    │
              └─────────────────┘  └────────────────────┘
```

Stateless app + external state stores = data survives every redeploy, scale-down, and even total Render service deletion. The app is disposable; your business data is not.

---

## Troubleshooting

### `[db-pg] Migrations applied` doesn't appear in logs
`STORAGE_BACKEND=postgres` not set, or `DATABASE_URL` missing/wrong. Render's log will fall back to `[store] Using lowdb (local JSON) backend` — but since Render free has no persistent disk, lowdb data will vanish on every restart. Always set both env vars.

### `Error: getaddrinfo ENOTFOUND ep-something.neon.tech`
Neon connection string typo. Copy it again from Neon dashboard. Ensure `?sslmode=require` is at the end.

### Payment proof shows "404" in admin panel
- Check `R2_PUBLIC_URL` is the **public r2.dev URL** (not the S3 endpoint URL)
- Check the bucket has **Public access enabled** in R2 Settings tab
- Try the proof URL directly in browser — should show the image

### Admin login returns 401 immediately after first deploy
Wrong `ADMIN_PASSWORD` env var, or `ADMIN_USERNAME`/`ADMIN_PASSWORD` was set after first boot. The admin user is seeded ONCE on first connection to an empty DB; subsequent env changes don't update the existing admin. To fix: connect to Neon via their dashboard SQL editor and run:

```sql
-- generate hash locally: node -e "console.log(require('bcryptjs').hashSync('NEW_PASSWORD', 10))"
UPDATE admins SET password_hash = '<paste hash>' WHERE username = 'admin';
```

### Render build fails with "out of memory"
Free tier has 512 MB build memory. The build *should* fit but if it ever doesn't, add `NODE_OPTIONS=--max-old-space-size=400` to env vars to cap Node's heap.

### Service has been idle and won't wake up
Render shows "Suspended due to free tier limits" → you've used all 750 hours this month. Either wait until the 1st of next month, or upgrade to paid.
