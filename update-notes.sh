#!/bin/bash

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Set the notes directory - change this to your actual notes directory if different
NOTES_DIR="${NOTES_DIR:-$SCRIPT_DIR}"

# Export the notes directory for the Node.js script
export NOTES_DIR

# Run the Node.js script
node "$SCRIPT_DIR/update-notes.js" 