/**
 * The full NoteWeb feature list, shared by the pricing comparison table and the landing page.
 * `free` / `pro`: true = included, false = not included, string = included with this detail.
 */
export interface FeatureRow {
  label: string;
  free: boolean | string;
  pro: boolean | string;
}

export interface FeatureGroup {
  title: string;
  rows: FeatureRow[];
}

export const FEATURE_GROUPS: FeatureGroup[] = [
  {
    title: 'Write',
    rows: [
      { label: 'Markdown editor with slash commands, code blocks and quotes', free: true, pro: true },
      { label: 'Checklists and a Tasks view across all notes', free: true, pro: true },
      { label: 'Dates and reminders inside notes', free: true, pro: true },
      { label: "Daily notes (today's note in one shortcut)", free: true, pro: true },
      { label: 'Templates for meetings, projects, journals, Zettels and reading', free: true, pro: true },
      { label: 'Your own templates, saved from any note', free: false, pro: true },
      { label: 'Focus mode, dark mode and three editor fonts', free: true, pro: true },
      { label: 'Paper, Nord and High contrast themes, plus 6 accent colors', free: false, pro: true },
    ],
  },
  {
    title: 'Connect and find',
    rows: [
      { label: 'Wiki links and @ mentions between notes', free: true, pro: true },
      { label: 'Backlinks and unlinked mentions', free: true, pro: true },
      { label: 'Link previews on hover and a heading outline', free: true, pro: true },
      { label: 'Knowledge graph in 2D and 3D, with a local graph', free: true, pro: true },
      { label: 'Command palette with ranked full-text search', free: true, pro: true },
      { label: 'Folders, tags, favorites and sorting', free: true, pro: true },
      { label: 'Writing stats, streak and activity heatmap', free: true, pro: true },
    ],
  },
  {
    title: 'Keep it safe',
    rows: [
      { label: 'Version history per note', free: '20 versions', pro: '200 versions' },
      { label: '30-day trash with undo', free: true, pro: true },
      { label: 'Private notes locked with a password', free: false, pro: true },
      { label: 'Export to Markdown (.zip), JSON or an AES-256 encrypted vault', free: true, pro: true },
      { label: 'Import Markdown, zipped vaults, JSON and encrypted vaults', free: true, pro: true },
      { label: 'Automatic daily backups to a folder you choose', free: false, pro: true },
      { label: 'Works offline, installs as an app', free: true, pro: true },
    ],
  },
  {
    title: 'Share and publish',
    rows: [
      { label: 'Private snapshot links (the note travels inside the link)', free: true, pro: true },
      { label: 'Print or save as PDF', free: true, pro: true },
      { label: 'Export a note as a Word document or a web page', free: false, pro: true },
      { label: 'Publish notes as web pages that update when you republish', free: false, pro: true },
      { label: 'Password-protected, view-once and expiring pages', free: false, pro: true },
      { label: 'Your own public site at noteweb.co/u/you, with search', free: false, pro: true },
    ],
  },
  {
    title: 'Every device',
    rows: [
      { label: 'No account, no ads, no tracking of what you write', free: true, pro: true },
      { label: 'End-to-end encrypted sync across all your devices', free: false, pro: true },
    ],
  },
];

/** Free features worth naming on the landing page, beyond the six feature cards. */
export const FREE_HIGHLIGHTS = [
  'Checklists & Tasks view',
  'Dates & reminders',
  'Unlinked mentions',
  'Link previews',
  'Heading outline',
  'Local graph',
  'Tags & favorites',
  'Writing streak & heatmap',
  'Focus mode',
  'Dark mode',
  '30-day trash',
  'Import from Markdown',
  'Snapshot share links',
  'Print to PDF',
  'Works offline',
  'Installable app',
];
