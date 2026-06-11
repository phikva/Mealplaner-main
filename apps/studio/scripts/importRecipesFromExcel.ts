import {createClient} from '@sanity/client'
import * as fs from 'fs'
import * as path from 'path'
import {v4 as uuidv4} from 'uuid'
import * as XLSX from 'xlsx'

const VALID_MEASUREMENT_UNITS = new Set(['gram', 'liter', 'dl', 'kg'])

const projectId = process.env.SANITY_PROJECT_ID || 'nxq0o4ir'
const dataset = process.env.SANITY_DATASET || 'production'
const token = process.env.SANITY_TOKEN

type Row = Record<string, unknown>

type Ingredient = {
  _key: string
  name: string
  measurement?: {unit: string; unitQuantity: number}
  mengde?: string
  kommentar?: string
}

type SanityRecipe = {
  _type: 'oppskrift'
  tittel: string
  slug: {_type: 'slug'; current: string}
  image?: {_type: 'image'; asset: {_type: 'reference'; _ref: string}}
  porsjoner: number
  kategori?: Array<{_type: 'reference'; _ref: string; _key: string}>
  dietTags?: string[]
  allergens?: string[]
  ingrediens: Ingredient[]
  instruksjoner: string[]
  notater?: string
  totalKcal?: number
  totalMakros?: {protein?: number; karbs?: number; fett?: number}
}

function parseArgs(argv: string[]) {
  const args = {
    file: path.resolve(__dirname, '../../web/public/sanity_oppskrift_excel_importmal.xlsx'),
    dryRun: false,
    all: false,
    output: '',
  }

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--dry-run') {
      args.dryRun = true
    } else if (arg === '--all') {
      args.all = true
    } else if (arg === '--file' && argv[i + 1]) {
      args.file = path.resolve(argv[++i])
    } else if (arg === '--output' && argv[i + 1]) {
      args.output = path.resolve(argv[++i])
    } else if (!arg.startsWith('-')) {
      args.file = path.resolve(arg)
    }
  }

  return args
}

function asString(value: unknown): string {
  if (value == null) return ''
  return String(value).trim()
}

function asNumber(value: unknown): number | undefined {
  const text = asString(value)
  if (!text) return undefined
  const num = Number(text.replace(',', '.'))
  return Number.isFinite(num) ? num : undefined
}

function parsePipe(value: unknown): string[] {
  const text = asString(value)
  if (!text) return []
  return text
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean)
}

function isTruthyJa(value: unknown): boolean {
  return asString(value).toLowerCase() === 'ja'
}

function readSheetRows(workbook: XLSX.WorkBook, sheetName: string): Row[] {
  const sheet = workbook.Sheets[sheetName]
  if (!sheet) {
    throw new Error(`Fant ikke ark "${sheetName}" i Excel-filen.`)
  }

  return XLSX.utils.sheet_to_json<Row>(sheet, {defval: ''})
}

function parseIngredient(row: Row): Ingredient {
  const name = asString(row.name)
  const unit = asString(row.unit).toLowerCase()
  const unitQuantity = asNumber(row.unitQuantity)
  const mengde = asString(row.mengde)
  const kommentar = asString(row.kommentar)

  const ingredient: Ingredient = {
    _key: asString(row._key) || uuidv4(),
    name,
  }

  if (unit && VALID_MEASUREMENT_UNITS.has(unit) && unitQuantity != null) {
    ingredient.measurement = {unit, unitQuantity}
  }

  if (mengde) {
    ingredient.mengde = mengde
  } else if (unit && unitQuantity != null && !VALID_MEASUREMENT_UNITS.has(unit)) {
    ingredient.mengde = `${unitQuantity} ${unit}`.trim()
  }

  if (kommentar) {
    ingredient.kommentar = kommentar
  }

  return ingredient
}

type SanityCategoryMaps = {
  bySlug: Record<string, string>
  byName: Record<string, string>
}

function resolveCategoryRef(
  slug: string,
  name: string,
  sanityCategoryMaps: SanityCategoryMaps,
): string | undefined {
  const slugKey = slug.toLowerCase()
  const nameKey = name.toLowerCase()

  if (slugKey && sanityCategoryMaps.bySlug[slugKey]) {
    return sanityCategoryMaps.bySlug[slugKey]
  }

  if (nameKey && sanityCategoryMaps.byName[nameKey]) {
    return sanityCategoryMaps.byName[nameKey]
  }

  return undefined
}

function buildRecipesFromWorkbook(
  workbook: XLSX.WorkBook,
  options: {all: boolean},
  sanityCategoryMaps: SanityCategoryMaps,
): SanityRecipe[] {
  const recipeRows = readSheetRows(workbook, 'Oppskrifter')
  const ingredientRows = readSheetRows(workbook, 'Ingredienser')
  const instructionRows = readSheetRows(workbook, 'Instruksjoner')
  const categoryRows = readSheetRows(workbook, 'Kategorier')

  const ingredientsByRecipe = new Map<string, Ingredient[]>()
  ingredientRows.forEach((row) => {
    const recipeId = asString(row.recipe_id)
    const name = asString(row.name)
    if (!recipeId || !name) return

    const items = ingredientsByRecipe.get(recipeId) ?? []
    items.push(parseIngredient(row))
    ingredientsByRecipe.set(recipeId, items)
  })

  const instructionsByRecipe = new Map<string, Array<{step: number; text: string}>>()
  instructionRows.forEach((row) => {
    const recipeId = asString(row.recipe_id)
    const text = asString(row.instruksjon)
    if (!recipeId || !text) return

    const items = instructionsByRecipe.get(recipeId) ?? []
    items.push({step: asNumber(row.step_no) ?? items.length + 1, text})
    instructionsByRecipe.set(recipeId, items)
  })

  const categoriesByRecipe = new Map<
    string,
    Array<{slug: string; name: string; key: string}>
  >()
  categoryRows.forEach((row) => {
    const recipeId = asString(row.recipe_id)
    const slug = asString(row.kategori_slug)
    const name = asString(row.kategori_navn)
    if (!recipeId || (!slug && !name)) return

    const items = categoriesByRecipe.get(recipeId) ?? []
    items.push({
      slug,
      name,
      key: asString(row._key) || uuidv4(),
    })
    categoriesByRecipe.set(recipeId, items)
  })

  const recipes: SanityRecipe[] = []

  recipeRows.forEach((row) => {
    const recipeId = asString(row.recipe_id)
    const title = asString(row.tittel)
    const slug = asString(row['slug.current'])

    if (!recipeId || !title || !slug) return
    if (!options.all && !isTruthyJa(row.sanity_ready)) return

    const portions = asNumber(row.porsjoner)
    if (!portions || portions < 1) {
      console.warn(`Hopper over "${title}": mangler gyldig porsjoner.`)
      return
    }

    const recipe: SanityRecipe = {
      _type: 'oppskrift',
      tittel: title,
      slug: {_type: 'slug', current: slug},
      porsjoner: Math.round(portions),
      ingrediens: ingredientsByRecipe.get(recipeId) ?? [],
      instruksjoner: (instructionsByRecipe.get(recipeId) ?? [])
        .sort((a, b) => a.step - b.step)
        .map((item) => item.text),
      kategori: [],
    }

    const imageRef = asString(row['image.asset._ref'])
    if (imageRef) {
      recipe.image = {
        _type: 'image',
        asset: {_type: 'reference', _ref: imageRef},
      }
    }

    const notes = asString(row.notater)
    if (notes) recipe.notater = notes

    const totalKcal = asNumber(row.totalKcal)
    const protein = asNumber(row.protein)
    const karbs = asNumber(row.karbs)
    const fett = asNumber(row.fett)

    if (totalKcal != null) recipe.totalKcal = totalKcal
    if (protein != null || karbs != null || fett != null) {
      recipe.totalMakros = {protein, karbs, fett}
    }

    const dietTags = parsePipe(row.kostholdsbehov_pipe)
    if (dietTags.length) recipe.dietTags = dietTags

    const allergens = parsePipe(row.vanligeAllergier_pipe)
    if (allergens.length) recipe.allergens = allergens

    categoriesByRecipe.get(recipeId)?.forEach((item) => {
      const ref = resolveCategoryRef(item.slug, item.name, sanityCategoryMaps)
      if (!ref) {
        console.warn(`Kategori ikke funnet for "${title}": ${item.name || item.slug}`)
        return
      }

      recipe.kategori!.push({
        _type: 'reference',
        _ref: ref,
        _key: item.key,
      })
    })

    if (!recipe.kategori!.length) {
      delete recipe.kategori
    }

    recipes.push(recipe)
  })

  return recipes
}

async function fetchSanityCategoryMaps(
  client: ReturnType<typeof createClient>,
): Promise<SanityCategoryMaps> {
  const categories = await client.fetch<
    Array<{name?: string; _id: string; slug?: string}>
  >(`
    *[_type == "kategori" && !(_id in path("drafts.**"))]{
      name,
      _id,
      "slug": slug.current
    }
  `)

  const bySlug: Record<string, string> = {}
  const byName: Record<string, string> = {}

  categories.forEach((category) => {
    if (category.slug) {
      bySlug[category.slug.toLowerCase()] = category._id
    }
    if (category.name) {
      byName[category.name.toLowerCase()] = category._id
    }
  })

  return {bySlug, byName}
}

async function recipeExists(
  client: ReturnType<typeof createClient>,
  title: string,
  slug: string,
): Promise<boolean> {
  const existing = await client.fetch(
    `*[_type == "oppskrift" && (tittel == $title || slug.current == $slug)][0]{_id}`,
    {title, slug},
  )
  return Boolean(existing)
}

async function main() {
  const args = parseArgs(process.argv)

  if (!fs.existsSync(args.file)) {
    console.error(`Fant ikke Excel-fil: ${args.file}`)
    process.exit(1)
  }

  const workbook = XLSX.readFile(args.file)

  if (!args.dryRun && !token) {
    console.error('Mangler SANITY_TOKEN. Kjør med --dry-run for å validere uten import.')
    process.exit(1)
  }

  const client = token
    ? createClient({
        projectId,
        dataset,
        token,
        apiVersion: '2024-03-19',
        useCdn: false,
      })
    : null

  const sanityCategoryMaps = client
    ? await fetchSanityCategoryMaps(client)
    : {bySlug: {}, byName: {}}

  const recipes = buildRecipesFromWorkbook(workbook, {all: args.all}, sanityCategoryMaps)

  if (!recipes.length) {
    console.log('Ingen oppskrifter klare for import.')
    return
  }

  if (args.dryRun) {
    const payload = JSON.stringify(recipes, null, 2)
    if (args.output) {
      fs.writeFileSync(args.output, payload, 'utf8')
      console.log(`Skrev ${recipes.length} oppskrifter til ${args.output}`)
    } else {
      console.log(payload)
    }
    return
  }

  if (!client) {
    process.exit(1)
  }

  let imported = 0
  let skipped = 0

  for (const recipe of recipes) {
    const exists = await recipeExists(client, recipe.tittel, recipe.slug.current)
    if (exists) {
      console.log(`Hopper over duplikat: ${recipe.tittel}`)
      skipped++
      continue
    }

    const result = await client.create(recipe)
    console.log(`Importert: ${result.tittel}`)
    imported++
  }

  console.log(`\nFerdig: ${imported} importert, ${skipped} hoppet over.`)
}

main().catch((error) => {
  console.error('Import feilet:', error)
  process.exit(1)
})
