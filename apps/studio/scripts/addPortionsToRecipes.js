const { createClient } = require('@sanity/client')

const projectId = process.env.SANITY_PROJECT_ID || 'nxq0o4ir'
const dataset = process.env.SANITY_DATASET || 'production'
const token = process.env.SANITY_TOKEN

if (!token) {
  console.error('Missing SANITY_TOKEN environment variable.')
  process.exit(1)
}

// Configure Sanity client
const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: '2024-02-23',
  useCdn: false,
})

/**
 * Add portions field to all recipes that don't have it
 */
async function addPortionsToRecipes() {
  try {
    // Fetch all recipes without a portions field
    const query = `*[_type == "oppskrift" && !defined(porsjoner)]`
    const recipes = await client.fetch(query)
    
    console.log(`Found ${recipes.length} recipes without portions field`)
    
    // Add default portions (4) to each recipe
    let updatedCount = 0
    
    for (const recipe of recipes) {
      try {
        const result = await client
          .patch(recipe._id)
          .set({ porsjoner: 4 }) // Default to 4 portions
          .commit()
        
        console.log(`Updated recipe: ${result.tittel}`)
        updatedCount++
      } catch (error) {
        console.error(`Failed to update recipe ${recipe.tittel || recipe._id}:`, error)
      }
    }
    
    console.log(`\nUpdate complete: ${updatedCount} recipes updated`)
  } catch (error) {
    console.error('Script failed:', error)
  }
}

// Run the script
addPortionsToRecipes() 