# TaxMap

Gamified Canadian federal tax literacy game for Cursor Codechella (Victoria).

## Stack

- **Next.js** (App Router) + Tailwind
- **Convex** (persisted playthroughs, tax/audit logic)
- Deploy: **Render** + **Convex Cloud** — see [docs/deploy.md](docs/deploy.md)

## Docs

- [requirements.md](docs/requirements.md)
- [design.md](docs/design.md)
- [deploy.md](docs/deploy.md)

## Quick start

```bash
npm install

# Dev (local Convex backend is fine while building)
npx convex dev --start 'npm run dev'
# → http://localhost:3000
```

### Before Render / a public URL

Local anonymous Convex (`127.0.0.1:3210`) will not work on the internet. Link a cloud project:

```bash
npx convex login
npx convex dev --configure=new
```

Then follow [docs/deploy.md](docs/deploy.md) for production Convex + Render.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Next.js dev server |
| `npm run dev:backend` | Convex dev sync |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
