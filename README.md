# NoteWeb

A note-taking app with graph visualization and Notion-style markdown editing. All notes are saved in your browser's localStorage - no server, no account required.

## Features

### New in v2
- **Command palette** (`⌘P` / `Ctrl+P`): ranked full-text search with highlights, plus every action
- **Daily notes** (`⌘⇧D`) and **templates** (meeting, project, Zettel, journal, reading)
- **Favorites, tags and sorting** in the sidebar, tag filter, tag editor on every note
- **Version history** per note and a **30-day trash** with undo
- **Backup & export**: Markdown `.zip` (Obsidian-compatible), JSON, and AES-256 encrypted `.nwvault`; import `.md`, `.zip`, `.json`, `.nwvault`
- **Links panel**: backlinks plus *unlinked mentions* with one-click linking; **outline** of headings
- **Dark mode** (light / dark / system), **focus mode**, word count and reading time
- **Checklists** (`/todo`) with a cross-note **Tasks** view
- **Share by link**: the note is compressed into the URL fragment, never uploaded; recipients can save a copy
- **Print / Save as PDF** for the current note
- **Writing stats**: streak, totals and an 18-week activity heatmap
- **Safety nudges**: backup reminder after two weeks, persistent-storage request so the browser doesn't evict notes
- **Local graph** (notes within two hops), **link hover previews**, editor **font** (sans/serif/mono) and **full-width** options
- **Installable PWA** with offline support
- Landing page, pricing page and Pro waitlist (Cloudflare Pages Function + KV)

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
- Tailwind CSS (build-time, theme tokens in `index.css`)
- Hosted on Cloudflare Pages; `functions/api/waitlist.js` needs a KV binding named `WAITLIST`

## Building

```bash
npm run build
```

## License

MIT License
