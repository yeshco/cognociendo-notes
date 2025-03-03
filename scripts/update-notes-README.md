{
  "tags": [],
  "level": "1",
  "updated": "2025-03-03T16:22:37.934Z"
}

# Notes Metadata Update Tool

This tool helps you manage metadata for your markdown notes. It automatically checks for changes in your notes directory, allows you to update tags and level indicators, adds timestamps, and commits changes to git.

## Features

- Detects changed markdown files using git
- Allows updating tags and level indicators for each changed file
- Adds an "Updated" timestamp to the metadata
- Commits changes to git with a custom message
- Handles files with or without existing metadata

## Requirements

- Node.js (v12 or higher)
- Git repository for your notes

## Installation

1. Place the `update-notes.js` and `update-notes.sh` files in your notes repository
2. Make them executable:
   ```bash
   chmod +x update-notes.js update-notes.sh
   ```

## Usage

Simply run the shell script from your notes directory:

```bash
./update-notes.sh
```

Or specify a different notes directory:

```bash
NOTES_DIR=/path/to/your/notes ./update-notes.sh
```

## Metadata Format

The tool manages JSON metadata at the beginning of markdown files in this format:

```json
{
  "tags": ["tag1", "tag2", "tag3"],
  "level": "3.a",
  "updated": "2023-06-15T12:34:56.789Z"
}
```

### Level Format

The level format follows these conventions:
- A number from 1-4 indicating complexity:
  - 1: Musings
  - 2: Thoughts
  - 3: Explanation
  - 4: Essay
- Optionally followed by a status indicator:
  - `.a` or no suffix: Finished
  - `.b`: In progress

## Workflow

1. Make changes to your markdown notes
2. Run `./update-notes.sh`
3. For each changed file, you'll be prompted to update tags and level
4. The tool will add an "Updated" timestamp
5. You'll be asked if you want to commit the changes
6. If yes, you can provide a custom commit message or use the default

## Troubleshooting

If you encounter issues with JSON parsing, the tool will offer to add new metadata to the file, preserving the existing content.