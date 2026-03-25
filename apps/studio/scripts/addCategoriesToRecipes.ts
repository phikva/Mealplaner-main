import { createClient } from '@sanity/client'
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
  SUNN: "Sunn",
  SNACKS: "Snacks"
};

// Configure Sanity client
const client = createClient({
  projectId: 'nxq0o4ir',
  dataset: 'production',
  apiVersion: '2024-03-19',
  token: process.env.SANITY_TOKEN,
  useCdn: false,
})

interface Recipe {
  _id: string;
  tittel: string;
  notater?: string;
  instruksjoner?: string[];
  ingrediens?: Array<{name: string}>;
  totalMakros?: {
    protein: number;
    karbs: number;
    fett: number;
  };
  totalKcal?: number;
  kategori?: Array<{
    _type: string;
    _ref: string;
    _key: string;
  }>;
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

// Function to determine appropriate categories for a recipe
function determineCategories(recipe: Recipe): string[] {
  const categories: string[] = [];
  const title = recipe.tittel.toLowerCase();
  const notes = recipe.notater ? recipe.notater.toLowerCase() : '';
  const instructions = recipe.instruksjoner ? recipe.instruksjoner.join(' ').toLowerCase() : '';
  const ingredientNames = recipe.ingrediens ? recipe.ingrediens.map(ing => ing.name.toLowerCase()) : [];
  const allText = title + ' ' + notes + ' ' + instructions + ' ' + ingredientNames.join(' ');
  
  // If we don't have enough data to determine categories, return empty array
  if (!recipe.totalMakros || !recipe.totalKcal) {
    // Just check for keywords in text
    // Healthy: if it mentions being healthy or has healthy ingredients
    const healthyKeywords = ['sunn', 'næringsrik', 'protein', 'fiber', 'vitamin', 'mineral', 'antioksidant'];
    if (healthyKeywords.some(keyword => allText.includes(keyword)) || 
        title.includes('sunn') || 
        notes.includes('sunn')) {
      categories.push(CATEGORIES.SUNN);
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
    
    // Snacks: if it's a snack or mentions snack-related keywords
    const snackKeywords = ['snack', 'snacks', 'mellommåltid', 'smårett', 'dipp', 'chips', 'nøtter', 'popcorn', 'energibar', 'smoothie', 'shake'];
    if (snackKeywords.some(keyword => allText.includes(keyword)) || 
        title.includes('snack') || 
        notes.includes('snack')) {
      categories.push(CATEGORIES.SNACKS);
    }
    
    return categories;
  }
  
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
    ingredientNames.some(ing => ing.includes(gluten))
  );
  
  if (!hasGluten && !allText.includes('hvete') && !allText.includes('gluten')) {
    categories.push(CATEGORIES.GLUTENFRITT);
  }
  
  // Vegan: if no animal products
  const animalProducts = ['kjøtt', 'kylling', 'fisk', 'laks', 'torsk', 'egg', 'melk', 'ost', 'yoghurt', 'rømme', 'fløte', 'smør', 'honning'];
  const hasAnimalProducts = animalProducts.some(animal => 
    ingredientNames.some(ing => ing.includes(animal))
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
  
  // Snacks: if it's a snack or mentions snack-related keywords
  const snackKeywords = ['snack', 'snacks', 'mellommåltid', 'smårett', 'dipp', 'chips', 'nøtter', 'popcorn', 'energibar', 'smoothie', 'shake'];
  if (snackKeywords.some(keyword => allText.includes(keyword)) || 
      title.includes('snack') || 
      notes.includes('snack') ||
      (totalCalories < 300 && !title.includes('suppe'))) { // Most snacks are under 300 calories
    categories.push(CATEGORIES.SNACKS);
  }
  
  return categories;
}

// Main function to add categories to recipes
async function addCategoriesToRecipes() {
  try {
    // Get category IDs from Sanity
    const categoryMap = await fetchCategoryIds();
    
    // Fetch all recipes without categories or with empty category arrays
    const query = `*[_type == "oppskrift" && (defined(kategori) == false || count(kategori) == 0)]`;
    const recipes: Recipe[] = await client.fetch(query);
    
    console.log(`Found ${recipes.length} recipes without categories.`);
    
    let updatedCount = 0;
    
    // Process each recipe
    for (const recipe of recipes) {
      console.log(`Processing recipe: ${recipe.tittel}`);
      
      // Determine categories for the recipe
      const autoCategories = determineCategories(recipe);
      
      if (autoCategories.length === 0) {
        console.log(`No categories detected for recipe: ${recipe.tittel}`);
        continue;
      }
      
      // Create the kategori array if it doesn't exist
      if (!recipe.kategori) {
        recipe.kategori = [];
      }
      
      // Add auto-detected categories
      autoCategories.forEach(categoryName => {
        // Find the matching category ID (case-insensitive)
        let found = false;
        Object.keys(categoryMap).forEach(actualCategoryName => {
          if (actualCategoryName.toLowerCase() === categoryName.toLowerCase()) {
            recipe.kategori!.push({
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
      });
      
      // Update the recipe in Sanity
      if (recipe.kategori.length > 0) {
        const result = await client.patch(recipe._id)
          .set({ kategori: recipe.kategori })
          .commit();
        
        console.log(`Updated recipe: ${result.tittel} with categories: ${autoCategories.join(', ')}`);
        updatedCount++;
      }
    }
    
    console.log(`\nUpdate complete: ${updatedCount} recipes updated with categories.`);
  } catch (error) {
    console.error('Update failed:', error);
  }
}

// Run the update process
addCategoriesToRecipes(); 