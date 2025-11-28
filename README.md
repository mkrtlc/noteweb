# NoteWeb

A note-taking app with graph visualization and Notion-style markdown editing. All notes are saved in your browser's localStorage - no server, no account required.

## Features

### Rich Markdown Editor
- **Slash Commands** - Type `/` to access formatting options
  - Headings (H1, H2, H3)
  - Lists (bullet & numbered)
  - Block quotes, code blocks
  - Bold, italic formatting
- **Live Preview** - See formatted text as you type
- **@ Mentions** - Link notes together with `@`

### Interactive Knowledge Graph
- **Visual Network** - See all your notes and connections
- **2D & 3D Modes** - Toggle between visualization modes
- **Click Nodes** - Jump to any note from the graph

### Bidirectional Linking
- **Wiki-style Links** - Use `[[Note Title]]` to link notes
- **Automatic Backlinks** - See which notes reference the current one

### Folder Organization
- Create folders to organize notes
- Drag and drop notes between folders

### Browser-Based Storage
- **localStorage** - Notes saved in your browser
- **No Account** - Works without signup
- **Offline** - Works without internet

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Open `http://localhost:3000` in your browser.

## How to Use

1. Click **+** to create a new note
2. Type `/` for formatting options
3. Type `@` or `[[` to link notes
4. Changes auto-save to localStorage

## Tech Stack

- React 19
- TypeScript
- D3.js (graph visualization)
- Vite
- Tailwind CSS

## Building

```bash
npm run build
```

## License

MIT License
