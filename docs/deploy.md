# TaxMap Deploy Guide

Ship the hackathon demo on **Convex Cloud** (backend) + **Render** (Next.js web).

---

## Prerequisites

- Node 18+ (Node 20+ recommended)
- npm
- A [Convex](https://www.convex.dev) account
- A [Render](https://render.com) account
- This repo pushed to GitHub (Render deploys from git)

---

## 1. Local development (do this first)

```bash
cd /Users/mattsmith/Desktop/taxmap
npm install

# Terminal A — Convex (creates/links deployment, writes .env.local)
npx convex dev

# Terminal B — Next.js
npm run dev

# Or both:
npm run dev:all
```

Open [http://localhost:3000](http://localhost:3000).

### Link a real Convex Cloud project (required before Render)

If `.env.local` points at `http://127.0.0.1:3210` (anonymous/local agent), that is fine for coding offline, but **judges/Render need Convex Cloud**.

```bash
npx convex login
npx convex dev --configure=new
# pick team + project name e.g. "taxmap"
```

That replaces the local URL with something like `https://happy-animal-123.convex.cloud` in `.env.local`.

`npx convex dev` will:

1. Log you into Convex (browser) when needed
2. Create/link a **dev** deployment
3. Write `NEXT_PUBLIC_CONVEX_URL` into `.env.local`
4. Sync `convex/` and generate `convex/_generated/`

**Always use `npx convex dev` while building.** Do not use `npx convex deploy` until you are ready for production.

### Handy scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Next.js only |
| `npm run dev:all` | Next + Convex together (via `convex dev` + Next) |
| `npm run lint` | ESLint |
| `npm run build` | Production Next build (needs `NEXT_PUBLIC_CONVEX_URL`) |

---

## 2. Production Convex deployment

When the game is demo-ready:

```bash
# Creates/updates the PRODUCTION Convex deployment
npx convex deploy
```

You will get a **production** URL like:

`https://<name>.convex.cloud`

### Deploy key for CI / Render (recommended)

1. Open the [Convex Dashboard](https://dashboard.convex.dev) → your project → **Settings → Deploy Keys**
2. Create a **Production** deploy key
3. Save it as `CONVEX_DEPLOY_KEY` in Render (never commit it)

With a deploy key, Render can run:

```bash
npx convex deploy --cmd 'npm run build'
```

That pushes Convex functions **and** builds Next with the production Convex URL injected.

---

## 3. Deploy the Next.js app on Render

### Option A — Blueprint (`render.yaml`)

1. Push this repo to GitHub
2. Render Dashboard → **New → Blueprint**
3. Select the repo
4. Render reads `render.yaml` and creates a **Web Service**

Set these environment variables on the service:

| Key | Value |
|-----|--------|
| `CONVEX_DEPLOY_KEY` | From Convex dashboard (production deploy key) |
| `NODE_VERSION` | `20` (if not set by blueprint) |

Build command (already in `render.yaml`):

```bash
npm ci && npx convex deploy --cmd 'npm run build'
```

Use a **Production** deploy key (not Preview/Dev). If build logs say `[Development]`, recreate the key under Settings → Deploy Keys → Production.

Start command:

```bash
npm run start
```

### Option B — Manual Web Service

1. **New → Web Service** → connect repo
2. Runtime: **Node**
3. Build command: `npm ci && npx convex deploy --cmd 'npm run build'`
4. Start command: `npm start`
5. Add env var `CONVEX_DEPLOY_KEY` (Production key from Convex → Settings → Deploy Keys)
6. Instance: free/starter is fine for the hackathon

### Option C — Static-ish without deploy key

If you cannot use a deploy key during the event:

1. Locally run `npx convex deploy` once
2. Copy the **production** `NEXT_PUBLIC_CONVEX_URL` from `.env.local` / dashboard
3. On Render, set build to `npm run build` and env:

| Key | Value |
|-----|--------|
| `NEXT_PUBLIC_CONVEX_URL` | `https://your-prod.convex.cloud` |

This works, but you must re-run `npx convex deploy` locally whenever backend code changes.

---

## 4. Post-deploy smoke checklist

- [ ] Landing page loads at your Render URL
- [ ] **New Game** creates a run (check Convex dashboard → Data → `playthroughs`)
- [ ] Refresh `/play` resumes the same cash/season (localStorage + Convex)
- [ ] **Judge Demo** seeds April and opens Tax Office path
- [ ] File return → results screen → Play Again

---

## 5. Demo-day tips

1. Keep `npx convex dev` + `npm run dev` for last-minute fixes
2. Before judges: `npx convex deploy` then trigger a Render deploy (or rely on auto-deploy from `main`)
3. Prefer **Judge Demo** on stage Wi-Fi for a reliable 3-minute climax
4. If Render is slow to build, have `localhost` + a phone hotspot as backup

---

## 6. Environment reference

### `.env.local` (local, gitignored)

```bash
# Written automatically by `npx convex dev`
NEXT_PUBLIC_CONVEX_URL=https://<dev-deployment>.convex.cloud
```

### Render (production)

```bash
CONVEX_DEPLOY_KEY=prod:••••••••
# Optional fallback if not using deploy --cmd:
# NEXT_PUBLIC_CONVEX_URL=https://<prod-deployment>.convex.cloud
```

---

## 7. Troubleshooting

| Symptom | Fix |
|---------|-----|
| “Convex not configured” on localhost | Run `npx convex dev`; confirm `.env.local` exists |
| Build fails: missing `_generated` | Run `npx convex dev` once so types generate; or use `convex deploy --cmd` |
| Playthrough not found after refresh | Cleared site data / different browser; start New Game |
| Render build can’t talk to Convex | Ensure `CONVEX_DEPLOY_KEY` is set and not expired |
| Old backend in prod | Re-run `npx convex deploy` or redeploy Render with deploy key |

---

## 8. What not to do

- Do **not** run `npx convex deploy` as your daily local workflow — use `npx convex dev`
- Do **not** commit `.env.local` or deploy keys
- Do **not** point production Render at a **dev** Convex URL long-term (OK only as emergency demo hack)
