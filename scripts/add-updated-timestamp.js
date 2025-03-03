#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Get list of files from command line arguments
const files = process.argv.slice(2);

if (files.length === 0) {
  console.log('No files specified');
  process.exit(1);
}

// Current timestamp
const timestamp = new Date().toISOString();

// Process each file
files.forEach(file => {
  try {
    // Read the file content
    const content = fs.readFileSync(file, 'utf8');
    
    // Check if the file starts with JSON metadata
    if (!content.trim().startsWith('{')) {
      console.log(`No metadata found in ${file}. Skipping.`);
      return;
    }
    
    // Extract the JSON part
    const jsonEndIndex = content.indexOf('}') + 1;
    const jsonPart = content.substring(0, jsonEndIndex);
    const markdownPart = content.substring(jsonEndIndex).trim();
    
    try {
      // Parse the JSON
      const metadata = JSON.parse(jsonPart);
      
      // Add updated timestamp if it doesn't exist
      if (!metadata.updated) {
        metadata.updated = timestamp;
        
        // Write the updated content back to the file
        const updatedContent = JSON.stringify(metadata, null, 2) + '\n\n' + markdownPart;
        fs.writeFileSync(file, updatedContent);
        console.log(`Added updated timestamp to ${file}`);
      } else {
        console.log(`File ${file} already has an updated timestamp. Skipping.`);
      }
    } catch (error) {
      console.error(`Error parsing metadata in ${file}:`, error.message);
    }
  } catch (error) {
    console.error(`Error reading file ${file}:`, error.message);
  }
});
