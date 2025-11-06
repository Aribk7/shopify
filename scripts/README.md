# Reference Scripts Directory

Place your 20 script files in this directory. All scripts placed here will be automatically loaded and included in the context window when generating new scripts.

## How to Add Scripts

1. Simply copy your script files into this `scripts/` directory
2. Supported file formats: `.txt`, `.md`, `.js`, `.ts`, `.jsx`, `.tsx`, `.py`, `.json`, or any text file
3. The scripts will be automatically loaded on the next API call

## File Naming

- Use descriptive filenames (e.g., `comedy-sketch-1.txt`, `drama-scene-2.md`)
- Avoid special characters in filenames
- Hidden files (starting with `.`) are ignored

## How It Works

- All scripts in this directory are loaded when generating a new script
- They are included in the system prompt as reference examples
- The AI will match the style, tone, and structure of your reference scripts
- If scripts are too long, they may be truncated to fit within token limits

## Example

```
scripts/
  ├── script-1.txt
  ├── script-2.txt
  ├── script-3.md
  └── ... (up to 20 scripts)
```

## Notes

- Scripts are loaded from the filesystem at runtime
- Changes to scripts require a server restart to take effect
- Total context is limited to ~40,000 characters to ensure API compatibility

