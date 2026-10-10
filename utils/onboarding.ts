import { v4 as uuidv4 } from 'uuid';
import { Note } from '../types';

/** First-run notes that teach the core ideas and give the graph something to show. */
export const buildOnboardingNotes = (): Note[] => {
  const now = Date.now();
  const make = (title: string, content: string, order: number, tags: string[] = [], pinned = false): Note => ({
    id: uuidv4(),
    title,
    content,
    tags,
    folderId: null,
    order,
    pinned,
    createdAt: now - order,
    updatedAt: now - order,
  });
  return [
    make(
      'Welcome to NoteWeb',
      `# Your notes, connected\nNoteWeb is a private place to think. Every note can link to any other, and the graph on the right shows how your ideas connect.\n## Start here\n- Read [[Linking notes]] to connect ideas\n- Open [[The graph]] to see your knowledge grow\n- Skim [[Shortcuts that save time]]\n- Learn why [[Your notes stay yours]]\n## Your first five minutes\n- [x] Open NoteWeb\n- [ ] Create a note with the + button\n- [ ] Link it to this note by typing @\n- [ ] Add a checklist with /todo\n- [ ] Press ⌘P and search for anything\n> Tip: press ⌘P (Ctrl+P on Windows) to search everything or run any command.`,
      0,
      ['start'],
      true
    ),
    make(
      'Linking notes',
      `## Two ways to link\n- Type **@** and pick a note from the list\n- Or write the title in double brackets, like [[Welcome to NoteWeb]]\nClicking a link that points to a note that doesn't exist yet offers to create it, so you can write top-down.\n## Backlinks\nOpen the **Links** tab in the right panel to see every note that points here, plus *unlinked mentions* you can turn into links in one click.`,
      1,
      ['start']
    ),
    make(
      'The graph',
      `Every note is a dot, and every link is a line. Notes that share many links pull together into clusters.\n- Click a dot to open that note\n- Switch between 2D and 3D at the top of the panel\nSee [[Linking notes]] for how to grow it.`,
      2,
      ['start']
    ),
    make(
      'Shortcuts that save time',
      `## Everyday\n- **⌘P / Ctrl+P**: search and commands\n- **⌘⇧D**: today's daily note\n- **⌘⇧T**: new note from a template\n- **⌘.**: focus mode\n- **?**: all shortcuts\n## While writing\n- **/** at the start of a line: headings, lists, quotes, code\n- **@@**: insert a date or reminder\n- **⌘K**: add a web link\nBack to [[Welcome to NoteWeb]].`,
      3,
      ['start']
    ),
    make(
      'Your notes stay yours',
      `NoteWeb has no account. Notes are stored in this browser, unless you turn on NoteWeb Pro's end-to-end encrypted sync.\n- **Backups**: export Markdown, JSON or an encrypted vault from the sidebar\n- **Trash**: deleted notes can be restored for 30 days\n- **History**: every note keeps earlier versions you can restore\nWithout sync, clearing browser data deletes your notes, so make a backup now and then (Pro can do it for you every day). More in [[Welcome to NoteWeb]].`,
      4,
      ['start']
    ),
  ];
};
