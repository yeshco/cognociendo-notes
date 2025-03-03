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
 * Get list of changed and new files in the git repository
 * @returns {Array} Array of changed and new file paths
 */
function getChangedFiles() {
  try {
    // Get both staged, unstaged, and untracked changes
    const output = execSync('git status --porcelain', { cwd: notesDir }).toString();
    
    // Parse the output to get file paths
    return output
      .split('\n')
      .filter(line => line.trim() !== '')
      .map(line => {
        // Extract the file path
        // Status codes are 2 characters, followed by a space, then the file path
        // For untracked files, the status is "??" 
        const filePath = line.substring(3);
        return filePath;
      })
      .filter(filePath => 
        filePath.endsWith('.md') && 
        !filePath.includes('node_modules/') && 
        !filePath.includes('README.md')
      ); // Only include markdown files, exclude node_modules and README.md
  } catch (error) {
    console.error('Error getting changed files:', error.message);
    return [];
  }
}

/**
 * Get list of all markdown files in the repository
 * @returns {Array} Array of all markdown file paths
 */
function getAllMarkdownFiles() {
  try {
    // Use find command to get all markdown files
    const output = execSync('find . -name "*.md" -not -path "*/node_modules/*" -not -path "*/\\.*" -not -name "README.md"', { cwd: notesDir }).toString();
    
    // Parse the output to get file paths
    return output
      .split('\n')
      .filter(line => line.trim() !== '')
      .map(line => {
        // Remove the leading "./" if present
        return line.startsWith('./') ? line.substring(2) : line;
      });
  } catch (error) {
    console.error('Error getting all markdown files:', error.message);
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
 * Commit changes to git with updated timestamps
 * @returns {Promise<boolean>} Promise that resolves with true if commit was successful
 */
function commitChanges() {
  return new Promise((resolve) => {
    try {
      // Update timestamps one more time before committing
      updateTimestampsBeforeCommit();
      
      // Stage all changes
      execSync('git add .', { cwd: notesDir });
      console.log('Changes staged for commit');
      
      // Ask for commit message
      rl.question('Enter commit message (or press enter for default): ', (message) => {
        const commitMessage = message.trim() || 'Update notes metadata';
        
        try {
          execSync(`git commit -m "${commitMessage}"`, { cwd: notesDir });
          console.log('Changes committed successfully');
          resolve(true);
        } catch (error) {
          console.error('Error committing changes:', error.message);
          resolve(false);
        }
      });
    } catch (error) {
      console.error('Error staging changes:', error.message);
      resolve(false);
    }
  });
}

/**
 * Update timestamps for all changed files right before commit
 */
function updateTimestampsBeforeCommit() {
  try {
    // Get changed files
    const changedFiles = getChangedFiles();
    
    // Update timestamp for each file
    changedFiles.forEach(filePath => {
      const fullPath = path.join(notesDir, filePath);
      
      try {
        // Read the file content
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // Check if the file starts with JSON metadata
        if (!content.trim().startsWith('{')) {
          return; // Skip files without metadata
        }
        
        // Extract the JSON part
        const jsonEndIndex = content.indexOf('}') + 1;
        const jsonPart = content.substring(0, jsonEndIndex);
        const markdownPart = content.substring(jsonEndIndex).trim();
        
        try {
          // Parse the JSON
          const metadata = JSON.parse(jsonPart);
          
          // Update timestamp
          metadata.updated = new Date().toISOString();
          
          // Write the updated content back to the file
          const updatedContent = JSON.stringify(metadata, null, 2) + '\n\n' + markdownPart;
          fs.writeFileSync(fullPath, updatedContent);
        } catch (error) {
          console.error(`Error updating timestamp in ${filePath}:`, error.message);
        }
      } catch (error) {
        console.error(`Error reading file ${filePath}:`, error.message);
      }
    });
  } catch (error) {
    console.error('Error updating timestamps:', error.message);
  }
}

/**
 * Push changes to git
 * @returns {Promise<boolean>} Promise that resolves with true if push was successful
 */
function pushChanges() {
  return new Promise((resolve) => {
    try {
      execSync(`git push -u origin main`, { cwd: notesDir });
      console.log('Changes pushed successfully');
      resolve(true);
    } catch (error) {
      console.error('Error pushing to origin:', error.message);
      resolve(false);
    }
  });
}

/**
 * Main function
 */
async function main() {
  console.log('Checking for changes in notes...');
  
  // Get changed files
  let changedFiles = getChangedFiles();
  
  // If no changed files found, ask if user wants to process all markdown files
  if (changedFiles.length === 0) {
    console.log('No changes found in git.');
    const processAllFiles = await askQuestion('Do you want to process all markdown files? (y/n): ');
    
    if (processAllFiles.toLowerCase() === 'y') {
      changedFiles = getAllMarkdownFiles();
    } else {
      console.log('No files to process.');
      rl.close();
      return;
    }
  }
  
  if (changedFiles.length === 0) {
    console.log('No files to process.');
    rl.close();
    return;
  }
  
  console.log(`Found ${changedFiles.length} markdown files to process`);
  
  // Process each file
  for (const file of changedFiles) {
    await updateFileMetadata(file);
  }
  
  // Ask if user wants to commit changes
  const commitAnswer = await askQuestion('\nDo you want to commit these changes? (y/n): ');
  
  if (commitAnswer.toLowerCase() === 'y') {
    const commitSuccess = await commitChanges();
    
    // Only ask about pushing if commit was successful
    if (commitSuccess) {
      // Ask if the user wants to push to origin
      const pushAnswer = await askQuestion('\nDo you want to push these changes to origin? (y/n): ');
      
      if (pushAnswer.toLowerCase() === 'y') {
        await pushChanges();
      } else {
        console.log('Changes not pushed');
      }
    }
  } else {
    console.log('Changes not committed');
  }
  
  // Close the readline interface
  rl.close();
}

// Run the main function
main().catch(error => {
  console.error('Error:', error);
  rl.close();
}); 