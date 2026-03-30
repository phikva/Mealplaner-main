# Overordnet Spec for Mealplaner (MVP)

## 1. Kontekst og mål

Mealplaner skal være en webapp for oppskrifter og måltidsplanlegging. Eksisterende innhold ligger i Sanity Studio (`apps/studio`), og appen bygges som frontend i `apps/web` med moderne stack.

Primært mål for fase 1:
- Gjøre oppskrifter søkbare og filtrerbare for alle brukere
- Gi innloggede brukere mulighet til å favorisere oppskrifter
- Gi innloggede brukere en uke- og månedsvisning for planlegging av måltider
- Vise oversikt over planlagte måltider og makroer per dag/per periode
- Klargjøre enkel betalingsflyt for abonnement med Stripe Checkout

## 2. Scope

### In scope (MVP)
- Offentlig oppskriftsoversikt med filtrering
- Brukerkonto via Supabase Auth
- Basis-abonnement med brukerfunksjoner:
  - Favoritter
  - Legge oppskrifter i måltidsplan
  - Uke- og månedsvisning av plan
  - Makrooversikt basert på oppskriftsdata
- Betaling med Stripe Checkout
- Integrasjon mot Sanity for oppskriftsinnhold
- Integrasjon mot Supabase for brukerdata og plan-data
- Premium-funksjoner styres av abonnementstype definert i Sanity `tier`

### Out of scope (MVP)
- Avansert personalisering utover filtrering/favoritter
- Flere betalingsleverandører enn Stripe
- Native mobilapp
- Komplett redesign av eksisterende Sanity Studio før første release

### Studio-endringer i scope (iterativt, kontrollert)
- Justere `oppskrift`-schema slik at makroregistrering skjer på oppskriftsnivå (ikke ingrediensnivå).
- Beholde datakompatibilitet i overgangsperiode for å unngå at eksisterende oppskrifter mister data.

## 3. Bekreftet stack og beslutninger

- **Frontend:** Next.js (latest), TypeScript, Tailwind CSS, shadcn/ui
- **CMS:** Sanity (eksisterende studio, videreutvikles iterativt)
- **Database/backend services:** Supabase
- **Auth:** Supabase Auth
- **Betaling:** Stripe Checkout
- **Abonnementslogikk:** Feature-gating defineres i Sanity `tier` og håndheves i appen

## 4. Brukere og sentrale brukerhistorier

### Primærbruker
- Person som ønsker å finne oppskrifter og planlegge måltider for uke/måned.

### MVP-brukerhistorier
- Som bruker vil jeg se alle oppskrifter, slik at jeg kan utforske innholdet.
- Som bruker vil jeg filtrere oppskrifter, slik at jeg finner relevante retter raskere.
- Som registrert bruker vil jeg favorisere oppskrifter, slik at jeg enkelt finner dem igjen.
- Som registrert bruker vil jeg legge oppskrifter i en kalender (dag/uke/måned), slik at jeg kan planlegge måltider.
- Som registrert bruker vil jeg se makrooversikt for planlagte måltider, slik at jeg får oversikt over ernæring.
- Som bruker vil jeg kunne kjøpe/aktivere abonnement gjennom en enkel checkout-flyt.

## 5. Funksjonelle krav (MVP)

### 5.1 Oppskrifter
- Vise liste/grid av oppskrifter hentet fra Sanity.
- Vise grunnleggende oppskriftsdetaljer (tittel, bilde, kategorier, makroer der tilgjengelig).
- Navigere til oppskriftsside med detaljer.

### 5.2 Filtrering
- Filter på minst kategori og relevante metadata som finnes i Sanity.
- Kombinerbare filtre (der datagrunnlag støtter det).
- Tydelig nullstilling av filtre.

### 5.3 Auth og brukerprofil
- Registrering, innlogging og utlogging via Supabase Auth.
- Brukerens appdata kobles til autentisert bruker-ID i Supabase.
- **Onboarding (etter innlogging):** vises som en step-by-step wizard (1 skjerm av gangen) i modal og kan åpnes på nytt fra profil (preview).
- **Profilside:** `\/profil` viser og lar brukeren oppdatere navn + preferanser (kosthold/allergier/kjøkken) som lagres i `public.profiles`.

### 5.4 Favoritter
- Innlogget bruker kan legge til/fjerne favoritter.
- Egen visning for brukerens favoritter.

### 5.5 Måltidsplanlegger
- Legge en oppskrift på en bestemt dag.
- Vise plan i:
  - Ukevisning
  - Månedsvisning
- Redigere/fjerne planlagte måltider.

### 5.6 Makrooversikt
- Summere makroer for planlagte måltider per dag.
- Aggregere makroer i uke/måned basert på visning.
- Makroberegning skal bygge på eksplisitte datafelt i oppskrift (`totalKcal`, `totalMakros`).
- Ingrediensnivå-makroer fases ut fra redigeringsflyt i studio, men gamle data migreres trygt først.

### 5.7 Abonnement og betaling
- Basis-abonnement som minimumsnivå i MVP.
- Stripe Checkout for kjøp/aktivering.
- Etter vellykket betaling oppdateres abonnementstatus i systemet.
- Premium-funksjoner skal følge `tier`-definisjon i Sanity (f.eks. recipe access, meal storage, favorites, expert planning).
- `\/abonnement` viser planer (hentes fra Sanity) og markerer brukerens nåværende plan (fra `public.profiles`).

### 5.8 Premium-plan (styrt fra Sanity)
- Premium-plan skal ikke hardkodes i frontend.
- Frontend leser feature-regler fra `tier`-dokument i Sanity.
- Første versjon støtter minst disse feltene fra `tier`:
  - `features[]` (liste fra “Funksjoner”-fanen i studio, vises i UI)
  - `recipeAccess` (begrenset/full + ev. maks antall)
  - `mealStorage` (lagringsvarighet)
  - `favoriteRecipes` (tillatelse + maks favoritter)
  - `expertMealPlanning` (på/av)

## 6. Konseptuell datamodell

### Sanity (innhold)
- Oppskrifter, kategorier og redaksjonelt innhold.
- Eksisterende skjemaer i `apps/studio/schemaTypes` brukes som startpunkt.
- Abonnementsnivå og premium-feature-flagg kommer fra `tier` (inkl. `features[]`).
- Onboarding-innhold kommer fra `onboarding` (med `onboardingSection`-blokker).
- Profilpreferanse-opsjoner kommer fra `brukerprofil`.

### Supabase (applikasjonsdata)
- `users` / profilrelatert appdata (koblet til auth user id)
- `favorites` (user_id, recipe_id, timestamps)
- `meal_plan_entries` (user_id, date, meal_slot, recipe_id, notes)
- `subscriptions` (user_id, status, stripe_customer_id, stripe_subscription_id)

Merk: Endelig tabellstruktur og constraints spesifiseres i teknisk design før implementasjon.

#### `public.profiles` (brukerprofil)
Appen forventer en `profiles`-rad per bruker. Minimumsfelter for dagens flyt:
- `tier_sanity_id`, `tier_slug` (settes via `ensureProfile()` med default tier fra Sanity)
- `full_name`
- `diet_values text[]`
- `allergies text[]`
- `kitchen_category_ids text[]`
- `onboarding_completed boolean`

RLS: brukeren kan kun lese/endre egen rad.

## 7. Nøkkelflyter

1. **Registrering og innlogging**
   - Bruker oppretter konto via Supabase Auth
   - Bruker får tilgang til personlige funksjoner
   - Etter vellykket innlogging: redirect til `/?onboarding=1` og onboarding åpner (kun én gang per bruker)
   - For testing kan passord-login brukes hvis magic link blir rate-limited

2. **Favorisere oppskrift**
   - Innlogget bruker klikker favoritt
   - Favoritt lagres i Supabase
   - Favoritter vises i egen liste

3. **Legge oppskrift i plan**
   - Bruker velger oppskrift + dato
   - Oppføring lagres i `meal_plan_entries`
   - Uke/måned-visning oppdateres

4. **Abonnement via Stripe Checkout**
   - Bruker starter checkout
   - Fullført betaling oppdaterer abonnementstatus
   - Basis-funksjoner for innlogget bruker styres av statusregler definert for MVP

5. **Onboarding preview**
   - Fra `\/profil` kan brukeren trykke “Se onboarding” som åpner `/?onboarding=1&previewOnboarding=1`.
   - Preview skal ikke skrive `onboarding_completed`.

## 8. Ikke-funksjonelle krav

- **Sikkerhet:** RLS i Supabase for alle brukerdata-tabeller.
- **Ytelse:** Fornuftig caching/ISR-strategi for oppskriftsinnhold fra Sanity.
- **Kvalitet:** Type-safe API-kontrakter, testbar domenelogikk, tydelig feilhåndtering.
- **Observability:** Basis logging av kritiske flows (auth, checkout, planlagring).
- **Vedlikeholdbarhet:** Klar separasjon mellom innholdsmodell (Sanity) og brukerdata (Supabase).
- **Dataintegritet ved migrering:** Ingen oppskrift skal miste makrodata i overgang fra ingrediens- til oppskriftsnivå.

## 9. Akseptansekriterier for MVP

- Uautentisert bruker kan se og filtrere oppskrifter.
- Autentisert bruker kan favorisere og avfavorisere oppskrifter.
- Autentisert bruker kan legge til, se og fjerne planlagte måltider i uke- og månedsvisning.
- Makrooversikt vises for planlagte måltider basert på tilgjengelige oppskriftsdata.
- Bruker kan fullføre Stripe Checkout for basis-abonnement.
- Premium-feature-gating følger aktivt `tier`-oppsett i Sanity.
- Nye/oppdaterte oppskrifter registrerer makroer på oppskriftsnivå.
- Eksisterende oppskrifter beholder komplette makrodata etter migrering.

## 10. Migrering av makroer (sikker gjennomføring)

### 10.1 Mål
Flytte operativ bruk av makrodata til oppskriftsnivå (`totalKcal`, `totalMakros`) uten å ødelegge eksisterende oppskrifter.

### 10.2 Sikkerhetskrav før endring
1. Full backup av alle `oppskrift`-dokumenter i Sanity før schema- eller datamigrering.
2. Verifiserbar restore-prosedyre (dry-run i test/prosjektkopi).
3. Migrering kjøres idempotent og loggfører hvilke dokumenter som endres.

### 10.3 Faseplan
- **Fase A (kompatibilitet):**
  - Behold eksisterende felter, innfør oppskriftsnivå som autoritativ kilde i appen.
  - Studio-UI prioriterer oppskriftsnivåfelt for redigering.
- **Fase B (datamigrering):**
  - For oppskrifter uten `totalMakros`/`totalKcal`: beregn/sammenstill fra eksisterende data eller flagg for manuell gjennomgang.
  - Merk dokumenter som migrert.
- **Fase C (opprydding):**
  - Når datakvalitet er bekreftet, fjern/deaktiver ingrediens-makrofelt i studio-input (ikke før).

### 10.4 Validering etter migrering
- 100% av publiserte oppskrifter har gyldig `totalKcal` og `totalMakros` (eller tydelig avviksstatus).
- Ingen reduksjon i antall oppskrifter med komplette ernæringsdata sammenlignet med før migrering.
- Frontend viser identiske eller forbedrede makroverdier etter endring.

## 11. Guardrails for utvikling

Disse reglene gjelder alltid i prosjektet:

1. Følg alltid best practice.
2. Aldri gjett, spekuler eller improviser.
3. Ved usikkerhet: stopp og spør før implementasjon.
4. Ikke finn opp ny logikk uten eksplisitt bestilling.
5. Prioriter enkel, tydelig og vedlikeholdbar løsning (KISS/YAGNI).
6. Unngå premature abstraksjoner og premature optimaliseringer.

## 12. Avklaringer for neste sprint

- Hvilke konkrete felter i Sanity skal være obligatoriske for makroberegning?
- Hvilke filtertyper er obligatoriske i MVP utover kategori?
- Hvordan defineres nøyaktig tilgangsmodell for basis-abonnement (hva er låst/åpent)?
- Skal måned/uke-plan støtte flere måltidstyper per dag i MVP (frokost/lunsj/middag)?
- Hvilke endringer i Sanity Studio må inn først for å støtte frontend fullt ut?
- Skal premium-funksjoner evalueres per request (live fra Sanity) eller via synkronisert cache med TTL?

## 13. Kildegrunnlag

- Repo-rot: `README.md`
- Monorepo: rot `package.json` med npm workspaces (`apps/*`)
- Studio: `apps/studio/package.json`
- Sanity-skjemaer: `apps/studio/schemaTypes`
- Next.js-app: `apps/web`
