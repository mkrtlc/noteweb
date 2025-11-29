import { BlogPost } from '../types';

export const blogPosts: BlogPost[] = [
  {
    slug: 'zettelkasten-method-complete-guide',
    title: 'The Zettelkasten Method: A Complete Guide to Building a Second Brain',
    excerpt: 'Learn how German sociologist Niklas Luhmann used a simple card system to publish 70+ books. A deep dive into the Zettelkasten method, its principles, and how to implement it.',
    content: `
# The Zettelkasten Method: A Complete Guide to Building a Second Brain

In the 20th century, a German sociologist named Niklas Luhmann produced an almost superhuman body of work: over 70 books and 400+ scholarly articles spanning sociology, law, economics, politics, art, religion, and more. His secret? A wooden box filled with index cards—his Zettelkasten.

This guide will teach you everything you need to know about the Zettelkasten method: its origins, core principles, implementation strategies, and why it remains one of the most powerful thinking tools ever devised.

## What is Zettelkasten?

**Zettelkasten** (German for "slip box" or "card box") is a personal knowledge management system built on interconnected notes. Unlike traditional note-taking where information is organized hierarchically (folders within folders), Zettelkasten treats each note as an independent unit that gains meaning through its connections to other notes.

The method transforms your notes from a static archive into a dynamic **thinking partner**—a network that grows smarter as it grows larger.

## The Origin Story: Niklas Luhmann

Niklas Luhmann (1927-1998) began his Zettelkasten in 1951 while working as a legal clerk. Over 47 years, he accumulated approximately **90,000 handwritten index cards**, each containing a single idea, linked to others through a sophisticated numbering system.

When asked about his productivity, Luhmann famously replied: "I don't think everything on my own. It happens mainly within the Zettelkasten."

He described his system as a "communication partner" that would surprise him with unexpected connections and insights. The Zettelkasten wasn't just storage—it was a collaborator in his intellectual work.

### Luhmann's Output

Using his Zettelkasten, Luhmann produced:
- 70+ books
- 400+ scholarly articles
- A 2,000-page magnum opus on society
- Groundbreaking systems theory that influenced multiple disciplines

This wasn't despite having a day job and family—it was because the Zettelkasten made thinking and writing dramatically more efficient.

## The Four Core Principles

### 1. Atomicity: One Idea Per Note

Each note (or "zettel") should contain exactly **one idea, concept, or piece of information**. This is the atomic principle.

**Why it matters:**
- Atomic notes can be linked in multiple contexts
- They're easier to find and reference
- They force you to understand concepts clearly enough to express them concisely
- They prevent "note bloat" where important ideas get buried in long documents

**Bad example:** A 2,000-word note titled "Machine Learning"
**Good example:** Separate notes for "Supervised vs Unsupervised Learning," "Gradient Descent Explained," "Overfitting and How to Prevent It"

### 2. Connectivity: Links Are Everything

The power of Zettelkasten lies not in individual notes but in the **connections between them**. Every note should link to related notes, creating a web of knowledge.

**Types of links:**
- **Direct links**: Note A explicitly references Note B
- **Backlinks**: Note B knows that Note A references it (bidirectional)
- **Structure notes**: Index notes that link to many related notes on a topic
- **Sequence links**: Notes that form a logical chain of thought

**The network effect:** As your Zettelkasten grows, each new note becomes more valuable because it has more potential connections. This is the opposite of traditional filing systems, which become harder to navigate as they grow.

### 3. Personal Interpretation: Write in Your Own Words

Never copy and paste. Every note should be written in **your own words**, representing your understanding of the concept.

**Why this matters:**
- Writing forces comprehension—you can't explain what you don't understand
- Your future self will understand your own words better than quoted text
- Original writing creates unique connections you wouldn't see in source material
- It prevents the collector's fallacy (hoarding information without processing it)

**The process:**
1. Read or learn something
2. Close the source
3. Write what you understood in your own words
4. Only then, verify against the source if needed

### 4. Emergence: Let Structure Develop Organically

Traditional note-taking starts with categories: "Create a folder for Biology, then subfolders for Cells, Genetics, Evolution..."

Zettelkasten works differently. You start with individual notes and let **structure emerge from connections**. Topics reveal themselves through clusters of linked notes.

**Benefits:**
- No premature categorization that limits thinking
- Ideas can belong to multiple contexts simultaneously
- Unexpected connections become visible
- The system adapts to how you actually think, not how you think you should organize

## The Anatomy of a Zettel

A well-formed zettel contains:

### 1. Unique Identifier
Every note needs a unique ID. Luhmann used a branching number system (1, 1a, 1a1, 1b, 2...). Digital systems often use timestamps (202411290930) or auto-generated IDs.

### 2. Title
A clear, descriptive title that captures the note's core idea. You should be able to understand what the note is about from the title alone.

**Examples:**
- "Spaced repetition improves long-term retention by 200%"
- "First-principles thinking breaks problems into fundamental truths"
- "Confirmation bias makes us seek information that supports existing beliefs"

### 3. Body
The content of the note—your explanation of the concept in your own words. Keep it concise but complete. Include:
- The core idea
- Why it matters
- Key nuances or exceptions
- Examples if helpful

### 4. Links
References to related notes. Place these inline (within the text) and/or at the bottom. Include brief context for why the link is relevant.

### 5. Source Reference
If the note came from a specific source (book, article, conversation), include the reference. This enables verification and deeper exploration.

## Types of Notes in a Zettelkasten

### Fleeting Notes
Quick captures of ideas, thoughts, or information. These are temporary—process them into permanent notes within a day or two, then discard them.

**Examples:**
- Ideas during a shower
- Highlights while reading
- Thoughts during a meeting

### Literature Notes
Notes taken while consuming content (books, articles, lectures). Write one note per source summarizing key ideas in your own words. These often get broken down into multiple permanent notes.

### Permanent Notes
The core of your Zettelkasten. Fully developed, atomic notes that represent your processed understanding. These are written for your future self and linked into your existing network.

### Structure Notes (Hub Notes)
Meta-notes that provide entry points into topics. They contain mostly links to other notes, organized to show relationships. Think of them as tables of contents for specific subjects.

**Example structure note: "Psychology of Decision Making"**
- Link to "Cognitive Biases Overview"
- Link to "System 1 vs System 2 Thinking"
- Link to "The Role of Emotion in Decisions"
- Link to "Decision Fatigue and Willpower"
- ...and so on

## The Workflow: From Input to Insight

### Step 1: Capture
When you encounter interesting information or have a thought, capture it immediately. Don't trust your memory. Use whatever tool is convenient—phone, notebook, voice memo.

### Step 2: Process
Regularly (daily is ideal) process your captures:
- Review fleeting notes
- Extract key ideas
- Write each idea as a separate permanent note in your own words

### Step 3: Connect
This is where the magic happens. For each new note:
- Ask: "What existing notes does this relate to?"
- Create links to those notes
- Ask: "What does this add to or contradict in my existing knowledge?"
- Update related notes if this new information changes them

### Step 4: Review and Develop
Periodically explore your Zettelkasten:
- Follow links to rediscover forgotten connections
- Look for clusters that might become articles or projects
- Identify gaps in your understanding
- Create structure notes for emerging topics

### Step 5: Create
Use your Zettelkasten for output:
- Writing articles: Follow chains of linked notes
- Solving problems: Search for relevant notes and connections
- Generating ideas: Explore unexpected links
- Learning: Fill gaps you've identified

## Why Zettelkasten Works: The Science

### 1. Elaborative Encoding
Writing notes in your own words forces deep processing. This creates stronger memory traces than passive highlighting or copying. Studies show that elaboration (connecting new information to existing knowledge) dramatically improves retention.

### 2. Spaced Retrieval
Every time you revisit a note while linking or exploring, you practice retrieving that information. Spaced retrieval is one of the most effective learning techniques known to cognitive science.

### 3. Interleaving
Unlike studying one topic intensively, Zettelkasten encourages jumping between related concepts. This interleaved practice improves transfer of learning to new situations.

### 4. External Cognition
Your Zettelkasten becomes an extension of your mind—what researchers call "external cognition" or "extended mind." It reduces cognitive load by offloading memory and allows you to think with more complexity than working memory alone permits.

### 5. Network Effects
Each new note increases the potential value of every existing note. This creates compound returns on your intellectual investment—unlike traditional notes which often become harder to navigate as they accumulate.

## Common Mistakes to Avoid

### 1. The Collector's Fallacy
Hoarding information without processing it. Your Zettelkasten should contain your thinking, not a library of quotes. If you haven't written it in your own words, you haven't learned it.

### 2. Over-Organizing
Creating elaborate folder structures or tag hierarchies defeats the purpose. Trust links to create structure. Start simple and let organization emerge.

### 3. Notes That Are Too Long
If a note covers multiple ideas, it's too long. Break it down. The linking power comes from atomic units that can be recombined in multiple ways.

### 4. Orphan Notes
Notes without links are nearly useless. Every note should connect to at least one other note. Ask: "Where does this fit in my existing knowledge?"

### 5. Perfectionism
Your Zettelkasten is a living system. Notes can be updated, split, merged, or deleted. Don't wait for perfect understanding—write what you know now and refine over time.

### 6. Tool Obsession
The method matters more than the tool. Luhmann used paper cards. You can use any app that supports linking. Don't let tool-shopping become a procrastination strategy.

## Implementing Zettelkasten with NoteWeb

NoteWeb is designed with Zettelkasten principles in mind:

### Atomic Notes
Create separate notes for each idea. The quick note creation (+ button) encourages small, focused notes rather than long documents.

### Easy Linking
Type \`@\` to instantly link to any existing note. If the note doesn't exist, create it on the fly. This removes friction from the most important action in Zettelkasten.

### Bidirectional Links
When Note A links to Note B, Note B's backlinks panel automatically shows the connection. You never lose track of how ideas relate.

### Visual Graph
Toggle the graph view to see your knowledge network visually. Watch clusters form, identify isolated notes that need connections, and discover unexpected relationships.

### No Forced Hierarchy
Folders are optional. Notes can exist without categorization and gain meaning through links instead. This supports the emergent structure principle.

### Local and Private
Your second brain stays on your device. No cloud sync means no privacy concerns and no subscription fees.

## Getting Started: Your First 30 Days

### Week 1: Foundation
- Create 5-10 notes from things you already know well
- Practice writing atomic notes (one idea each)
- Link each note to at least one other note
- Don't worry about perfection

### Week 2: Input Processing
- Choose one book or article to read
- Take literature notes as you read
- Process into 10-15 permanent notes
- Connect each to your existing notes

### Week 3: Building Momentum
- Add notes daily, even just one per day
- Explore your graph regularly
- Create your first structure note for an emerging topic
- Notice connections you didn't plan

### Week 4: Creating Output
- Pick one cluster of related notes
- Follow the links to outline an article or explanation
- Write something (blog post, essay, explanation to a friend)
- Experience how the Zettelkasten makes writing easier

## Conclusion: A Thinking Partnership

The Zettelkasten is not just a note-taking system—it's a thinking system. It externalizes your cognition, creates compound returns on intellectual investment, and becomes more valuable with every note you add.

Niklas Luhmann called his Zettelkasten a "communication partner." After decades of use, he found that it would surprise him with connections he'd forgotten he'd made. The system had become something more than a collection of notes—it had become a collaborator.

You don't need 90,000 notes to experience this. Start with ten. Link them together. Add more. Watch your second brain come to life.

---

*Ready to start your Zettelkasten journey? NoteWeb's wiki-style linking and graph visualization make it easy to implement these principles. Create your first connected note today.*
    `.trim(),
    author: 'NoteWeb Team',
    publishedAt: '2025-11-29',
    readingTime: '15 min read',
    tags: ['zettelkasten', 'pkm', 'productivity', 'note-taking', 'second-brain'],
  },
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
