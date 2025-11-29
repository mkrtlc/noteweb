import { BlogPost } from '../types';

export const blogPosts: BlogPost[] = [
  {
    slug: 'what-is-noteweb',
    title: 'What is NoteWeb? The Note-Taking App That Thinks Like You Do',
    excerpt: 'Discover NoteWeb - a free, local-first note-taking app with wiki-style linking, beautiful graph visualization, and zero sign-up required.',
    content: `
# What is NoteWeb? The Note-Taking App That Thinks Like You Do

NoteWeb is a modern, free note-taking application designed for people who want more than just a place to dump text. It's built around one powerful idea: **your notes should be connected, not isolated**.

## Why We Built NoteWeb

We were frustrated with traditional note-taking apps. You write something brilliant, save it, and... it disappears into a folder you'll never open again. Sound familiar?

NoteWeb solves this by treating your notes as a **knowledge graph** rather than a file cabinet. Every note can link to any other note, and those connections become visible, explorable, and valuable over time.

## Core Features

### Wiki-Style Linking

Type \`@\` anywhere in your note to create a link to another note. It's that simple. If the note doesn't exist yet, NoteWeb will create it for you.

These aren't just hyperlinks—they're **bidirectional**. When Note A links to Note B, Note B knows about it. Open any note and instantly see everything that references it.

### Beautiful Graph Visualization

Toggle the graph view to see your knowledge network come alive. Every note is a node, every link is a connection. Watch your ideas form clusters and discover unexpected relationships.

Switch between **2D and 3D modes** for different perspectives. Click any node to navigate directly to that note.

### Rich Text Editor

NoteWeb's editor is powerful yet simple:

- **Slash commands** - Type \`/\` for quick formatting (headings, lists, quotes, code blocks)
- **Keyboard shortcuts** - Cmd+B for bold, Cmd+I for italic, Cmd+Z to undo
- **Drag & drop blocks** - Reorder your content by dragging paragraphs
- **Auto bullet lists** - Type \`- \` and it becomes a list automatically

### Date Chips & Reminders

Type \`@@\` to add a date to your notes. Pick from quick options like "Tomorrow" or "Next Monday," or choose any date from the calendar. Set a specific time for reminders.

### Folders & Organization

Create folders to organize your notes by project, topic, or however you think. Drag notes between folders effortlessly. Links work across folders, so organization never limits connections.

### Local-First & Private

Your notes are stored in your browser's local storage. That means:

- **No account required** - Start taking notes immediately
- **Complete privacy** - Your data never leaves your device
- **Works offline** - No internet needed
- **Zero cost** - Free forever, no premium tiers

## Who Is NoteWeb For?

NoteWeb is perfect for:

- **Students** building study notes that connect concepts across subjects
- **Writers** organizing research and ideas for articles or books
- **Developers** documenting projects with interconnected technical notes
- **Researchers** creating literature reviews and connecting sources
- **Anyone** who thinks in connections rather than hierarchies

## How NoteWeb Compares

| Feature | NoteWeb | Traditional Apps |
|---------|---------|-----------------|
| Bidirectional links | Yes | Rarely |
| Graph visualization | 2D & 3D | No |
| Account required | No | Usually |
| Price | Free | Often paid |
| Privacy | 100% local | Cloud-dependent |
| Offline support | Yes | Sometimes |

## Getting Started

1. Visit [noteweb.co](https://noteweb.co)
2. Click the **+** button to create your first note
3. Start typing and use \`@\` to link ideas together
4. Toggle the graph view to watch your knowledge network grow

No sign-up. No credit card. No friction. Just start writing.

## The Philosophy Behind NoteWeb

We believe that:

- **Simplicity wins** - You shouldn't need a manual to take notes
- **Connections matter** - Ideas gain value when linked together
- **Privacy is non-negotiable** - Your thoughts belong to you
- **Free should mean free** - Not "free trial" or "free with limits"

NoteWeb embodies these principles. It's the note-taking app we wished existed, so we built it.

---

Ready to start building your personal knowledge graph? Open NoteWeb and create your first connected note today.
    `.trim(),
    author: 'NoteWeb Team',
    publishedAt: '2025-11-29',
    readingTime: '5 min read',
    tags: ['noteweb', 'features', 'note-taking', 'pkm'],
  },
  {
    slug: 'why-connected-notes-matter',
    title: 'Why Connected Notes Matter: The Power of Bidirectional Linking',
    excerpt: 'Discover how linking your notes together can transform the way you think, learn, and create. Learn the science behind networked thought.',
    content: `
# Why Connected Notes Matter: The Power of Bidirectional Linking

Have you ever written a brilliant note, only to forget about it weeks later? You're not alone. Traditional note-taking apps treat your notes like files in a cabinet—isolated, disconnected, and easy to lose in the shuffle.

## The Problem with Linear Notes

Most of us were taught to take notes in a linear fashion:
- Open a new document
- Write down information
- Save and forget

This approach has a fundamental flaw: **our brains don't work linearly**. Ideas connect to other ideas. Concepts build upon concepts. Knowledge is a web, not a list.

## Enter Bidirectional Linking

Bidirectional linking changes everything. When you create a link from Note A to Note B, Note B automatically knows about Note A. This simple feature has profound implications:

### 1. Rediscover Forgotten Ideas
When you open any note, you immediately see what other notes reference it. That brilliant idea from six months ago? It surfaces automatically when relevant.

### 2. Build a Personal Knowledge Graph
Over time, your notes form a network. You can literally visualize how your ideas connect—which is exactly what NoteWeb's graph view provides.

### 3. Think Better
The act of linking forces you to consider relationships. "How does this connect to what I already know?" This question alone improves retention and understanding.

## How to Start

1. **Don't overthink it.** Just start taking notes normally.
2. **Link liberally.** Whenever you mention a concept that could be its own note, make it a link using \`[[double brackets]]\`.
3. **Review your graph.** Periodically explore your knowledge graph. You'll be surprised what connections emerge.

## The Bottom Line

Your notes are only as valuable as your ability to find and connect them. Bidirectional linking isn't just a feature—it's a fundamentally better way to capture and develop ideas.

Start building your personal knowledge graph today. Your future self will thank you.

---

*What connections have you discovered in your notes? Share your experience with us on Twitter.*
    `.trim(),
    author: 'NoteWeb Team',
    publishedAt: '2025-11-28',
    readingTime: '4 min read',
    tags: ['productivity', 'note-taking', 'pkm'],
  },
  {
    slug: 'getting-started-with-noteweb',
    title: 'Getting Started with NoteWeb: A Quick Guide',
    excerpt: 'Learn the basics of NoteWeb in 5 minutes. From creating your first note to visualizing your knowledge graph.',
    content: `
# Getting Started with NoteWeb: A Quick Guide

Welcome to NoteWeb! This guide will get you up and running in just a few minutes.

## Creating Your First Note

Click the **+** button in the sidebar or right-click and select "New Note." Give your note a title and start writing.

NoteWeb uses Markdown for formatting:
- **Bold** text with \`**asterisks**\`
- *Italic* with \`*single asterisks*\`
- Lists with \`-\` or \`1.\`
- Headings with \`#\`, \`##\`, \`###\`

## Linking Notes Together

This is where the magic happens. To link to another note, use double brackets:

\`\`\`
Check out my thoughts on [[Project Ideas]]
\`\`\`

If the note exists, clicking the link takes you there. If it doesn't exist yet, NoteWeb will offer to create it for you.

## Using the Graph View

Click the graph icon in the header to toggle the graph view. You'll see:
- **Nodes**: Each circle is a note
- **Lines**: Connections between linked notes
- **Your active note**: Highlighted in the graph

Try clicking nodes to navigate your knowledge base visually!

## Organizing with Folders

Right-click in the sidebar to create folders. Drag and drop notes to organize them. Don't worry—links work regardless of folder structure.

## Pro Tips

1. **Use the search** (Cmd/Ctrl + K) to quickly find notes
2. **Backlinks panel** shows all notes that link TO the current note
3. **2D/3D toggle** in the graph view for different perspectives

## What's Next?

- Import your existing notes
- Explore the slash command menu (type \`/\`)
- Set up your first folder structure

Happy note-taking!

---

*Have questions? Check out our Help section or reach out on Twitter.*
    `.trim(),
    author: 'NoteWeb Team',
    publishedAt: '2025-11-27',
    readingTime: '3 min read',
    tags: ['tutorial', 'getting-started'],
  },
];

export const getBlogPost = (slug: string): BlogPost | undefined => {
  return blogPosts.find(post => post.slug === slug);
};

export const getAllBlogPosts = (): BlogPost[] => {
  return blogPosts.sort((a, b) =>
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
};
