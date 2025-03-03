#!/bin/bash
# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Set the notes directory to the parent directory of the scripts folder by default
NOTES_DIR="${NOTES_DIR:-$(dirname "$SCRIPT_DIR")}"

# Export the notes directory for the Node.js script
export NOTES_DIR

# Run the Node.js script with any arguments passed to this script
node "$SCRIPT_DIR/add-updated-timestamp.js" "$@"
