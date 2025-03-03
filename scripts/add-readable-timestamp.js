#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const notesDir = process.env.NOTES_DIR || path.join(__dirname, '..'); // Default to parent directory

// Get list of files from command line arguments
const files = process.argv.slice(2);

if (files.length === 0) {
  console.log('Usage: node add-readable-timestamp.js <file1> <file2> ...');
  console.log('Or use with glob: node add-readable-timestamp.js "*.md"');
  process.exit(1);
}

// Process each file
let updatedCount = 0;
let skippedCount = 0;

files.forEach(file => {
  try {
    // Get the full path
    const fullPath = path.resolve(notesDir, file);
    
    // Read the file content
    const content = fs.readFileSync(fullPath, 'utf8');
    
    // Check if the file starts with JSON metadata
    if (!content.trim().startsWith('{')) {
      console.log(`No metadata found in ${file}. Skipping.`);
      skippedCount++;
      return;
    }
    
    // Extract the JSON part
    const jsonEndIndex = content.indexOf('}') + 1;
    const jsonPart = content.substring(0, jsonEndIndex);
    const markdownPart = content.substring(jsonEndIndex).trim();
    
    try {
      // Parse the JSON
      const metadata = JSON.parse(jsonPart);
      
      // Check if updated timestamp exists
      if (!metadata.updated) {
        console.log(`No 'updated' timestamp found in ${file}. Skipping.`);
        skippedCount++;
        return;
      }
      
      // Format the timestamp in a human-readable format
      const timestamp = new Date(metadata.updated);
      const formattedDate = timestamp.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      
      // Add the formatted timestamp at the beginning of the markdown
      // Check if the first line is a heading (starts with #)
      const lines = markdownPart.split('\n');
      let updatedMarkdown;
      
      if (lines[0].startsWith('#')) {
        // Insert the timestamp right before the heading (title)
        lines.unshift(`\`${formattedDate}\``);
        updatedMarkdown = lines.join('\n');
      } else {
        // Insert at the beginning
        updatedMarkdown = `\`${formattedDate}\`\n\n${markdownPart}`;
      }
      
      // Write the updated content back to the file
      const updatedContent = jsonPart + '\n\n' + updatedMarkdown;
      fs.writeFileSync(fullPath, updatedContent);
      console.log(`Added timestamp to ${file}`);
      updatedCount++;
    } catch (error) {
      console.error(`Error parsing metadata in ${file}:`, error.message);
      skippedCount++;
    }
  } catch (error) {
    console.error(`Error reading file ${file}:`, error.message);
    skippedCount++;
  }
});

console.log(`\nDone! Updated ${updatedCount} files, skipped ${skippedCount} files.`); 