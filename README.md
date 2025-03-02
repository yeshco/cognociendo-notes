# Co(g)nociendo Notes

This repository contains markdown files for the [co(g)nociendo](https://yourusername.github.io/cognociendo) website.

## Structure

All notes should be placed in the `notes` directory and follow these naming conventions:

- Filenames should match the `data-note` attribute in the website's HTML
- Use lowercase letters and hyphens for spaces (e.g., `thoughts-on-knowledge.md`)
- All files must have the `.md` extension

## Markdown Format

The notes support standard Markdown syntax plus:

- Code syntax highlighting (specify the language after the opening triple backticks)
- Images (though they must be hosted elsewhere and linked)
- Tables
- Blockquotes
- Task lists

## Example

Here's a simple example of a valid note:

```markdown
# Note Title

Introduction paragraph goes here.

## Subheading

- List item 1
- List item 2
- List item 3

### Code Example

```javascript
function example() {
  return "This is a code example";
}
```

> This is a blockquote

```

## Adding New Notes

To add a new note:

1. Create a new markdown file in the `notes` directory
2. Add the corresponding entry to the website's HTML
3. Commit and push your changes

## License

[MIT License](LICENSE) 