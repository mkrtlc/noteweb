import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight,
  GraduationCap,
  PenLine,
  Code2,
  Lightbulb,
  BookOpen,
  CalendarDays,
  Users,
  FlaskConical,
  Layers,
  NotebookPen,
  Brain,
  ListChecks,
  Quote,
  Plus,
} from 'lucide-react';
import { MarketingPage, Atmosphere } from '../components/SiteChrome';
import { useSeo } from '../hooks/useSeo';
import { trackFeature } from '../services/analyticsService';

/* ------------------------------------------------------------------ */
/* Small mock UIs (pure HTML/SVG, no screenshots)                      */
/* ------------------------------------------------------------------ */

const MockLinks: React.FC = () => (
  <div className="mk-paper w-[88%] p-4 text-[11px] leading-[1.7] text-[#3a3d48] -rotate-[4deg] translate-y-2">
    <p className="mk-serif text-[15px] text-[#0b0a14] mb-1.5">Deep work rituals</p>
    <p>
      Protect two focus blocks a day. Related to <span className="mk-chip">Time blocking</span> and the ideas in{' '}
      <span className="mk-chip">Reading: Deep Work</span>.
    </p>
    <div className="mt-3 pt-2 border-t border-[#eef0f3]">
      <p className="text-[9px] uppercase tracking-[0.08em] text-[#8a8e9b] mb-1.5">Linked from · 3</p>
      {['Weekly review', 'Energy management', 'Morning pages'].map(t => (
        <div key={t} className="flex items-center gap-1.5 py-0.5">
          <ChevronRight className="w-3 h-3 text-[#b3b7c2]" />
          <span>{t}</span>
        </div>
      ))}
    </div>
  </div>
);

const MockGraph: React.FC<{ big?: boolean }> = ({ big }) => {
  const nodes: [number, number, number, boolean?][] = [
    [150, 110, 11, true],
    [70, 60, 7],
    [235, 55, 7],
    [240, 160, 7],
    [80, 175, 7],
    [30, 110, 5],
    [285, 105, 5],
    [150, 205, 5],
    [150, 25, 5],
    [205, 210, 4],
    [110, 145, 4],
  ];
  const links = [
    [0, 1], [0, 2], [0, 3], [0, 4], [1, 5], [2, 6], [3, 6], [4, 7], [1, 8], [2, 8], [3, 9], [0, 10], [10, 4],
  ];
  return (
    <svg viewBox="0 0 310 230" className={big ? 'w-full h-full' : 'w-[92%] h-auto'}>
      {links.map(([a, b], i) => (
        <line
          key={i}
          x1={nodes[a][0]}
          y1={nodes[a][1]}
          x2={nodes[b][0]}
          y2={nodes[b][1]}
          stroke={i % 3 === 0 ? '#9cc6d4' : '#d6dbe3'}
          strokeWidth="1.2"
          className={i % 3 === 0 ? 'mk-dash' : undefined}
        />
      ))}
      {nodes.map(([x, y, r, hub], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={r} fill={hub ? '#05536c' : i % 2 ? '#7fb4c6' : '#c4dde6'} className={hub ? 'mk-pulse' : undefined} />
          {hub && <circle cx={x} cy={y} r={r + 7} fill="none" stroke="#05536c" strokeOpacity="0.18" />}
        </g>
      ))}
      <text x="150" y="137" textAnchor="middle" fontSize="9" fill="#0b0a14" fontFamily="Hedvig Letters Serif, serif">
        Second brain
      </text>
    </svg>
  );
};

const MockPalette: React.FC = () => (
  <div className="mk-paper w-[90%] text-[11px]">
    <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[#eef0f3]">
      <span className="text-[#8a8e9b]">⌘P</span>
      <span className="text-[#0b0a14]">
        zettel
        <span className="mk-caret ml-px" />
      </span>
    </div>
    {[
      ['Zettelkasten method', 'One idea per note, in your own words…', true],
      ['Reading: How to Take Smart Notes', '…the slip-box as a thinking partner…'],
      ['Template: Zettel (atomic note)', 'Command'],
    ].map(([t, s, active]) => (
      <div key={t as string} className={`px-3 py-2 ${active ? 'bg-[#eef6f9]' : ''}`}>
        <p className="text-[#0b0a14]">
          {(t as string).toLowerCase().startsWith('zettel') ? (
            <>
              <mark className="bg-[#d7ecf3] text-[#05536c] px-px">{(t as string).slice(0, 6)}</mark>
              {(t as string).slice(6)}
            </>
          ) : (
            t
          )}
        </p>
        <p className="text-[#8a8e9b] truncate">{s}</p>
      </div>
    ))}
  </div>
);

const MockDaily: React.FC = () => (
  <div className="mk-paper w-[86%] p-4 text-[11px] text-[#3a3d48] rotate-[3deg]">
    <p className="text-[9px] uppercase tracking-[0.08em] text-[#8a8e9b]">Today</p>
    <p className="mk-serif text-[15px] text-[#0b0a14] mb-2">Saturday, October 11</p>
    {[
      ['Ship the onboarding draft', true],
      ['Review Q4 goals', true],
      ['Outline the next essay', false],
    ].map(([t, done]) => (
      <div key={t as string} className="flex items-center gap-2 py-1">
        <span className={`w-3 h-3 border ${done ? 'bg-[#05536c] border-[#05536c]' : 'border-[#c9ccd4]'} flex items-center justify-center`}>
          {done && (
            <svg viewBox="0 0 10 10" className="w-2 h-2">
              <path d="M2 5.2l2 2 4-4.4" stroke="#fff" strokeWidth="1.6" fill="none" />
            </svg>
          )}
        </span>
        <span className={done ? 'line-through text-[#9a9daa]' : ''}>{t}</span>
      </div>
    ))}
    <div className="mt-2 flex gap-1.5">
      {['Meeting', 'Journal', 'Zettel'].map(t => (
        <span key={t} className="px-1.5 py-0.5 border border-[#e3e5ea] text-[10px] text-[#5d6170]">
          {t}
        </span>
      ))}
    </div>
  </div>
);

const MockHistory: React.FC = () => (
  <div className="w-[90%] flex gap-2 items-stretch">
    <div className="mk-paper w-[38%] py-1.5 text-[10px]">
      {['just now', '12m ago', '1h ago', 'Yesterday', 'Oct 2'].map((t, i) => (
        <div key={t} className={`px-2.5 py-1.5 ${i === 1 ? 'bg-[#eef6f9] text-[#05536c]' : 'text-[#5d6170]'}`}>
          {t}
        </div>
      ))}
    </div>
    <div className="mk-paper flex-1 p-3 text-[10px] text-[#3a3d48]">
      <p className="mk-serif text-[13px] text-[#0b0a14] mb-2">Essay draft</p>
      <div className="space-y-1.5">
        <div className="mk-skel w-full" />
        <div className="mk-skel w-11/12" />
        <div className="h-1.5 w-3/4 bg-[#fde3d6]" />
        <div className="mk-skel w-10/12" />
      </div>
      <div className="mt-3 inline-flex items-center gap-1 px-2 py-1 bg-[#05536c] text-white text-[10px]">Restore this version</div>
    </div>
  </div>
);

const MockVault: React.FC = () => (
  <div className="w-[88%] grid grid-cols-3 gap-2 -rotate-[2deg]">
    {[
      ['.md', 'Markdown', '#0b0a14'],
      ['.zip', 'Obsidian-ready', '#05536c'],
      ['.json', 'Full backup', '#5d6170'],
    ].map(([ext, label, color]) => (
      <div key={ext} className="mk-paper aspect-[3/4] p-2.5 flex flex-col justify-between">
        <span className="mk-serif text-[20px]" style={{ color }}>
          {ext}
        </span>
        <span className="text-[9px] text-[#8a8e9b]">{label}</span>
      </div>
    ))}
    <div className="col-span-3 mk-paper px-3 py-2 flex items-center gap-2 text-[10px] text-[#3a3d48]">
      <span className="w-5 h-5 bg-[#0b0a14] text-white flex items-center justify-center text-[8px]">AES</span>
      noteweb-2026-10-11.nwvault · encrypted with your password
    </div>
  </div>
);

/* Showcase panels for the tabbed section */
const PanelEditor: React.FC = () => (
  <div className="mk-paper w-full max-w-[460px] p-6 text-[12px] leading-[1.75] text-[#3a3d48]">
    <p className="text-[10px] uppercase tracking-[0.08em] text-[#8a8e9b]">#research · edited just now</p>
    <p className="mk-serif text-[24px] text-[#0b0a14] mt-1 mb-3">Why spaced repetition works</p>
    <p className="mb-2">
      Memory decays on a curve. Reviewing just before you forget resets it, so each review buys more time than the last. See{' '}
      <span className="mk-chip">Forgetting curve</span> and <span className="mk-chip">Active recall</span>.
    </p>
    <ul className="list-disc pl-5 mb-2">
      <li>Short sessions beat long cramming</li>
      <li>Write the answer before you check it</li>
    </ul>
    <div className="border-l-2 border-[#05536c] bg-[#f6fafb] px-3 py-2 italic text-[#5d6170]">The best time to review is right before you forget.</div>
    <p className="mt-3 text-[#8a8e9b]">
      Type <span className="px-1 border border-[#e3e5ea] text-[#0b0a14]">/</span> for blocks, <span className="px-1 border border-[#e3e5ea] text-[#0b0a14]">@</span> to link a
      note
      <span className="mk-caret ml-1" />
    </p>
  </div>
);

const PanelGraph: React.FC = () => (
  <div className="mk-paper w-full max-w-[460px] aspect-[4/3] p-4 flex flex-col">
    <div className="flex justify-between text-[10px] text-[#8a8e9b] mb-1">
      <span>Graph · 128 notes · 311 links</span>
      <span className="flex gap-1">
        <span className="px-1.5 bg-[#0b0a14] text-white">2D</span>
        <span className="px-1.5 border border-[#e3e5ea]">3D</span>
      </span>
    </div>
    <div className="flex-1 min-h-0">
      <MockGraph big />
    </div>
  </div>
);

const PanelSearch: React.FC = () => (
  <div className="w-full max-w-[460px] flex justify-center">
    <MockPalette />
  </div>
);

const PanelSafety: React.FC = () => (
  <div className="mk-paper w-full max-w-[460px] p-5 text-[12px] text-[#3a3d48]">
    <p className="mk-serif text-[20px] text-[#0b0a14] mb-3">Backup, export & import</p>
    {[
      ['Markdown (.zip)', 'One .md file per note, in folders'],
      ['Full backup (.json)', 'Folders, tags and dates, restored exactly'],
      ['Encrypted vault', 'AES-256 with your password'],
    ].map(([t, s], i) => (
      <div key={t} className={`flex items-start gap-3 p-3 border ${i === 2 ? 'border-[#05536c] bg-[#f3f9fb]' : 'border-[#e3e5ea]'} mb-2`}>
        <span className={`mt-1 w-2 h-2 ${i === 2 ? 'bg-[#05536c]' : 'bg-[#c4dde6]'}`} />
        <div>
          <p className="text-[#0b0a14] font-medium">{t}</p>
          <p className="text-[#8a8e9b]">{s}</p>
        </div>
      </div>
    ))}
    <p className="text-[11px] text-[#5d6170] mt-1">Deleted notes wait 30 days in the trash. Every note keeps its version history.</p>
  </div>
);

/* ------------------------------------------------------------------ */
/* Content                                                             */
/* ------------------------------------------------------------------ */

const CELLS = [
  { title: 'Links & backlinks', body: 'Type @ or [[ to connect any two notes. Every note shows what points to it, plus mentions you can link in one click.', media: <MockLinks /> },
  { title: 'A graph of your thinking', body: 'See every note as a living network in 2D or 3D. Clusters appear on their own, so forgotten ideas resurface.', media: <MockGraph /> },
  { title: 'Find anything instantly', body: 'One shortcut opens ranked full-text search and every command, with matches highlighted as you type.', media: <MockPalette /> },
  { title: 'Daily notes & templates', body: "Open today's note with ⌘⇧D. Start meetings, projects, journals and Zettels from ready-made templates.", media: <MockDaily /> },
  { title: 'Nothing is ever lost', body: 'Every note keeps a version history you can restore. Deleted notes wait in the trash for 30 days.', media: <MockHistory /> },
  { title: 'Your files, your format', body: 'Export plain Markdown that opens anywhere, a full JSON backup, or an AES-256 encrypted vault.', media: <MockVault /> },
];

const FORMATS = ['Markdown', 'Wiki links', 'Plain text', 'JSON backups', 'Encrypted vaults', 'Offline app', 'PDF print', 'Share links'];

const PROMISES = [
  { quote: 'Your notes never leave your device.', by: 'Local-first by design' },
  { quote: 'Everything exports to plain Markdown, whenever you want.', by: 'No lock-in' },
  { quote: 'No account, no ads, no tracking of what you write.', by: 'Private by default' },
];

const AUDIENCES = [
  {
    icon: GraduationCap,
    title: 'Students & researchers',
    body: 'Turn lectures, papers and readings into a web of ideas you can actually revise from.',
    points: ['Link concepts across courses', 'Reading notes and literature maps', 'Search everything before an exam'],
  },
  {
    icon: PenLine,
    title: 'Writers & creators',
    body: 'Collect fragments, connect them, and watch an outline appear before you start drafting.',
    points: ['Atomic notes that grow into essays', 'Daily pages and idea capture', 'Focus mode for long-form writing'],
    highlight: true,
  },
  {
    icon: Code2,
    title: 'Developers & founders',
    body: 'Keep decisions, meeting notes and research in one fast, keyboard-first notebook.',
    points: ['Markdown, code blocks and ⌘P everywhere', 'Meeting and project templates', 'Works offline, exports to plain files'],
  },
];

const USES: [string, React.ElementType][] = [
  ['Zettelkasten', Layers],
  ['Second brain', Brain],
  ['Journaling', NotebookPen],
  ['Research', FlaskConical],
  ['Reading notes', BookOpen],
  ['Meeting notes', Users],
  ['Course notes', GraduationCap],
  ['Project planning', ListChecks],
  ['Daily planning', CalendarDays],
  ['Writing drafts', PenLine],
  ['Idea capture', Lightbulb],
  ['Quotes & highlights', Quote],
];

const TABS = [
  { title: 'Write without friction', sub: 'Markdown, slash commands and checklists that stay out of your way.', panel: <PanelEditor /> },
  { title: 'See the big picture', sub: 'A live knowledge graph, with a local view around any note.', panel: <PanelGraph /> },
  { title: 'Find it in a second', sub: 'Ranked search and every action behind one shortcut.', panel: <PanelSearch /> },
  { title: 'Keep it safe', sub: 'History, trash and encrypted backups, all on your device.', panel: <PanelSafety /> },
];

const TAB_MS = 6000;

/* ------------------------------------------------------------------ */

const Headline: React.FC<{ text: string; delay?: number }> = ({ text, delay = 0 }) => (
  <>
    {text.split(' ').map((w, i) => (
      <React.Fragment key={i}>
        <span className="mk-word" style={{ animationDelay: `${delay + i * 90}ms` }}>
          {w}
        </span>{' '}
      </React.Fragment>
    ))}
  </>
);

const delay = (ms: number) => ({ ['--mk-delay' as string]: `${ms}ms` }) as React.CSSProperties;

const Landing: React.FC = () => {
  const [tab, setTab] = useState(0);
  const [tabCycle, setTabCycle] = useState(0);
  useSeo(
    'NoteWeb: the private notebook for connected thinking',
    'NoteWeb is a fast, private note-taking app with wiki links, backlinks, daily notes and a live knowledge graph. Local-first, works offline, no signup.',
    '/'
  );

  useEffect(() => {
    const t = setTimeout(() => {
      setTab(i => (i + 1) % TABS.length);
      setTabCycle(c => c + 1);
    }, TAB_MS);
    return () => clearTimeout(t);
  }, [tab, tabCycle]);

  const cta = (where: string) => () => trackFeature('landing_cta_clicked', { where });

  return (
    <MarketingPage>
      {/* ---------- Hero ---------- */}
      <section className="mk-atmo min-h-[100svh] flex items-center">
        <Atmosphere />
        <div className="mk-container pt-28 pb-40 text-center">
          <h1 className="mk-h1 max-w-[780px] mx-auto">
            <Headline text="The private notebook for connected thinking" />
          </h1>
          <p className="mk-fade-late mt-5 max-w-[560px] mx-auto text-[15px] leading-relaxed text-white/80" style={{ animationDelay: '900ms' }}>
            NoteWeb links every idea you write into a living knowledge graph. Markdown, backlinks and search, all on your own device.
          </p>
          <div className="mk-fade-late mt-10 flex items-center justify-center gap-3" style={{ animationDelay: '1150ms' }}>
            <Link to="/app" onClick={cta('hero')} className="mk-btn mk-btn-light mk-btn-lg">
              Start writing free <ChevronRight className="w-4 h-4" />
            </Link>
            <Link to="/pricing" className="mk-btn mk-btn-ghost-dark mk-btn-lg hidden sm:inline-flex">
              See Pro <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <p className="mk-fade-late mt-6 text-[12px] text-white/55" style={{ animationDelay: '1350ms' }}>
            No signup · Works offline · Free forever
          </p>
        </div>
      </section>

      {/* ---------- Strip ---------- */}
      <section className="bg-gradient-to-b from-white to-[#f7f7f8] py-10">
        <p className="text-center text-[15px] text-[#8a8e9b] mb-6">Built on open formats you already trust</p>
        <div className="mk-marquee overflow-hidden">
          <div className="mk-marquee-track gap-14 pr-14">
            {[...FORMATS, ...FORMATS].map((f, i) => (
              <span key={i} className="mk-serif text-[22px] text-[#b4b8c3] whitespace-nowrap">
                {f}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Features ---------- */}
      <section id="features" className="py-24 sm:py-32 scroll-mt-16">
        <div className="mk-container">
          <div className="text-center max-w-[720px] mx-auto">
            <p className="mk-eyebrow mk-reveal">Think more, file less</p>
            <h2 className="mk-h2 mt-4 mk-reveal" style={delay(80)}>
              Stop losing good ideas in folders
            </h2>
            <p className="mk-lead mt-4 mk-reveal" style={delay(160)}>
              NoteWeb is built for people who think by connecting: every note links, every link is searchable, and nothing leaves your device.
            </p>
            <div className="mt-8 flex items-center justify-center gap-2 mk-reveal" style={delay(240)}>
              <Link to="/app" onClick={cta('features')} className="mk-btn mk-btn-teal">
                Start writing <ChevronRight className="w-3.5 h-3.5" />
              </Link>
              <a href="#inside" className="mk-btn mk-btn-outline">
                Learn more <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="mk-bento mt-16">
            {CELLS.map((c, i) => (
              <div key={c.title} className="mk-cell mk-reveal" style={delay((i % 3) * 90)}>
                <div className="mk-cell-media bg-gradient-to-b from-[#fafbfc] to-white">{c.media}</div>
                <h3 className="mk-h3">{c.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-[#5d6170]">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Formats ---------- */}
      <section className="pb-24 sm:pb-28">
        <div className="mk-container">
          <div className="text-center max-w-[640px] mx-auto">
            <h2 className="mk-serif text-[clamp(28px,4vw,40px)] leading-[1.15] mk-reveal">Works with the files you already have, no migration needed</h2>
            <p className="mk-lead mt-4 mk-reveal" style={delay(80)}>
              Import Markdown folders and zipped vaults with your [[wiki links]] intact. Export everything again in one click, whenever you like.
            </p>
          </div>
          <div className="mk-tiles mt-12 mk-reveal" style={delay(160)}>
            {[
              ['M↓', 'Markdown'],
              ['.zip', 'Vaults'],
              ['.txt', 'Plain text'],
              ['{ }', 'JSON'],
              ['AES', 'Encrypted'],
              ['PDF', 'Print'],
              ['⇪', 'Offline app'],
              ['↗', 'Share link'],
            ].map(([glyph, label]) => (
              <div key={label} className="group flex-col gap-1">
                <span className="mk-serif text-[22px] text-[#05536c] transition-transform duration-300 group-hover:-translate-y-0.5">{glyph}</span>
                <span className="text-[10px] uppercase tracking-[0.08em] text-[#8a8e9b]">{label}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center mk-reveal">
            <Link to="/help" className="mk-btn mk-btn-outline">
              How import works <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- Promises (dark) ---------- */}
      <section className="mk-atmo mk-atmo-cta py-24 sm:py-32">
        <Atmosphere variant="cta" />
        <div className="mk-container">
          <div className="text-center">
            <p className="mk-eyebrow !text-white/70 mk-reveal">Private by design</p>
            <h2 className="mk-h2 mt-4 mk-reveal" style={delay(80)}>
              Three promises we keep
            </h2>
          </div>
          <div className="mt-14 grid md:grid-cols-3 gap-3 max-w-[900px] mx-auto">
            {PROMISES.map((p, i) => (
              <figure key={p.by} className="mk-glass p-8 text-center mk-reveal" style={delay(i * 120)}>
                <span className="mk-serif text-[28px] text-white/50 leading-none">“</span>
                <blockquote className="mk-serif text-[21px] leading-[1.3] text-white/90 mt-2">{p.quote}</blockquote>
                <figcaption className="mt-4 text-[10px] tracking-[0.1em] uppercase text-white/50">{p.by}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Who it's for ---------- */}
      <section className="py-24 sm:py-32">
        <div className="mk-container">
          <div className="text-center">
            <p className="mk-eyebrow mk-reveal">Who it's for</p>
            <h2 className="mk-h2 mt-4 max-w-[680px] mx-auto mk-reveal" style={delay(80)}>
              Built for the way curious people think
            </h2>
          </div>
          <div className="mk-bento mt-14">
            {AUDIENCES.map((a, i) => (
              <div key={a.title} className={`mk-cell !py-10 text-center mk-reveal ${a.highlight ? '!bg-[#f7f7f8]' : ''}`} style={delay(i * 100)}>
                <a.icon className="w-9 h-9 mx-auto text-[#7fb4c6]" strokeWidth={1.2} />
                <h3 className="mk-h3 mt-5">{a.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-[#5d6170] max-w-[280px] mx-auto">{a.body}</p>
                <div className="w-16 h-px bg-[#e7e8ec] mx-auto my-6" />
                <ul className="text-left text-[13.5px] text-[#8a8e9b] space-y-2 max-w-[260px] mx-auto">
                  {a.points.map(p => (
                    <li key={p} className="flex gap-2">
                      <span className="mt-[7px] w-1 h-1 rounded-full bg-[#b4b8c3] shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <h3 className="mk-serif text-[30px] text-center mt-24 mk-reveal">What people use NoteWeb for</h3>
          <div className="mt-8 flex flex-wrap justify-center gap-2 max-w-[760px] mx-auto">
            {USES.map(([label, Icon], i) => (
              <span key={label} className="mk-pill mk-reveal" style={delay(i * 35)}>
                <Icon className="w-3.5 h-3.5" />
                {label}
              </span>
            ))}
            <span className="mk-pill mk-reveal">
              <Plus className="w-3.5 h-3.5" />& much more
            </span>
          </div>
        </div>
      </section>

      {/* ---------- Inside NoteWeb (tabs) ---------- */}
      <section id="inside" className="bg-[#f7f7f8] py-24 sm:py-32 scroll-mt-16">
        <div className="mk-container">
          <div className="text-center">
            <p className="mk-eyebrow mk-reveal">Inside NoteWeb</p>
            <h2 className="mk-h2 mt-4 mk-reveal" style={delay(80)}>
              Everything connects
            </h2>
          </div>
          <div className="mt-14 grid md:grid-cols-2 border-t border-l border-[#e7e8ec] mk-reveal">
            <div className="border-r border-[#e7e8ec] bg-white/60">
              {TABS.map((t, i) => (
                <button
                  key={t.title}
                  className="mk-tab"
                  data-active={i === tab}
                  onClick={() => {
                    setTab(i);
                    setTabCycle(c => c + 1);
                  }}
                >
                  {i === tab && <span key={`${tab}-${tabCycle}`} className="mk-tab-progress" style={{ animationDuration: `${TAB_MS}ms` }} />}
                  <span className="mk-h3 block !text-[24px]">{t.title}</span>
                  <span className="mk-tab-sub block mt-1.5 text-[13.5px]">{t.sub}</span>
                </button>
              ))}
            </div>
            <div className="border-r border-b border-[#e7e8ec] min-h-[420px] flex items-center justify-center p-6 sm:p-10 bg-[radial-gradient(ellipse_at_center,#eef6fa_0%,#f7f7f8_70%)]">
              <div key={tab} className="mk-panel-enter w-full flex justify-center">
                {TABS[tab].panel}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Final CTA ---------- */}
      <section className="mk-atmo mk-atmo-cta py-32 sm:py-40">
        <Atmosphere variant="cta" />
        <div className="mk-container text-center">
          <h2 className="mk-h2 max-w-[640px] mx-auto mk-reveal">Put your ideas on a map and think more clearly</h2>
          <p className="mt-5 text-[15px] text-white/80 mk-reveal" style={delay(100)}>
            NoteWeb turns scattered notes into a connected, searchable second brain. Free, private, yours.
          </p>
          <div className="mt-10 mk-reveal" style={delay(200)}>
            <Link to="/app" onClick={cta('footer')} className="mk-btn mk-btn-light mk-btn-lg">
              Open NoteWeb <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </MarketingPage>
  );
};

export default Landing;
