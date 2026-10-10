import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Network,
  Link2,
  Search,
  CalendarDays,
  ShieldCheck,
  History,
  Lock,
  WifiOff,
  Download,
  ChevronDown,
  Sparkles,
  Zap,
  Check,
} from 'lucide-react';
import Logo from '../components/Logo';
import SiteHeader, { SiteFooter } from '../components/SiteChrome';
import { useSeo } from '../hooks/useSeo';
import { trackFeature } from '../services/analyticsService';

const FEATURES = [
  {
    icon: Link2,
    title: 'Links & backlinks',
    body: 'Type @ or [[ to connect any two notes. Every note shows what links to it, plus unlinked mentions you can turn into links in one click.',
  },
  {
    icon: Network,
    title: 'A graph of your thinking',
    body: 'See your notes as a living network in 2D or 3D. Clusters show up on their own, so you find ideas you forgot you had.',
  },
  {
    icon: Search,
    title: 'Find anything instantly',
    body: 'One shortcut opens full-text search and every command. Results are ranked and highlighted as you type.',
  },
  {
    icon: CalendarDays,
    title: 'Daily notes & templates',
    body: "Open today's note with ⌘⇧D. Start meetings, projects, journals and Zettels from ready-made templates.",
  },
  {
    icon: History,
    title: 'Nothing is ever lost',
    body: 'Every note keeps a version history you can restore. Deleted notes wait in the trash for 30 days.',
  },
  {
    icon: Download,
    title: 'Your files, your format',
    body: 'Export plain Markdown that opens in Obsidian or any editor, a full JSON backup, or an AES-256 encrypted vault.',
  },
];

const FAQ = [
  {
    q: 'Do I need an account?',
    a: 'No. Open the app and start writing. There is nothing to sign up for and no email to give.',
  },
  {
    q: 'Where are my notes stored?',
    a: "In your browser's local storage, on your device. NoteWeb has no server that receives your notes, so we couldn't read them even if we wanted to.",
  },
  {
    q: 'What happens if I clear my browser data?',
    a: 'Local notes are deleted with it. Use Backup & export in the sidebar to save a Markdown, JSON or encrypted copy. Encrypted sync across devices is coming with Pro.',
  },
  {
    q: 'Can I bring my notes from Obsidian or other apps?',
    a: 'Yes. Import .md files or a zipped vault. Folders and [[wiki links]] carry over.',
  },
  {
    q: 'Is NoteWeb free?',
    a: 'Yes. Unlimited notes and every core feature are free. NoteWeb Pro ($7/month or $60/year) adds accent themes and longer version history now, and encrypted sync and publishing as they ship.',
  },
];

/** A lightweight, static mock of the app UI for the hero. */
const HeroMock: React.FC = () => (
  <div className="relative mx-auto max-w-5xl">
    <div className="absolute -inset-x-10 -top-10 -bottom-10 bg-gradient-to-tr from-brand-200/40 via-transparent to-brand-300/30 blur-3xl rounded-[3rem] pointer-events-none" />
    <div className="relative rounded-2xl bg-white ring-1 ring-slate-200 shadow-2xl overflow-hidden">
      <div className="h-9 flex items-center gap-1.5 px-4 border-b border-slate-100 bg-slate-50">
        <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
        <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
        <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
        <span className="ml-3 text-[11px] text-slate-400">noteweb.co/app</span>
      </div>
      <div className="grid grid-cols-12 min-h-[340px] text-left">
        <div className="hidden sm:block col-span-3 border-r border-slate-100 bg-slate-50 p-3 space-y-1.5">
          <div className="flex items-center gap-2 mb-3">
            <Logo className="w-5 h-5" />
            <span className="text-xs font-semibold text-slate-700">NoteWeb</span>
          </div>
          {['Welcome to NoteWeb', 'Second brain ideas', 'Zettelkasten', 'Weekly review', 'Reading: Deep Work'].map((t, i) => (
            <div key={t} className={`text-[11px] px-2 py-1.5 rounded-md truncate ${i === 1 ? 'bg-white ring-1 ring-slate-200 text-slate-800 font-medium' : 'text-slate-500'}`}>
              {t}
            </div>
          ))}
          <div className="pt-3 flex flex-wrap gap-1">
            {['#ideas', '#reading', '#daily'].map(t => (
              <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full ring-1 ring-slate-200 text-slate-500">
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="col-span-12 sm:col-span-5 p-5 sm:p-6">
          <div className="text-lg font-semibold text-slate-900 mb-3">Second brain ideas</div>
          <div className="space-y-2 text-[13px] text-slate-600 leading-relaxed">
            <p>
              Capture fast, connect later. Every idea links back to <span className="link-chip">Zettelkasten</span> and the{' '}
              <span className="link-chip">Weekly review</span>.
            </p>
            <p className="font-medium text-slate-800">This week</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Summarize <span className="link-chip">Reading: Deep Work</span>
              </li>
              <li>Turn highlights into atomic notes</li>
              <li>
                Review on <span className="date-chip">Fri, 9:00</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="hidden sm:block col-span-4 border-l border-slate-100 bg-slate-50 relative">
          <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full">
            {[
              [100, 100, 50, 60],
              [100, 100, 155, 55],
              [100, 100, 150, 150],
              [100, 100, 55, 145],
              [50, 60, 30, 110],
              [155, 55, 175, 105],
              [150, 150, 175, 105],
              [55, 145, 100, 175],
            ].map(([x1, y1, x2, y2], i) => (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgb(var(--slate-300))" strokeWidth="1.2" />
            ))}
            {[
              [100, 100, 9, true],
              [50, 60, 6],
              [155, 55, 6],
              [150, 150, 6],
              [55, 145, 6],
              [30, 110, 4],
              [175, 105, 4],
              [100, 175, 4],
            ].map(([cx, cy, r, active], i) => (
              <circle key={i} cx={cx as number} cy={cy as number} r={r as number} fill={active ? 'rgb(var(--brand-600))' : 'rgb(var(--brand-300))'}>
                <animate attributeName="r" values={`${r};${(r as number) + 1.2};${r}`} dur={`${3 + i * 0.4}s`} repeatCount="indefinite" />
              </circle>
            ))}
          </svg>
          <span className="absolute bottom-3 left-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Graph</span>
        </div>
      </div>
    </div>
  </div>
);

const Landing: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  useSeo(
    'NoteWeb: private, local-first notes with a knowledge graph',
    'NoteWeb is a fast, private note-taking app with wiki links, backlinks, daily notes and an interactive knowledge graph. Your notes stay on your device. No signup.',
    '/'
  );

  const cta = (where: string) => () => trackFeature('landing_cta_clicked', { where });

  return (
    <div className="fixed inset-0 overflow-y-auto bg-white text-slate-900">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 nw-grid-bg [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_70%)] pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-brand-50 ring-1 ring-brand-200 text-xs font-medium text-brand-700">
            <ShieldCheck className="w-3.5 h-3.5" /> Private by design. No account, no cloud.
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.05] max-w-3xl mx-auto">
            Think in links,
            <br className="hidden sm:block" /> <span className="text-brand-600">not folders.</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            NoteWeb is a calm, fast notebook where every idea connects. Write in Markdown, link notes with a keystroke, and watch your knowledge
            graph grow, all on your own device.
          </p>
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/app"
              onClick={cta('hero')}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-on-accent font-semibold shadow-lg shadow-brand-600/20 transition"
            >
              Start writing, it's free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/pricing" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl ring-1 ring-slate-200 hover:bg-slate-50 font-semibold text-slate-700 transition">
              <Sparkles className="w-4 h-4 text-brand-600" /> See Pro
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
            {['No signup', 'Works offline', 'Export to Markdown anytime'].map(t => (
              <span key={t} className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-500" /> {t}
              </span>
            ))}
          </div>
          <div className="mt-16">
            <HeroMock />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 sm:py-28 bg-slate-50 border-y border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-brand-600 mb-3">Everything you need, nothing you don't</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">A second brain that feels light</h2>
            <p className="mt-4 text-lg text-slate-600">Built for people who think by connecting: students, researchers, writers, developers and founders.</p>
          </div>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(f => (
              <div key={f.title} className="p-6 rounded-2xl bg-white ring-1 ring-slate-200 hover:ring-brand-300 hover:shadow-lg transition">
                <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-sm font-semibold text-brand-600 mb-3">How it works</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">From scattered thoughts to a web of ideas</h2>
            <ol className="mt-8 space-y-6">
              {[
                ['Capture', 'Open NoteWeb and write. Slash commands give you headings, lists, quotes and code without leaving the keyboard.'],
                ['Connect', 'Type @ to link a note. Backlinks appear automatically, so every note knows where it is referenced.'],
                ['Discover', 'Browse the graph, follow links and search everything with ⌘P. Patterns you never planned start to show.'],
              ].map(([t, b], i) => (
                <li key={t} className="flex gap-4">
                  <span className="shrink-0 w-8 h-8 rounded-full bg-brand-600 text-on-accent text-sm font-bold flex items-center justify-center">{i + 1}</span>
                  <div>
                    <h3 className="font-semibold text-slate-900">{t}</h3>
                    <p className="mt-1 text-slate-600">{b}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-2xl bg-[#12141c] p-6 sm:p-8 text-[#e2e8f0] font-mono text-sm leading-7 shadow-xl ring-1 ring-[#262a36]">
            <div className="text-[#94a3b8]"># Weekly review</div>
            <div>
              Finished <span className="text-[#a5a5f5]">[[Reading: Deep Work]]</span>.
            </div>
            <div>
              Big idea: protect focus blocks, see <span className="text-[#a5a5f5]">[[Focus rituals]]</span>.
            </div>
            <div className="text-[#94a3b8] mt-3">## Next</div>
            <div>
              - Draft <span className="text-[#a5a5f5]">[[Talk outline]]</span> on <span className="text-amber-300">@@Friday</span>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-[#94a3b8]">
              <Zap className="w-3.5 h-3.5 text-amber-300" /> 3 new links · 2 backlinks updated
            </div>
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section className="py-20 sm:py-28 bg-gradient-to-b from-brand-50 to-white border-y border-brand-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-white ring-1 ring-brand-200 text-brand-600 flex items-center justify-center mb-5">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">Your notes never leave your device</h2>
            <p className="mt-4 text-lg text-slate-600">
              No account, no tracking of what you write, no server holding your thoughts. NoteWeb is local-first: fast, offline and yours.
            </p>
          </div>
          <div className="mt-12 grid sm:grid-cols-3 gap-4">
            {[
              [ShieldCheck, 'Local by default', 'Notes are saved in your browser on this device. Nothing is uploaded.'],
              [WifiOff, 'Works offline', 'Install NoteWeb as an app and keep writing on a plane, a train or a bad Wi-Fi day.'],
              [Lock, 'Encrypted backups', 'Export an AES-256 encrypted vault. Only your password can open it.'],
            ].map(([Icon, t, b]) => {
              const I = Icon as typeof Lock;
              return (
                <div key={t as string} className="p-6 rounded-2xl bg-white ring-1 ring-slate-200">
                  <I className="w-5 h-5 text-brand-600 mb-3" />
                  <h3 className="font-semibold text-slate-900">{t as string}</h3>
                  <p className="mt-1.5 text-sm text-slate-600">{b as string}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pro teaser */}
      <section className="py-20 sm:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="rounded-3xl bg-[#12141c] text-[#f8fafc] p-8 sm:p-12 grid md:grid-cols-5 gap-8 items-center ring-1 ring-[#262a36]">
            <div className="md:col-span-3">
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#a5a5f5]">
                <Sparkles className="w-3.5 h-3.5" /> Now available
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight">NoteWeb Pro</h2>
              <p className="mt-3 text-[#cbd5e1]">
                Accent color themes and 10× version history today, with end-to-end encrypted sync and publishing on the way. From $5/month. Free stays free.
              </p>
            </div>
            <div className="md:col-span-2 flex md:justify-end">
              <Link to="/pricing" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#fff] text-[#0f172a] font-semibold hover:bg-[#e2e8f0] transition">
                See Pro <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="pb-20 sm:pb-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 text-center">Questions</h2>
          <div className="mt-10 divide-y divide-slate-200 border-y border-slate-200">
            {FAQ.map((f, i) => (
              <div key={f.q}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between gap-4 py-5 text-left">
                  <span className="font-medium text-slate-900">{f.q}</span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && <p className="pb-5 -mt-1 text-slate-600 leading-relaxed">{f.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <Logo className="w-12 h-12 mx-auto mb-6" />
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">Start your web of notes</h2>
          <p className="mt-4 text-lg text-slate-600">It takes two seconds. No signup, ever.</p>
          <Link
            to="/app"
            onClick={cta('footer')}
            className="mt-8 inline-flex items-center gap-2 px-7 py-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-on-accent font-semibold shadow-lg shadow-brand-600/20 transition"
          >
            Open NoteWeb <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};

export default Landing;
