const fs = require('fs');
const path = require('path');

// Path to recipes directory
const recipesDir = path.join(__dirname, '..', 'recipes');

// Files to delete
const filesToDelete = [
  // Duplicate Quinoasalat - keeping the "Middelhavsinspirert" version (quinoa-salat-data.json)
  'quinoasalat-data.json'
];

// Function to delete files
function deleteFiles() {
  console.log('Starting local file deletion process...');
  
  filesToDelete.forEach(file => {
    const filePath = path.join(recipesDir, file);
    
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Successfully deleted file: ${file}`);
      } else {
        console.log(`File not found: ${file}`);
      }
    } catch (error) {
      console.error(`Error deleting file ${file}:`, error.message);
    }
  });
  
  console.log('File deletion process completed.');
}

// Execute the deletion process
deleteFiles(); 