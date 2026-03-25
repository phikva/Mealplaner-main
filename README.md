# Mealplaner

Monorepo: Next.js-app og Sanity Studio.

## Struktur

| Mappe | Innhold |
|--------|---------|
| `apps/web` | Next.js (frontend) |
| `apps/studio` | Sanity Studio og skjemaer |
| `docs/` | Produktspesifikasjon |

## Kom i gang

Fra rot (én `node_modules` via npm workspaces):

```bash
npm install
```

Kopier miljøfiler:

- `apps/web/.env.example` → `apps/web/.env.local`
- Studio: følg eksisterende Sanity-oppsett (`.env` / `sanity.cli.ts` etter behov)

Kjør lokalt:

```bash
npm run dev:web      # http://localhost:3000
npm run dev:studio   # Sanity Studio (standardport)
```

Bygg:

```bash
npm run build:web
npm run build:studio
```

Studio-scripts (fra rot eller `cd apps/studio`):

```bash
npm run backup-recipes -w studio
npm run migrate-recipe-totals -w studio
```

Krever `SANITY_TOKEN` (eller tilsvarende) der scriptene forventer det.

## Deploy (Vercel / hosting)

Sett **Root Directory** til `apps/web` og installer/kjør kommandoer fra monorepo-roten (`npm install`, `npm run build -w web`), eller konfigurer build slik plattformen krever for npm workspaces.
