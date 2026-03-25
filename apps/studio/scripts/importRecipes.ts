import { createClient } from '@sanity/client'
import * as fs from 'fs'
import * as path from 'path'
import { v4 as uuidv4 } from 'uuid'

// Define categories
const CATEGORIES = {
  HOY_PROTEIN: "Høy protein",
  GLUTENFRITT: "Glutenfritt",
  VEGANSK: "Vegansk",
  LAVFETT: "Lavfett",
  LAVKARBO: "Lavkarbo",
  ASIATISK: "Asiatisk",
  MEKSIKANSK: "Meksikansk",
  SUNN: "Sunn"
};

// Configure your Sanity client
const client = createClient({
  projectId: 'nxq0o4ir', // Your project ID
  dataset: 'production',
  apiVersion: '2024-03-19', // Today's date
  token: process.env.SANITY_TOKEN,
  useCdn: false
})

// Function to add _key to all array items in the recipe
function addKeysToArrays(obj: any): void {
  if (!obj || typeof obj !== 'object') return
  
  // Process arrays
  if (Array.isArray(obj)) {
    // Add _key to each object in the array
    obj.forEach(item => {
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        if (!item._key) {
          item._key = uuidv4()
        }
        // Process nested objects in this item
        addKeysToArrays(item)
      }
    })
  } else {
    // Process each property of the object
    Object.keys(obj).forEach(key => {
      addKeysToArrays(obj[key])
    })
  }
}

// Function to determine appropriate categories for a recipe
function determineCategories(recipe: any): string[] {
  const categories: string[] = [];
  const title = recipe.tittel.toLowerCase();
  const notes = recipe.notater ? recipe.notater.toLowerCase() : '';
  const instructions = recipe.instruksjoner ? recipe.instruksjoner.join(' ').toLowerCase() : '';
  const ingredientNames = recipe.ingrediens.map((ing: any) => ing.name.toLowerCase());
  const allText = title + ' ' + notes + ' ' + instructions + ' ' + ingredientNames.join(' ');
  
  // Calculate total macros
  const totalProtein = recipe.totalMakros.protein;
  const totalCarbs = recipe.totalMakros.karbs;
  const totalFat = recipe.totalMakros.fett;
  const totalCalories = recipe.totalKcal;
  
  // High protein: if protein makes up more than 25% of total calories
  if (totalProtein * 4 / totalCalories > 0.25) {
    categories.push(CATEGORIES.HOY_PROTEIN);
  }
  
  // Low carb: if carbs make up less than 20% of total calories
  if (totalCarbs * 4 / totalCalories < 0.2) {
    categories.push(CATEGORIES.LAVKARBO);
  }
  
  // Low fat: if fat makes up less than 20% of total calories
  if (totalFat * 9 / totalCalories < 0.2) {
    categories.push(CATEGORIES.LAVFETT);
  }
  
  // Gluten-free: if no gluten-containing ingredients
  const glutenIngredients = ['hvetemel', 'hvete', 'bygg', 'rug', 'pasta', 'couscous', 'bulgur'];
  const hasGluten = glutenIngredients.some(gluten => 
    ingredientNames.some((ing: string) => ing.includes(gluten))
  );
  
  if (!hasGluten && !allText.includes('hvete') && !allText.includes('gluten')) {
    categories.push(CATEGORIES.GLUTENFRITT);
  }
  
  // Vegan: if no animal products
  const animalProducts = ['kjøtt', 'kylling', 'fisk', 'laks', 'torsk', 'egg', 'melk', 'ost', 'yoghurt', 'rømme', 'fløte', 'smør', 'honning'];
  const hasAnimalProducts = animalProducts.some(animal => 
    ingredientNames.some((ing: string) => ing.includes(animal))
  );
  
  if (!hasAnimalProducts) {
    categories.push(CATEGORIES.VEGANSK);
  }
  
  // Asian: if it has Asian ingredients or mentions
  const asianKeywords = ['wok', 'soya', 'ingefær', 'asiatisk', 'kinesisk', 'japansk', 'thai', 'sushi', 'nudler', 'sesamolje'];
  if (asianKeywords.some(keyword => allText.includes(keyword))) {
    categories.push(CATEGORIES.ASIATISK);
  }
  
  // Mexican: if it has Mexican ingredients or mentions
  const mexicanKeywords = ['taco', 'meksikansk', 'tortilla', 'burrito', 'enchilada', 'guacamole', 'salsa', 'jalapeño', 'chili', 'avokado', 'lime', 'koriander'];
  if (mexicanKeywords.some(keyword => allText.includes(keyword))) {
    categories.push(CATEGORIES.MEKSIKANSK);
  }
  
  // Healthy: if it mentions being healthy or has healthy ingredients
  const healthyKeywords = ['sunn', 'næringsrik', 'protein', 'fiber', 'vitamin', 'mineral', 'antioksidant'];
  if (healthyKeywords.some(keyword => allText.includes(keyword)) || 
      title.includes('sunn') || 
      notes.includes('sunn')) {
    categories.push(CATEGORIES.SUNN);
  }
  
  return categories;
}

// Check if a recipe with the same title already exists
async function recipeExists(title: string): Promise<boolean> {
  const query = `*[_type == "oppskrift" && tittel == $title][0]`
  const params = { title }
  const existingRecipe = await client.fetch(query, params)
  return !!existingRecipe
}

// Get actual category IDs from Sanity
async function fetchCategoryIds(): Promise<Record<string, string>> {
  try {
    const query = `*[_type == "kategori"]{name, _id}`
    const categories = await client.fetch(query)
    
    // Create a mapping of category names to their IDs
    const categoryMap: Record<string, string> = {}
    categories.forEach((cat: any) => {
      if (cat.name) {
        categoryMap[cat.name] = cat._id
      }
    })
    
    console.log('Fetched category IDs:', categoryMap)
    return categoryMap
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    return {}
  }
}

// Main function to process and import recipes
async function processAndImportRecipes(recipeFilePath: string) {
  try {
    // Get category IDs from Sanity
    const categoryMap = await fetchCategoryIds();
    
    // Read the recipe file
    const recipeFile = fs.readFileSync(recipeFilePath, 'utf8');
    const recipeData = JSON.parse(recipeFile);
    
    if (!recipeData.recipes || !Array.isArray(recipeData.recipes)) {
      console.error('Invalid recipe file format. Expected an object with a "recipes" array.');
      return;
    }
    
    let importedCount = 0;
    let skippedCount = 0;
    
    // Process each recipe in the file
    for (const recipeInfo of recipeData.recipes) {
      const { title, categories, dataFile } = recipeInfo;
      
      if (!dataFile) {
        console.error(`Missing dataFile for recipe: ${title}`);
        continue;
      }
      
      // Read the recipe data file
      const dataFilePath = path.join(path.dirname(recipeFilePath), dataFile);
      if (!fs.existsSync(dataFilePath)) {
        console.error(`Recipe data file not found: ${dataFilePath}`);
        continue;
      }
      
      const recipeDataContent = fs.readFileSync(dataFilePath, 'utf8');
      const recipe = JSON.parse(recipeDataContent);
      
      // Add unique keys to array items
      addKeysToArrays(recipe);
      
      // Check if recipe already exists
      const exists = await recipeExists(recipe.tittel);
      if (exists) {
        console.log(`Skipping duplicate recipe: ${recipe.tittel}`);
        skippedCount++;
        continue;
      }
      
      // Process categories
      recipe.kategori = [];
      
      // Add categories from the recipe file
      if (categories && Array.isArray(categories)) {
        categories.forEach((categoryName: string) => {
          // Find the matching category ID (case-insensitive)
          let found = false;
          Object.keys(categoryMap).forEach(actualCategoryName => {
            if (actualCategoryName.toLowerCase() === categoryName.toLowerCase()) {
              recipe.kategori.push({
                _type: "reference",
                _ref: categoryMap[actualCategoryName],
                _key: uuidv4()
              });
              found = true;
            }
          });
          
          if (!found) {
            console.warn(`Category not found in Sanity: ${categoryName}`);
          }
        });
      }
      
      // Add auto-detected categories
      const autoCategories = determineCategories(recipe);
      autoCategories.forEach(categoryName => {
        // Check if this category is already added
        const alreadyAdded = recipe.kategori.some((cat: any) => {
          const categoryId = cat._ref;
          return Object.keys(categoryMap).some(name => 
            name.toLowerCase() === categoryName.toLowerCase() && categoryMap[name] === categoryId
          );
        });
        
        if (!alreadyAdded) {
          // Find the matching category ID (case-insensitive)
          let found = false;
          Object.keys(categoryMap).forEach(actualCategoryName => {
            if (actualCategoryName.toLowerCase() === categoryName.toLowerCase()) {
              recipe.kategori.push({
                _type: "reference",
                _ref: categoryMap[actualCategoryName],
                _key: uuidv4()
              });
              found = true;
            }
          });
          
          if (!found) {
            console.warn(`Auto-detected category not found in Sanity: ${categoryName}`);
          }
        }
      });
      
      // Import the recipe
      const result = await client.create(recipe);
      console.log(`Recipe imported successfully: ${result.tittel}`);
      importedCount++;
    }
    
    console.log(`\nImport complete: ${importedCount} recipes imported, ${skippedCount} duplicates skipped.`);
  } catch (error) {
    console.error('Import failed:', error);
  }
}

// Get the recipe file path from command line arguments
const recipeFilePath = process.argv[2];
if (!recipeFilePath) {
  console.error('Please provide a recipe file path as an argument.');
  process.exit(1);
}

// Run the import process
processAndImportRecipes(path.resolve(recipeFilePath)); 