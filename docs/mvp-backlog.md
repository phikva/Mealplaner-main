# MVP-backlog (prioritert)

Denne listen knytter [product-spec.md](product-spec.md) (§2, §5.4–5.7, §9) til en anbefalt **rekkefølge**. Den erstatter ikke detaljert teknisk design; den styrer hva som bør bygges først.

## Status i korthet

| Område | Spec | Status i repo (overslag) |
|--------|------|---------------------------|
| Oppskriftsliste, detaljer, filtrering | §5.1–5.2 | Implementert (`/oppskrifter`, kategori, URL-filtre) |
| Auth, profil, onboarding | §5.3, §7 | Grunnmur finnes |
| Tiers visning | §5.7–5.8 | `/abonnement` lister planer |
| Favoritter | §5.4 | Implementert: `recipe_favorites`, `/favoritter`, tier fra Sanity (kjør migrasjon 002) |
| Måltidsplan uke/måned | §5.5 | Implementert: `meal_plan_entries`, `/maltidsplanlegger` (dag/uke/måned + makroer; kjør migrasjon 002) |
| Makrooversikt for plan | §5.6 | Avhengig av måltidsplan |
| Stripe + abonnementsstatus | §5.7 | Ikke implementert |
| Tier/feature-gating i app | §5.8, §9 | Typer finnes; håndheving mangler |
| Observability | §8 | Ikke kartlagt |

---

## Fase 1 – Datagrunnlag (Supabase)

**Mål:** Tabeller og RLS som spec beskriver, med migrasjoner i `apps/web/supabase/migrations/`.

1. **`favorites`** – `user_id`, `recipe_id` (Sanity `_id` eller stabilt eksternt nøkkelvalg), timestamps. RLS: bruker ser og endrer kun egne rader.
2. **`meal_plan_entries`** – `user_id`, `date`, `meal_slot` (eller enkel enum), `recipe_id`, ev. `notes`. RLS som over.
3. **`subscriptions`** (eller tilsvarende) – kobling til Stripe (`stripe_customer_id`, `stripe_subscription_id`), `status`, `user_id`. Avklar mot §5.7 og Stripe-webhooks.

**Avhengigheter:** Avklar `recipe_id`-referanse (kun tekst-ID fra Sanity vs. ekstra indeks).

---

## Fase 2 – Betaling (Stripe)

**Mål:** Checkout som oppdaterer abonnementstatus etter vellykket betaling (§5.7).

1. Stripe Checkout-session fra server route (pris/plan fra Sanity `tier` der det er naturlig).
2. Webhook som oppdaterer `profiles` / `subscriptions` konsistent.
3. Miljøvariabler og sikker håndtering av secrets.

**Avhengigheter:** Fase 1 (minst `profiles` finnes allerede; utvid med det som trengs for Stripe).

---

## Fase 3 – Brukergrensesnitt mot data

**Anbefalt rekkefølge:**

1. **Favoritter** – toggle på oppskrift, liste-side «Mine favoritter», koblet til `favorites`.
2. **Måltidsplanlegger** – legge oppskrift på dato, uke- og månedsvisning, redigere/fjerne (§5.5).
3. **Makrooversikt for planlagte måltider** – aggreger per dag/uke/måned fra `totalKcal` / `totalMakros` (§5.6).

---

## Fase 4 – Tier-gating og kvalitet

1. **Feature-gating** – les `tier` fra Sanity (eller cache med avklart strategi, jf. kap. 12) og håndhev `recipeAccess`, `favoriteRecipes`, `expertMealPlanning` osv. i UI og API-ruter.
2. **Observability** – målrettet logging for auth, checkout og planlagring (§8).
3. **Ytelse** – ISR/caching-strategi for Sanity-innhold (§8); egen gjennomgang.

---

## Åpne produktspørsmål

Se [product-spec.md §12](product-spec.md) – bl.a. måltidstyper per dag, obligatoriske Sanity-felter for makro, og cache vs. live tier.
