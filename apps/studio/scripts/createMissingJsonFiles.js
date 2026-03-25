const fs = require('fs');
const path = require('path');

// Path to recipes directory
const recipesDir = path.join(__dirname, '..', 'recipes');

// Recipe files to create
const recipesToCreate = [
  {
    dataFile: 'kyllingwok-data.json',
    jsonFile: 'kyllingwok.json',
    title: 'Sunn Kyllingwok med Grønnsaker',
    categories: ['høy-protein', 'sunn', 'asiatisk']
  },
  {
    dataFile: 'laksewrap-data.json',
    jsonFile: 'laksewrap.json',
    title: 'Sunn Laksewrap med Avokado',
    categories: ['høy-protein', 'sunn', 'lavkarbo']
  }
];

// Function to create JSON files
function createJsonFiles() {
  console.log('Starting JSON file creation process...');
  
  recipesToCreate.forEach(recipe => {
    const jsonFilePath = path.join(recipesDir, recipe.jsonFile);
    
    try {
      // Check if data file exists
      const dataFilePath = path.join(recipesDir, recipe.dataFile);
      if (!fs.existsSync(dataFilePath)) {
        console.log(`Data file not found: ${recipe.dataFile}`);
        return;
      }
      
      // Create JSON file content
      const jsonContent = {
        "recipes": [
          {
            "title": recipe.title,
            "categories": recipe.categories,
            "dataFile": recipe.dataFile
          }
        ]
      };
      
      // Write JSON file
      fs.writeFileSync(jsonFilePath, JSON.stringify(jsonContent, null, 2));
      console.log(`Successfully created file: ${recipe.jsonFile}`);
    } catch (error) {
      console.error(`Error creating file ${recipe.jsonFile}:`, error.message);
    }
  });
  
  console.log('File creation process completed.');
}

// Execute the file creation process
createJsonFiles(); 