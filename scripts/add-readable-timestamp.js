#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Get list of files from command line arguments
const files = process.argv.slice(2);

if (files.length === 0) {
  console.log('Usage: node add-readable-timestamp.js <file1> <file2> ...');
  console.log('Or use with glob: node add-readable-timestamp.js "*.md"');
  process.exit(1);
}

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
      
      // Check if updated timestamp exists
      if (!metadata.updated) {
        console.log(`No 'updated' timestamp found in ${file}. Skipping.`);
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
      
      // Create the timestamp line
      const timestampLine = `_Last updated: ${formattedDate}_\n\n`;
      
      // Check if the timestamp line already exists
      if (markdownPart.includes(`_Last updated:`)) {
        console.log(`Timestamp line already exists in ${file}. Updating it.`);
        
        // Replace the existing timestamp line
        const updatedMarkdown = markdownPart.replace(
          /_Last updated:.*\n\n/,
          timestampLine
        );
        
        // Write the updated content back to the file
        const updatedContent = jsonPart + '\n\n' + updatedMarkdown;
        fs.writeFileSync(file, updatedContent);
        console.log(`Updated timestamp in ${file}`);
      } else {
        // Add the timestamp line at the beginning of the markdown part
        const updatedContent = jsonPart + '\n\n' + timestampLine + markdownPart;
        fs.writeFileSync(file, updatedContent);
        console.log(`Added timestamp to ${file}`);
      }
    } catch (error) {
      console.error(`Error parsing metadata in ${file}:`, error.message);
    }
  } catch (error) {
    console.error(`Error reading file ${file}:`, error.message);
  }
}); 