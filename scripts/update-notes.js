#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Configuration
const notesDir = process.env.NOTES_DIR || '.'; // Default to current directory, override with NOTES_DIR env var

/**
 * Get list of changed files in the git repository
 * @returns {Array} Array of changed file paths
 */
function getChangedFiles() {
  try {
    // Get both staged and unstaged changes
    const output = execSync('git status --porcelain', { cwd: notesDir }).toString();
    
    // Parse the output to get file paths
    return output
      .split('\n')
      .filter(line => line.trim() !== '')
      .map(line => {
        // Extract the file path (remove the status code at the beginning)
        const filePath = line.substring(3);
        return filePath;
      })
      .filter(filePath => filePath.endsWith('.md')); // Only include markdown files
  } catch (error) {
    console.error('Error getting changed files:', error.message);
    return [];
  }
}

/**
 * Parse and update metadata in a markdown file
 * @param {string} filePath - Path to the markdown file
 * @returns {Promise} Promise that resolves when the file is updated
 */
async function updateFileMetadata(filePath) {
  const fullPath = path.join(notesDir, filePath);
  
  try {
    // Read the file content
    const content = fs.readFileSync(fullPath, 'utf8');
    
    // Check if the file starts with JSON metadata
    if (!content.trim().startsWith('{')) {
      console.log(`No metadata found in ${filePath}. Adding new metadata.`);
      return addNewMetadata(filePath, content);
    }
    
    // Extract the JSON part
    const jsonEndIndex = content.indexOf('}') + 1;
    const jsonPart = content.substring(0, jsonEndIndex);
    const markdownPart = content.substring(jsonEndIndex).trim();
    
    try {
      // Parse the JSON
      const metadata = JSON.parse(jsonPart);
      
      // Show current tags
      console.log(`\nFile: ${filePath}`);
      console.log(`Current tags: ${metadata.tags ? metadata.tags.join(', ') : 'none'}`);
      
      // Ask if user wants to update tags
      const updateTags = await askQuestion('Do you want to update tags? (y/n): ');
      
      if (updateTags.toLowerCase() === 'y') {
        const currentTags = metadata.tags || [];
        const tagsInput = await askQuestion(`Enter new tags (comma separated) or press enter to keep current: `);
        
        if (tagsInput.trim() !== '') {
          metadata.tags = tagsInput.split(',').map(tag => tag.trim());
        }
      }
      
      // Ask if user wants to update level
      const updateLevel = await askQuestion('Do you want to update level? (y/n): ');
      
      if (updateLevel.toLowerCase() === 'y') {
        const currentLevel = metadata.level || '';
        const levelInput = await askQuestion(`Enter new level (1-4, optionally with .a or .b suffix) or press enter to keep current: `);
        
        if (levelInput.trim() !== '') {
          metadata.level = levelInput.trim();
        }
      }
      
      // Add updated timestamp
      metadata.updated = new Date().toISOString();
      
      // Write the updated content back to the file
      const updatedContent = JSON.stringify(metadata, null, 2) + '\n\n' + markdownPart;
      fs.writeFileSync(fullPath, updatedContent);
      
      console.log(`Updated metadata for ${filePath}`);
      return true;
    } catch (error) {
      console.error(`Error parsing metadata in ${filePath}:`, error.message);
      
      // Ask if user wants to fix the JSON
      const fixJson = await askQuestion('Do you want to add new metadata? (y/n): ');
      
      if (fixJson.toLowerCase() === 'y') {
        return addNewMetadata(filePath, content);
      }
      
      return false;
    }
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Add new metadata to a file
 * @param {string} filePath - Path to the markdown file
 * @param {string} content - Current content of the file
 * @returns {Promise} Promise that resolves when the file is updated
 */
async function addNewMetadata(filePath, content) {
  const fullPath = path.join(notesDir, filePath);
  
  // Ask for tags
  const tagsInput = await askQuestion('Enter tags (comma separated): ');
  const tags = tagsInput.trim() !== '' ? tagsInput.split(',').map(tag => tag.trim()) : [];
  
  // Ask for level
  const levelInput = await askQuestion('Enter level (1-4, optionally with .a or .b suffix): ');
  const level = levelInput.trim() !== '' ? levelInput.trim() : '1';
  
  // Create metadata object
  const metadata = {
    tags,
    level,
    updated: new Date().toISOString()
  };
  
  // Write the updated content back to the file
  const updatedContent = JSON.stringify(metadata, null, 2) + '\n\n' + content.trim();
  fs.writeFileSync(fullPath, updatedContent);
  
  console.log(`Added new metadata to ${filePath}`);
  return true;
}

/**
 * Helper function to ask a question and get user input
 * @param {string} question - The question to ask
 * @returns {Promise<string>} Promise that resolves with the user's answer
 */
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * Commit changes to git
 */
function commitChanges() {
  try {
    execSync('git add .', { cwd: notesDir });
    console.log('Changes staged for commit');
    
    // Ask for commit message
    rl.question('Enter commit message (or press enter for default): ', (message) => {
      const commitMessage = message.trim() || 'Update notes metadata';
      
      try {
        execSync(`git commit -m "${commitMessage}"`, { cwd: notesDir });
        console.log('Changes committed successfully');
      } catch (error) {
        console.error('Error committing changes:', error.message);
      }

      try {
        execSync(`git push -u origin main`, { cwd: notesDir });
        console.log('Changes pushed successfully');
      } catch (error) {
        console.error('Error pushing to origin:', error.message);
      }
      
      rl.close();
    });
  } catch (error) {
    console.error('Error staging changes:', error.message);
    rl.close();
  }
}

/**
 * Main function
 */
async function main() {
  console.log('Checking for changes in notes...');
  
  // Get changed files
  const changedFiles = getChangedFiles();
  
  if (changedFiles.length === 0) {
    console.log('No changes found');
    rl.close();
    return;
  }
  
  console.log(`Found ${changedFiles.length} changed markdown files`);
  
  // Process each changed file
  for (const file of changedFiles) {
    await updateFileMetadata(file);
  }
  
  // Ask if user wants to commit changes
  const commitAnswer = await askQuestion('\nDo you want to commit these changes? (y/n): ');
  
  if (commitAnswer.toLowerCase() === 'y') {
    commitChanges();
  } else {
    console.log('Changes not committed');
    rl.close();
  }
}

// Run the script
main().catch(error => {
  console.error('Error:', error);
  rl.close();
}); 