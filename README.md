# Script Writer - AI-Powered Script Generator

A Next.js application that generates scripts using the xAI API.

## Features

- 🤖 AI-powered script generation using xAI API
- 📚 Reference script context - Add up to 20 scripts to guide AI generation
- 🎨 Modern, beautiful UI with gradient design
- 📋 Copy-to-clipboard functionality
- ⚡ Fast and responsive
- 🔒 Secure API key handling via environment variables

## Getting Started

### Prerequisites

- Node.js 18+ installed
- xAI API key

### Installation

1. Install dependencies:
```bash
npm install
```

2. The API key is already configured in `.env.local`

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Add Reference Scripts (Optional)**: Place up to 20 script files in the `scripts/` directory. These will be used as style references for generating new scripts.
2. Enter a prompt describing the script you want to generate
3. Click "Generate Script"
4. Wait for the AI to generate your script
5. Copy the script using the "Copy Script" button

### Adding Reference Scripts

To add your 20 reference scripts:

1. Create or navigate to the `scripts/` directory
2. Add your script files (`.txt`, `.md`, or any text format)
3. The scripts will be automatically loaded and included in the context window
4. The AI will match the style and structure of your reference scripts

See `scripts/README.md` for more details.

## Project Structure

```
├── app/
│   ├── api/
│   │   └── generate/
│   │       └── route.ts      # API route for xAI integration
│   ├── globals.css            # Global styles
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Main page component
│   └── page.module.css        # Page styles
├── lib/
│   └── loadScripts.ts         # Utility to load reference scripts
├── scripts/                   # Place your 20 reference scripts here
│   └── README.md              # Instructions for adding scripts
├── .env.local                 # Environment variables (API key)
├── next.config.js             # Next.js configuration
└── package.json               # Dependencies
```

## Security Note

The API key is stored in `.env.local` which is gitignored. Never commit your API key to version control.

## Technologies Used

- Next.js 14 (App Router)
- React 18
- TypeScript
- xAI API

Built by the team behind [Revana](https://revana.si).
