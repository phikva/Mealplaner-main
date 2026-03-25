const { createClient } = require('@sanity/client')

const projectId = process.env.SANITY_PROJECT_ID || 'nxq0o4ir'
const dataset = process.env.SANITY_DATASET || 'production'
const token = process.env.SANITY_TOKEN

if (!token) {
  console.error('Missing SANITY_TOKEN environment variable.')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2026-03-25',
  token,
  useCdn: false,
})

const asNumber = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : 0)

const hasNumber = (value) => typeof value === 'number' && Number.isFinite(value)

function buildTotalsFromIngredients(ingredients) {
  if (!Array.isArray(ingredients)) {
    return null
  }

  let totalKcal = 0
  let protein = 0
  let karbs = 0
  let fett = 0
  let hasAnyMacroData = false

  for (const ingredient of ingredients) {
    const kcal = asNumber(ingredient?.kcal)
    const p = asNumber(ingredient?.makros?.protein)
    const c = asNumber(ingredient?.makros?.karbs)
    const f = asNumber(ingredient?.makros?.fett)

    if (kcal !== 0 || p !== 0 || c !== 0 || f !== 0) {
      hasAnyMacroData = true
    }

    totalKcal += kcal
    protein += p
    karbs += c
    fett += f
  }

  if (!hasAnyMacroData) {
    return null
  }

  return {
    totalKcal,
    totalMakros: {
      protein,
      karbs,
      fett,
    },
  }
}

function hasRecipeTotals(recipe) {
  const hasTotalKcal = hasNumber(recipe?.totalKcal)
  const hasProtein = hasNumber(recipe?.totalMakros?.protein)
  const hasKarbs = hasNumber(recipe?.totalMakros?.karbs)
  const hasFett = hasNumber(recipe?.totalMakros?.fett)
  return hasTotalKcal || hasProtein || hasKarbs || hasFett
}

async function migrateRecipeTotals() {
  const recipes = await client.fetch(
    `*[_type == "oppskrift"]{_id, tittel, ingrediens, totalKcal, totalMakros}`
  )

  let skippedExistingTotals = 0
  let skippedNoIngredientData = 0
  let updated = 0

  for (const recipe of recipes) {
    if (hasRecipeTotals(recipe)) {
      skippedExistingTotals++
      continue
    }

    const computed = buildTotalsFromIngredients(recipe.ingrediens)
    if (!computed) {
      skippedNoIngredientData++
      continue
    }

    await client
      .patch(recipe._id)
      .set({
        totalKcal: computed.totalKcal,
        totalMakros: computed.totalMakros,
      })
      .commit()

    updated++
    console.log(`Migrated totals for: ${recipe.tittel || recipe._id}`)
  }

  console.log('\nMigration complete')
  console.log(`Updated: ${updated}`)
  console.log(`Skipped (already had totals): ${skippedExistingTotals}`)
  console.log(`Skipped (no ingredient macro data): ${skippedNoIngredientData}`)
}

migrateRecipeTotals().catch((error) => {
  console.error('Migration failed:', error)
  process.exit(1)
})
