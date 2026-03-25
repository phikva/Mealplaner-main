const { createClient } = require('@sanity/client')
const fs = require('fs')
const path = require('path')

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

async function backupRecipes() {
  const outputDir = path.resolve(__dirname, '../backups')
  fs.mkdirSync(outputDir, { recursive: true })

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const outputFile = path.join(outputDir, `recipes-backup-${timestamp}.json`)

  const query = `*[_type == "oppskrift"]`
  const recipes = await client.fetch(query)

  const payload = {
    exportedAt: new Date().toISOString(),
    projectId,
    dataset,
    count: recipes.length,
    documents: recipes,
  }

  fs.writeFileSync(outputFile, JSON.stringify(payload, null, 2), 'utf8')

  console.log(`Backup complete: ${recipes.length} recipes exported`)
  console.log(`File: ${outputFile}`)
}

backupRecipes().catch((error) => {
  console.error('Backup failed:', error)
  process.exit(1)
})
