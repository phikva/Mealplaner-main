# Mealplaner

Monorepo: Next.js-app og Sanity Studio.

## Struktur

| Mappe | Innhold |
|--------|---------|
| `apps/web` | Next.js (frontend) |
| `apps/studio` | Sanity Studio og skjemaer |
| `docs/` | [Produktspesifikasjon](docs/product-spec.md), [MVP-backlog](docs/mvp-backlog.md) |

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

## Supabase auth (magic link)

- **Logg inn**: `http://localhost:3000/logg-inn` (magic link eller passord)
- **Registrering**: `http://localhost:3000/registrering`
- **Callback route**: `/auth/callback`
- **Profil**: `http://localhost:3000/profil`
- **Abonnement**: `http://localhost:3000/abonnement`

I Supabase Dashboard må du sette redirect URLs:

- `http://localhost:3000/auth/callback`
- `https://<din-produksjonsdomain>/auth/callback`

Når en bruker logger inn, sørger appen for at det finnes en rad i `public.profiles` og setter default tier fra Sanity (der `tier.isDefault == true`).

### Testing uten magic-link rate limit
Supabase kan rate-limite utsending av magic links. For lokal testing kan du bruke passord-login (opprett bruker med passord i Supabase Dashboard → Authentication → Users).

### `POST /api/ensure-profile`
Dette endepunktet kjører `ensureProfile()` server-side og synker:
- `tier_sanity_id` / `tier_slug` (default fra Sanity hvis mangler)
- `email`

Det brukes spesielt for passord-login og som fallback hvis tier mangler.

## Supabase database: `public.profiles`
Migrationsfila ligger i `apps/web/supabase/migrations/001_profiles.sql`, men må kjøres i Supabase (SQL Editor eller via migrations/CLI).

Minstekolonner som appen forventer:

```sql
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  tier_sanity_id text,
  tier_slug text,
  full_name text,
  diet_values text[],
  allergies text[],
  kitchen_category_ids text[],
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

RLS: brukeren kan kun lese/endre sin egen rad (se `apps/web/supabase/migrations/001_profiles.sql`).

## Favoritter og måltidsplan (Supabase)

Kjør også `002_recipe_favorites_and_meal_plan.sql` og deretter `003_meal_plan_sort_order.sql` i Supabase SQL Editor. Tabellene `recipe_favorites` og `meal_plan_entries` (dato, `sort_order` for rekkefølge per dag, oppskrift) har RLS slik at brukeren kun ser egne rader.



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

## Deploy Sanity Studio

Deploy Studio fra monorepo-roten:

```bash
npm run deploy -w studio
```

Studio blir publisert til:

- [https://foodapptest1337.sanity.studio/](https://foodapptest1337.sanity.studio/)

Hvis du trenger å bygge lokalt før deploy:

```bash
npm run build:studio
```
