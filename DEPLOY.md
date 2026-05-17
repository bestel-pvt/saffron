# Deploying Saffron & Co to Railway

This guide walks through deploying the full Saffron & Co stack (Express backend + Vite-built React frontend) to [Railway](https://railway.app).

The same approach works for **Render**, **Fly.io**, or any Node host that supports persistent volumes.

---

## 1. Prerequisites

- A Railway account (free tier works for testing)
- Your Saffron codebase pushed to a GitHub repo
- Railway CLI optional but useful: `npm i -g @railway/cli`

---

## 2. Deploy the project

### Option A — via Railway web UI (easiest)

1. Open https://railway.app/new → **Deploy from GitHub repo**
2. Choose your Saffron repo
3. Railway auto-detects Node + reads `railway.json` + `nixpacks.toml`
4. Wait for first build → it will fail until you set env vars (step 3 below)

### Option B — via Railway CLI

```bash
cd /path/to/saffron
railway login
railway init
railway up
```

---

## 3. Set environment variables

In Railway dashboard → your service → **Variables** tab → add:

| Variable | Value | Notes |
|---|---|---|
| `PORT` | `3001` | Railway typically injects its own — usually safe to omit |
| `NODE_ENV` | `production` | |
| `ADMIN_USERNAME` | `admin` (or whatever you prefer) | Only used on first DB seed |
| `ADMIN_PASSWORD` | **a strong password** | Only applied on first server start — change via DB after |
| `JWT_SECRET` | **32+ char random string** | Generate with `openssl rand -hex 32` |
| `DB_DIR` | `/data` | Points to mounted volume (next step) |
| `UPLOAD_DIR` | `/data/payment-proofs` | EasyPaisa proof images go here |

**Don't skip `JWT_SECRET`.** If unset, admin tokens use a weak default secret and would be compromised the moment the code is public.

---

## 4. Mount a persistent volume

The lowdb file (`db.json`) and uploaded payment-proof images **must** persist across restarts and deploys, or you lose all orders/customers/reviews on every push.

In Railway dashboard → your service → **Volumes** tab:

1. Click **Add Volume**
2. **Mount path:** `/data`
3. **Size:** `1 GB` (more than enough for years of orders + screenshots)
4. Save

Now `DB_DIR=/data` and `UPLOAD_DIR=/data/payment-proofs` point to persistent storage.

---

## 5. Trigger a redeploy

After volume + env vars are set, redeploy from the **Deployments** tab → **Redeploy**, or push a new commit.

Watch the build logs. You should see:

```
✓ Generated 123 products and 11 categories → public/api/
✓ built in 6.5s
[db] Seeded default admin: admin (change ADMIN_PASSWORD env in production!)
[server] Serving frontend from /app/dist
[server] Saffron & Co API listening on http://localhost:3001
```

If you see "Seeded default admin", the admin user was just created. You can log in at `/admin/login` with the `ADMIN_USERNAME` + `ADMIN_PASSWORD` you set.

---

## 6. Get the URL

Railway → your service → **Settings** → **Networking** → **Generate Domain**

You'll get something like `saffron-co-production.up.railway.app`. Click it to test.

For a custom domain (e.g. `saffronco.pk`):
1. **Custom Domain** → add `saffronco.pk` (and `www.saffronco.pk`)
2. Add the CNAME records Railway shows you to your DNS provider (GoDaddy, Cloudflare, etc.)
3. Railway provisions SSL automatically via Let's Encrypt

---

## 7. Smoke test in production

After deploy, verify:

```bash
curl https://your-domain/api/health
# → {"status":"ok","timestamp":"..."}

curl https://your-domain/api/products.json | head
# → first products in JSON

curl -X POST https://your-domain/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"YOUR_ADMIN_PASSWORD"}'
# → {"token":"...","username":"admin"}
```

Then open `https://your-domain/admin/login` in a browser and log in.

---

## 8. Updating production after changes

```bash
git add . && git commit -m "your change"
git push
```

Railway auto-detects the push and redeploys. Build takes 1-2 minutes; existing orders/customers are preserved on the volume.

---

## 9. Backups (recommended)

The `db.json` file is the heart of your business data. Back it up regularly:

### Quick manual backup (one-off)

```bash
railway login
railway link               # link to your service
railway run --service=YOUR_SERVICE_NAME cat /data/db.json > backup-$(date +%F).json
```

### Recommended

Set up a cron job (your laptop, a cheap VPS, or GitHub Actions) to pull `db.json` daily.

Example GitHub Actions snippet (runs daily at midnight UTC):

```yaml
# .github/workflows/db-backup.yml
name: Daily DB backup
on:
  schedule:
    - cron: '0 0 * * *'
  workflow_dispatch:
jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm i -g @railway/cli
      - run: railway login --token=${{ secrets.RAILWAY_TOKEN }}
      - run: railway link --service=YOUR_SERVICE_ID
      - run: |
          DATE=$(date +%F)
          railway run cat /data/db.json > backups/db-$DATE.json
      - uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: "DB backup $(date +%F)"
```

---

## 10. Common issues

### "Failed to load products (404)" in browser
The vite build skipped `generate-api.mjs`. Check the build log. Fix: ensure `npm run build` runs `node scripts/generate-api.mjs && vite build` (already in `package.json`).

### Admin login returns 401 every time
Wrong `ADMIN_PASSWORD` env var, OR the admin was seeded with a different password earlier and the env change doesn't update existing DB. Either:
- Delete `/data/db.json` once (you'll lose orders) and redeploy with new env vars, OR
- SSH into the container (`railway shell`) and re-hash the password manually with bcrypt

### Payment proofs disappear after redeploy
You forgot to mount the volume or `UPLOAD_DIR` isn't pointing to it. Verify both env vars + volume mount.

### `/api/products.json` returns the backend's JSON error
The `express.static(publicApiDir)` middleware isn't finding `public/api/products.json`. Confirm `npm run build` regenerated it; check `dist/api/products.json` exists after build.

### Cold starts on free tier
Railway free tier sleeps after inactivity. Upgrade to **Hobby plan ($5/mo)** for always-on. Or use a cron-pinger service (e.g. UptimeRobot) to hit `/api/health` every 5 minutes.

---

## Architecture summary

```
                   ┌─────────────────────────────┐
                   │   Railway (single service)  │
                   │                              │
   user request →  │  Express :3001               │
                   │   ├── /api/health            │
                   │   ├── /api/products.json     │  (static from dist/api/)
                   │   ├── /api/orders            │  (lowdb)
                   │   ├── /api/admin/*           │  (JWT-guarded)
                   │   ├── /api/reviews           │  (phone-verified)
                   │   └── /* (SPA fallback)      │  (serves dist/index.html)
                   │                              │
                   │  /data (mounted volume)      │
                   │   ├── db.json                │  ← orders, customers, reviews
                   │   └── payment-proofs/        │  ← EasyPaisa screenshots
                   └─────────────────────────────┘
```

One process, one volume. No external DB. No Redis. Simple to run, easy to back up, cheap to host (~$5/mo on Railway Hobby).

For higher scale: swap lowdb → Postgres later. Same code structure; you'd just rewrite `server/db.js` against a different driver.

---

## Going live checklist

- [ ] Strong `ADMIN_PASSWORD` set
- [ ] `JWT_SECRET` rotated to a fresh 32-char random string
- [ ] Volume mounted at `/data`
- [ ] DNS pointed to Railway domain
- [ ] SSL active (auto via Railway)
- [ ] Tested admin login from production URL
- [ ] Test order placed and verified end-to-end
- [ ] Daily backup of `db.json` automated
- [ ] Tested `/api/health` returns 200 (Railway healthcheck depends on this)
- [ ] Updated EasyPaisa account details in code/admin if different from `0344-4183049`
