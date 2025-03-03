#!/bin/bash

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Set the notes directory to the parent directory of the scripts folder by default
NOTES_DIR="${NOTES_DIR:-$(dirname "$SCRIPT_DIR")}"

# Export the notes directory for the Node.js script
export NOTES_DIR

# Find all markdown files and process them
find "$NOTES_DIR" -name "*.md" -not -path "*/\.*" | xargs "$SCRIPT_DIR/add-readable-timestamp.js" 