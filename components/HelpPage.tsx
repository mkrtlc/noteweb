import React from 'react';
import { Link } from 'react-router-dom';
import { MarketingPage } from './SiteChrome';
import { useSeo } from '../hooks/useSeo';
import {
  Network,
  FileText,
  FolderOpen,
  Link2,
  Calendar,
  Search,
  Command,
  Keyboard,
  MousePointer,
  Eye,
  Database,
  HelpCircle,
  Heading1,
  Heading2,
  Heading3,
  Bold,
  Italic,
  Code,
  List,
  ListOrdered,
  Quote,
  Minus,
  GripVertical,
  Undo2,
  Redo2,
  Trash2,
  Copy,
  Pencil,
  ChevronDown,
  PanelRightOpen,
  Gem,
  Share2,
  History,
  CalendarDays,
} from 'lucide-react';

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, icon, children }) => (
  <section className="mb-12">
    <h2 className="flex items-center gap-3 mk-serif text-[26px] text-slate-900 mb-4 pb-2 border-b border-slate-200">
      {icon}
      {title}
    </h2>
    {children}
  </section>
);

interface FeatureCardProps {
  title: string;
  description: string;
  children?: React.ReactNode;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, children }) => (
  <div className="bg-white rounded-lg border border-slate-200 p-4 mb-3">
    <h3 className="font-medium text-slate-900 mb-1">{title}</h3>
    <p className="text-sm text-slate-600 mb-2">{description}</p>
    {children}
  </div>
);

const Kbd: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <kbd className="px-2 py-1 bg-slate-100 border border-slate-300 rounded text-xs font-mono text-slate-700">
    {children}
  </kbd>
);

const HelpPage: React.FC = () => {
  useSeo('NoteWeb Help: shortcuts, linking, graph, backups and Pro', 'How to use NoteWeb: slash commands, wiki links, the knowledge graph, daily notes, backups, sharing, and Pro features like encrypted sync and publishing.', '/help');
  return (
    <MarketingPage solidNav>
      <div className="bg-[#f7f7f8] pt-16 flex flex-col min-h-screen">

      {/* Hero */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-100 rounded-2xl mb-4">
            <HelpCircle className="w-8 h-8 text-brand-600" />
          </div>
          <h1 className="mk-serif text-[40px] leading-tight text-slate-900 mb-3">Help & Documentation</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Everything you need to know about NoteWeb, from your first note to the knowledge graph, backups, sharing and NoteWeb Pro.
          </p>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 flex-1">

        {/* Quick Start */}
        <Section title="Quick Start" icon={<FileText className="w-5 h-5 text-brand-600" />}>
          <div className="bg-brand-50 rounded-lg border border-brand-100 p-6 mb-4">
            <h3 className="font-semibold text-brand-900 mb-3">Get started in 30 seconds</h3>
            <ol className="space-y-2 text-sm text-brand-800">
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 bg-brand-200 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <span>Click the <strong>+</strong> button in the sidebar to create a new note</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 bg-brand-200 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <span>Start typing - your notes are automatically saved</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 bg-brand-200 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                <span>Type <Kbd>@</Kbd> to link to other notes and build your knowledge graph</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 bg-brand-200 rounded-full flex items-center justify-center text-xs font-bold">4</span>
                <span>Toggle the graph view to visualize connections between your notes</span>
              </li>
            </ol>
          </div>
        </Section>

        {/* Notes Management */}
        <Section title="Notes Management" icon={<FileText className="w-5 h-5 text-brand-600" />}>
          <FeatureCard
            title="Creating Notes"
            description="Click the + button in the sidebar header, or right-click anywhere in the sidebar and select 'New Note'."
          />
          <FeatureCard
            title="Editing Notes"
            description="Click on any note in the sidebar to select it. The note title can be edited directly in the header bar. Content is edited in the main editor area."
          />
          <FeatureCard
            title="Note Actions (Right-Click Menu)"
            description="Right-click on any note to access these options:"
          >
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded text-xs">
                <Pencil className="w-3 h-3" /> Rename
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded text-xs">
                <Copy className="w-3 h-3" /> Duplicate
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded text-xs">
                <FolderOpen className="w-3 h-3" /> Move to Folder
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                <Trash2 className="w-3 h-3" /> Delete
              </span>
            </div>
          </FeatureCard>
          <FeatureCard
            title="Search"
            description="Use the search bar at the top of the sidebar to quickly find notes by title or content. Results update as you type."
          >
            <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
              <Search className="w-4 h-4" />
              <span>Searches both note titles and content</span>
            </div>
          </FeatureCard>
        </Section>

        {/* Folders */}
        <Section title="Folders & Organization" icon={<FolderOpen className="w-5 h-5 text-brand-600" />}>
          <FeatureCard
            title="Creating Folders"
            description="Click the folder icon in the sidebar header, or right-click in the sidebar and select 'New Folder'. Enter a name and press Enter to create."
          />
          <FeatureCard
            title="Organizing Notes"
            description="Drag and drop notes into folders to organize them. You can also use the right-click menu to move notes between folders."
          >
            <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
              <MousePointer className="w-4 h-4" />
              <span>Drag notes over a folder to move them</span>
            </div>
          </FeatureCard>
          <FeatureCard
            title="Folder Actions"
            description="Right-click on a folder to rename or delete it. Deleting a folder moves its notes to the root level (notes are never deleted when removing a folder)."
          />
          <FeatureCard
            title="Collapse/Expand"
            description="Click the arrow icon next to a folder name to collapse or expand it."
          >
            <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
              <ChevronDown className="w-4 h-4" />
              <span>Collapsed folders hide their contents but preserve organization</span>
            </div>
          </FeatureCard>
        </Section>

        {/* Rich Text Editor */}
        <Section title="Rich Text Editor" icon={<Command className="w-5 h-5 text-brand-600" />}>
          <FeatureCard
            title="Slash Commands"
            description="Type / at the start of a line to open the command menu. Search or use arrow keys to select a formatting option."
          >
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Heading1 className="w-4 h-4 text-slate-400" />
                <span>/h1 - Heading 1</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Heading2 className="w-4 h-4 text-slate-400" />
                <span>/h2 - Heading 2</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Heading3 className="w-4 h-4 text-slate-400" />
                <span>/h3 - Heading 3</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Bold className="w-4 h-4 text-slate-400" />
                <span>/bold - Bold text</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Italic className="w-4 h-4 text-slate-400" />
                <span>/italic - Italic text</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Code className="w-4 h-4 text-slate-400" />
                <span>/code - Inline code</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Code className="w-4 h-4 text-slate-400" />
                <span>/codeblock - Code block</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <List className="w-4 h-4 text-slate-400" />
                <span>/bullet - Bullet list</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <ListOrdered className="w-4 h-4 text-slate-400" />
                <span>/numbered - Numbered list</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Quote className="w-4 h-4 text-slate-400" />
                <span>/quote - Block quote</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Minus className="w-4 h-4 text-slate-400" />
                <span>/divider - Horizontal rule</span>
              </div>
            </div>
          </FeatureCard>
          <FeatureCard
            title="Quick Bullet Lists"
            description="Type - followed by a space at the start of a line to automatically create a bullet list item. Press Enter to continue the list, or Enter on an empty item to exit."
          />
          <FeatureCard
            title="Drag & Drop Blocks"
            description="Hover near the left edge of any block (heading, list item, quote, etc.) to reveal the drag handle. Drag blocks to reorder your content."
          >
            <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
              <GripVertical className="w-4 h-4" />
              <span>Drag handle appears on hover</span>
            </div>
          </FeatureCard>
        </Section>

        {/* Keyboard Shortcuts */}
        <Section title="Keyboard Shortcuts" icon={<Keyboard className="w-5 h-5 text-brand-600" />}>
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-700">Shortcut</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="px-4 py-3"><Kbd>Cmd/Ctrl</Kbd> + <Kbd>P</Kbd></td>
                  <td className="px-4 py-3 text-slate-600">Command palette: search notes and run any command</td>
                </tr>
                <tr>
                  <td className="px-4 py-3"><Kbd>Cmd/Ctrl</Kbd> + <Kbd>Alt</Kbd> + <Kbd>N</Kbd></td>
                  <td className="px-4 py-3 text-slate-600">New note</td>
                </tr>
                <tr>
                  <td className="px-4 py-3"><Kbd>Cmd/Ctrl</Kbd> + <Kbd>Shift</Kbd> + <Kbd>D</Kbd></td>
                  <td className="px-4 py-3 text-slate-600">Today's daily note</td>
                </tr>
                <tr>
                  <td className="px-4 py-3"><Kbd>Cmd/Ctrl</Kbd> + <Kbd>Shift</Kbd> + <Kbd>T</Kbd></td>
                  <td className="px-4 py-3 text-slate-600">New note from a template</td>
                </tr>
                <tr>
                  <td className="px-4 py-3"><Kbd>Cmd/Ctrl</Kbd> + <Kbd>.</Kbd></td>
                  <td className="px-4 py-3 text-slate-600">Focus mode</td>
                </tr>
                <tr>
                  <td className="px-4 py-3"><Kbd>Cmd/Ctrl</Kbd> + <Kbd>{"\\"}</Kbd></td>
                  <td className="px-4 py-3 text-slate-600">Show or hide the sidebar</td>
                </tr>
                <tr>
                  <td className="px-4 py-3"><Kbd>Cmd/Ctrl</Kbd> + <Kbd>Shift</Kbd> + <Kbd>E</Kbd></td>
                  <td className="px-4 py-3 text-slate-600">Backup & export</td>
                </tr>
                <tr>
                  <td className="px-4 py-3"><Kbd>Cmd/Ctrl</Kbd> + <Kbd>/</Kbd></td>
                  <td className="px-4 py-3 text-slate-600">All keyboard shortcuts</td>
                </tr>
                <tr>
                  <td className="px-4 py-3"><Kbd>Cmd/Ctrl</Kbd> + <Kbd>B</Kbd></td>
                  <td className="px-4 py-3 text-slate-600">Bold text</td>
                </tr>
                <tr>
                  <td className="px-4 py-3"><Kbd>Cmd/Ctrl</Kbd> + <Kbd>I</Kbd></td>
                  <td className="px-4 py-3 text-slate-600">Italic text</td>
                </tr>
                <tr>
                  <td className="px-4 py-3"><Kbd>Cmd/Ctrl</Kbd> + <Kbd>U</Kbd></td>
                  <td className="px-4 py-3 text-slate-600">Underline text</td>
                </tr>
                <tr>
                  <td className="px-4 py-3"><Kbd>Cmd/Ctrl</Kbd> + <Kbd>K</Kbd></td>
                  <td className="px-4 py-3 text-slate-600">Insert external URL link</td>
                </tr>
                <tr>
                  <td className="px-4 py-3"><Kbd>Cmd/Ctrl</Kbd> + <Kbd>Z</Kbd></td>
                  <td className="px-4 py-3 text-slate-600 flex items-center gap-2">
                    <Undo2 className="w-4 h-4" /> Undo
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3"><Kbd>Cmd/Ctrl</Kbd> + <Kbd>Shift</Kbd> + <Kbd>Z</Kbd></td>
                  <td className="px-4 py-3 text-slate-600 flex items-center gap-2">
                    <Redo2 className="w-4 h-4" /> Redo
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3"><Kbd>Escape</Kbd></td>
                  <td className="px-4 py-3 text-slate-600">Close any open menu</td>
                </tr>
                <tr>
                  <td className="px-4 py-3"><Kbd>Enter</Kbd></td>
                  <td className="px-4 py-3 text-slate-600">New line, or new list item when in a list</td>
                </tr>
                <tr>
                  <td className="px-4 py-3"><Kbd>Arrow Up/Down</Kbd></td>
                  <td className="px-4 py-3 text-slate-600">Navigate menu options</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        {/* Wiki Links */}
        <Section title="Wiki Links & Connections" icon={<Link2 className="w-5 h-5 text-brand-600" />}>
          <FeatureCard
            title="Creating Links with @"
            description="Type @ anywhere in your note to open the link menu. Start typing to search for existing notes, or create a new note directly from the menu."
          >
            <div className="bg-slate-50 rounded p-3 mt-2">
              <p className="text-xs text-slate-600 mb-2">Example:</p>
              <p className="text-sm font-mono">Check out my notes on @Project Ideas</p>
            </div>
          </FeatureCard>
          <FeatureCard
            title="Link Chips"
            description="Links appear as clickable chips in your notes. Click a chip to navigate to the linked note. If the note doesn't exist, you'll be prompted to create it."
          />
          <FeatureCard
            title="Backlinks Panel"
            description="The right panel shows all notes that link TO the current note. This helps you discover connections and navigate your knowledge graph."
          />
          <FeatureCard
            title="Deleting Links"
            description="Position your cursor right after a link chip and press Backspace to remove it."
          />
        </Section>

        {/* Date Reminders */}
        <Section title="Date Chips & Reminders" icon={<Calendar className="w-5 h-5 text-brand-600" />}>
          <FeatureCard
            title="Adding Dates"
            description="Type @@ to open the date picker. Choose from quick options like 'Today', 'Tomorrow', specific days, or pick a custom date from the calendar."
          >
            <div className="bg-slate-50 rounded p-3 mt-2">
              <p className="text-xs text-slate-600 mb-2">Quick options include:</p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded">Today</span>
                <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded">Tomorrow</span>
                <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded">Next Monday</span>
                <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded">In 2 Weeks</span>
                <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded">Next Month</span>
              </div>
            </div>
          </FeatureCard>
          <FeatureCard
            title="Time Selection"
            description="Set a specific time for your date reminder using the time picker in the date menu. The default is 09:00."
          />
          <FeatureCard
            title="Custom Dates"
            description="Type a date in DD.MM.YYYY format directly in the search field, or use the calendar picker for any date."
          />
          <FeatureCard
            title="Editing Dates"
            description="Click on any date chip to open the date picker and change the date or time."
          />
        </Section>

        {/* Graph View */}
        <Section title="Graph Visualization" icon={<Eye className="w-5 h-5 text-brand-600" />}>
          <FeatureCard
            title="Toggle Graph View"
            description="Click the 'View Graph' button in the header to show or hide the graph panel on the right side of the screen."
          >
            <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
              <PanelRightOpen className="w-4 h-4" />
              <span>Graph panel is resizable - drag the left edge</span>
            </div>
          </FeatureCard>
          <FeatureCard
            title="2D vs 3D Mode"
            description="Switch between 2D and 3D graph views using the toggle buttons at the top of the graph panel. 3D mode allows you to rotate and explore your knowledge graph in space."
          />
          <FeatureCard
            title="Navigating the Graph"
            description="Click on any node (circle) in the graph to navigate to that note. The currently active note is highlighted. Lines between nodes represent links."
          />
          <FeatureCard
            title="Understanding the Graph"
            description="Each node represents a note. Lines (edges) connect notes that are linked together. Notes with more connections appear more central. Isolated notes appear on the edges."
          />
        </Section>

        {/* Daily notes, templates and tasks */}
        <Section title="Daily Notes, Templates & Tasks" icon={<CalendarDays className="w-5 h-5 text-brand-600" />}>
          <FeatureCard title="Daily notes" description="Press Cmd/Ctrl + Shift + D, or click Today in the sidebar, to open today's note. Use it as a journal, a log or an inbox for the day." />
          <FeatureCard title="Templates" description="Press Cmd/Ctrl + Shift + T, or click Templates, to start a meeting note, project brief, Zettel, journal or reading note. {{date}} and {{time}} fill in automatically." />
          <FeatureCard title="Checklists and the Tasks view" description="Type /todo to add a checklist item. Open Tasks in the sidebar to see every open item from every note in one list." />
          <FeatureCard title="Focus, themes and stats" description="Cmd/Ctrl + . hides everything but the page. Switch light, dark or system mode and the editor font from the menus. Stats shows your writing streak and an 18-week heatmap." />
        </Section>

        {/* History, trash and backups */}
        <Section title="History, Trash & Backups" icon={<History className="w-5 h-5 text-brand-600" />}>
          <FeatureCard title="Stored in your browser" description="Notes are saved locally as you type, with no save button and no account. Clearing your browser's site data deletes them, so keep a backup or turn on Pro sync." />
          <FeatureCard title="Version history" description="Every note keeps earlier versions (20 on Free, 200 on Pro). Open a note's ⋯ menu and choose Version history to compare and restore." />
          <FeatureCard title="Trash" description="Deleted notes wait 30 days in the trash, and you can undo a delete right away." />
          <FeatureCard title="Export and import" description="Backup & export (Cmd/Ctrl + Shift + E) saves a Markdown .zip that opens in Obsidian and other apps, a full JSON backup, or an AES-256 encrypted vault. Import works with .md, .zip, .json and vault files." />
        </Section>

        {/* Sharing */}
        <Section title="Sharing" icon={<Share2 className="w-5 h-5 text-brand-600" />}>
          <FeatureCard title="Snapshot links" description="Share as link packs the note into the link itself, so nothing is uploaded. Anyone with the link can read the snapshot and save a copy." />
          <FeatureCard title="Print or PDF" description="Choose Print / PDF in a note's ⋯ menu for a clean printout or a PDF." />
        </Section>

        {/* Pro */}
        <Section title="NoteWeb Pro" icon={<Gem className="w-5 h-5 text-brand-600" />}>
          <FeatureCard title="Activating Pro" description="After checkout you get a license key by email. Click NoteWeb Pro in the sidebar and paste it. Do this once on each browser or device you use. Your key is your account." />
          <FeatureCard title="Encrypted sync" description="Open Sync in the Pro menu and choose a passphrase. Notes are encrypted on your device before they are uploaded, and we cannot read them. On another device, activate your key and enter the same passphrase. We cannot recover a lost passphrase." />
          <FeatureCard title="Publishing" description="In Share, choose Publish this note to get a page at noteweb.co/p/… Republish to update it. You can require a password (the page is encrypted in your browser), make it open only once, or let it expire after 1, 7 or 30 days." />
          <FeatureCard title="Your public site" description="In Share, create your site at noteweb.co/u/your-name. It lists all your open published notes with search and tags. Password and view-once pages are never listed." />
          <FeatureCard title="Private notes" description="Choose Make private in a note's ⋯ menu and set a password. The note is encrypted, hidden from search, the graph and previews, and locks again after 10 minutes." />
          <FeatureCard title="Automatic backups, templates and export" description="Pick a folder in Backup & export for a daily backup (the last 14 are kept). Save any note as a template from its ⋯ menu. Export a note as a Word document or a web page from the same menu." />
          <FeatureCard title="Themes" description="Choose Paper, Nord or High contrast and an accent color in the Pro menu. Each theme has a light and a dark version." />
        </Section>

        {/* Tips & Tricks */}
        <Section title="Tips & Tricks" icon={<HelpCircle className="w-5 h-5 text-brand-600" />}>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <h4 className="font-medium text-slate-900 mb-2">Build Your Graph</h4>
              <p className="text-sm text-slate-600">The more you link notes together, the more valuable your graph becomes. Try to connect related ideas whenever possible.</p>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <h4 className="font-medium text-slate-900 mb-2">Use Folders for Projects</h4>
              <p className="text-sm text-slate-600">Organize notes by project or topic. Links work across folders, so organization doesn't limit connections.</p>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <h4 className="font-medium text-slate-900 mb-2">Explore Backlinks</h4>
              <p className="text-sm text-slate-600">Regularly check the backlinks panel to discover unexpected connections between your notes.</p>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <h4 className="font-medium text-slate-900 mb-2">Quick Formatting</h4>
              <p className="text-sm text-slate-600">Use slash commands for headings and formatting. Type /h1, /h2, /bullet, etc. for quick access.</p>
            </div>
          </div>
        </Section>

        {/* CTA */}
        <div className="bg-brand-50 rounded-xl border border-brand-100 p-8 text-center mt-8">
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Ready to start?</h3>
          <p className="text-slate-600 mb-4">Jump back into NoteWeb and start building your knowledge graph.</p>
          <Link
            to="/app"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-on-accent font-medium rounded-lg hover:bg-brand-700 transition-colors"
          >
            <Network className="w-5 h-5" />
            Open NoteWeb
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-auto">
        <div className="max-w-4xl mx-auto px-6 py-8 text-center text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} NoteWeb. All rights reserved.</p>
        </div>
      </footer>
      </div>
    </MarketingPage>
  );
};

export default HelpPage;
