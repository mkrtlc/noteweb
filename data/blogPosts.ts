import { BlogPost } from '../types';

export const blogPosts: BlogPost[] = [
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
    publishedAt: '2024-11-15',
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
    publishedAt: '2024-11-10',
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
