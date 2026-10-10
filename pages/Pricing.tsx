import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronRight, Loader2, Clock } from 'lucide-react';
import { CHECKOUT_MONTHLY, CHECKOUT_YEARLY, CHECKOUT_LIVE } from '../services/proService';
import { MarketingPage, Atmosphere } from '../components/SiteChrome';
import { useSeo } from '../hooks/useSeo';
import { trackFeature, getAnonId } from '../services/analyticsService';

const FREE = [
  'Unlimited notes and folders',
  'Wiki links, backlinks and unlinked mentions',
  '2D & 3D knowledge graph',
  'Command palette and full-text search',
  'Daily notes and templates',
  'Version history and 30-day trash',
  'Markdown, JSON and encrypted exports',
  'Dark mode, focus mode, offline app',
];

const PRO_NOW = [
  'Everything in Free',
  'End-to-end encrypted sync across all your devices',
  'Publish notes as web pages, with passwords, view-once links and expiry dates',
  'Your own public site at noteweb.co/u/you, with search',
  'Private notes locked with a password',
  'Automatic daily backups to a folder you choose',
  'Export notes as Word documents and web pages',
  'Save your own note templates',
  '200 saved versions per note (Free: 20)',
  'Paper, Nord and High contrast themes, plus 6 accent colors',
];

const PRO_SOON = ['Images and file attachments'];

type Status = 'idle' | 'sending' | 'done' | 'error';

const Pricing: React.FC = () => {
  const [email, setEmail] = useState('');
  const [plan, setPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [hp, setHp] = useState(''); // honeypot

  useSeo('NoteWeb pricing: free forever, Pro from $5/month', 'NoteWeb is free for unlimited local notes. NoteWeb Pro adds end-to-end encrypted sync, publishing to the web, private notes, automatic backups and custom templates.', '/pricing');

  useEffect(() => {
    trackFeature('pricing_viewed');
    if (window.location.hash === '#early-access') {
      setTimeout(() => document.getElementById('early-access')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
    }
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setStatus('error');
      setMessage('Please enter a valid email address.');
      return;
    }
    setStatus('sending');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), plan, website: hp, anonId: getAnonId(), source: CHECKOUT_LIVE ? 'sync_waitlist' : 'pro_prelaunch' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
      setStatus('done');
      setMessage(data.already ? "You're already on the list. We'll be in touch." : CHECKOUT_LIVE ? "You're on the list! We'll email you when sync launches." : "Spot reserved! We'll email you the moment Pro checkout opens.");
      trackFeature('pro_waitlist_joined', { plan });
    } catch (err) {
      setStatus('error');
      setMessage((err as Error).message);
    }
  };

  const price = plan === 'yearly' ? { amount: '$5', note: 'per month, billed $60 yearly' } : { amount: '$7', note: 'per month' };
  const d = (ms: number) => ({ ['--mk-delay' as string]: `${ms}ms` }) as React.CSSProperties;

  const FAQ: [string, string][] = [
    ['Is Free really free?', 'Yes. Unlimited notes, every core feature, no ads and no trial that runs out.'],
    ['Will Pro read my notes?', 'No. Sync is end-to-end encrypted: notes are encrypted in your browser with a passphrase only you know, so our server stores data it cannot read.'],
    ['Do I need an account?', 'No. Your license key is your account. Activate it on each device, pick a sync passphrase once, and your notes follow you.'],
    ['What happens if I cancel?', 'Every note stays on your devices and keeps working in Free. Pro features such as sync, publishing and automatic backups stop until you resubscribe.'],
    ['Can I cancel anytime?', 'Yes, from the customer portal in one click.'],
    ['How do I activate Pro?', 'After checkout you get a license key by email. Paste it into the Pro button in the app sidebar.'],
  ];

  return (
    <MarketingPage>
      <section className="mk-atmo pt-40 pb-44">
        <Atmosphere variant="cta" />
        <div className="mk-container text-center">
          <p className="mk-eyebrow !text-white/70 mk-fade-late">Pricing</p>
          <h1 className="mk-h1 mt-4 max-w-[700px] mx-auto mk-fade-late" style={{ animationDelay: '120ms' }}>
            Free for thinking. Pro for going further.
          </h1>
          <p className="mt-5 max-w-[540px] mx-auto text-[15px] text-white/80 mk-fade-late" style={{ animationDelay: '240ms' }}>
            Everything you need for a private second brain is free, forever. Pro takes it to every device, onto the web and behind a lock.
          </p>
          <div className="mt-10 inline-flex border border-white/25 p-1 text-[13px] mk-fade-late" style={{ animationDelay: '360ms' }}>
            {(['monthly', 'yearly'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPlan(p)}
                className={`px-5 py-2 capitalize transition ${plan === p ? 'bg-white text-[#0b0a14]' : 'text-white/80 hover:text-white'}`}
              >
                {p}
                {p === 'yearly' && <span className={`ml-2 text-[11px] ${plan === p ? 'text-[#05536c]' : 'text-[#9fd3e2]'}`}>save 28%</span>}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="relative -mt-28 pb-20">
        <div className="mk-container">
          <div className="grid md:grid-cols-2 border-t border-l border-[#e7e8ec] bg-white shadow-[0_30px_80px_-40px_rgba(9,7,24,0.45)] mk-reveal" style={d(0)}>
            <div className="border-r border-b border-[#e7e8ec] p-8 sm:p-10 flex flex-col">
              <p className="mk-eyebrow">Free</p>
              <h2 className="mk-serif text-[30px] mt-2">For your private second brain</h2>
              <p className="mt-6 flex items-baseline gap-2">
                <span className="mk-serif text-[56px] leading-none">$0</span>
                <span className="text-[13px] text-[#8a8e9b]">forever</span>
              </p>
              <ul className="mt-8 space-y-3 text-[14px] flex-1">
                {FREE.map(f => (
                  <li key={f} className="flex gap-3">
                    <Check className="w-4 h-4 mt-0.5 text-[#05536c] shrink-0" />
                    <span className="text-[#3a3d48]">{f}</span>
                  </li>
                ))}
              </ul>
              <Link to="/app" className="mk-btn mk-btn-outline mk-btn-lg mt-10 justify-center">
                Start writing <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="relative border-r border-b border-[#e7e8ec] p-8 sm:p-10 flex flex-col bg-[linear-gradient(180deg,#f2f8fa_0%,#ffffff_60%)]">
              <span className="absolute top-0 left-0 right-0 h-[2px] bg-[#ec7a4b]" />
              <p className="mk-eyebrow">Pro</p>
              <h2 className="mk-serif text-[30px] mt-2">Everywhere, published, protected</h2>
              <p className="mt-6 flex items-baseline gap-2">
                <span key={plan} className="mk-serif text-[56px] leading-none mk-panel-enter">{price.amount}</span>
                <span className="text-[13px] text-[#8a8e9b]">{price.note}</span>
              </p>
              <p className="mt-2 text-[12px] text-[#8a8e9b]">Cancel anytime. Taxes handled by Polar, our merchant of record.</p>
              <ul className="mt-8 space-y-3 text-[14px]">
                {PRO_NOW.map(f => (
                  <li key={f} className="flex gap-3">
                    <Check className="w-4 h-4 mt-0.5 text-[#05536c] shrink-0" />
                    <span className="text-[#3a3d48]">{f}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-[11px] tracking-[0.08em] uppercase text-[#8a8e9b]">Coming to Pro</p>
              <ul className="mt-3 space-y-2.5 text-[14px] flex-1">
                {PRO_SOON.map(f => (
                  <li key={f} className="flex gap-3">
                    <Clock className="w-4 h-4 mt-0.5 text-[#b4b8c3] shrink-0" />
                    <span className="text-[#8a8e9b]">{f}</span>
                  </li>
                ))}
              </ul>
              {CHECKOUT_LIVE ? (
                <a
                  href={plan === 'yearly' ? CHECKOUT_YEARLY : CHECKOUT_MONTHLY}
                  onClick={() => trackFeature('checkout_started', { plan, where: 'pricing' })}
                  className="mk-btn mk-btn-teal mk-btn-lg mt-10 justify-center"
                >
                  Get Pro {plan === 'yearly' ? 'yearly' : 'monthly'} <ChevronRight className="w-4 h-4" />
                </a>
              ) : (
                <a href="#early-access" onClick={() => trackFeature('checkout_started', { plan, where: 'pricing_prelaunch' })} className="mk-btn mk-btn-teal mk-btn-lg mt-10 justify-center">
                  Reserve Pro: opening in a few days <ChevronRight className="w-4 h-4" />
                </a>
              )}
              <Link to="/pro/welcome" className="mt-3 text-center text-[12px] text-[#5d6170] hover:text-[#0b0a14] underline underline-offset-4">
                Already bought? Activate your license
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-24">
        <div className="mk-container">
          <div className="text-center">
            <p className="mk-eyebrow mk-reveal">Questions</p>
            <h2 className="mk-h2 mt-4 mk-reveal" style={d(80)}>Good to know</h2>
          </div>
          <div className="mk-bento mt-12 !grid-cols-1 sm:!grid-cols-2">
            {FAQ.map(([q, a], i) => (
              <div key={q} className="mk-cell !p-8 mk-reveal" style={d((i % 2) * 90)}>
                <h3 className="mk-h3">{q}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-[#5d6170]">{a}</p>
              </div>
            ))}
          </div>

          <div id="early-access" className="mt-20 max-w-[560px] mx-auto text-center scroll-mt-24 mk-reveal">
            <p className="mk-serif text-[24px]">
              {CHECKOUT_LIVE ? 'Want to know when encrypted sync ships?' : 'Pro checkout opens in a few days'}
            </p>
            <p className="mt-2 text-[14px] text-[#5d6170]">One email, no spam. Unsubscribe anytime.</p>
            {status === 'done' ? (
              <p className="mt-5 p-4 border border-[#b0d8e5] bg-[#eef7fa] text-[#05536c] text-[14px]" role="status">
                {message}
              </p>
            ) : (
              <form onSubmit={submit} className="mt-5 flex flex-col sm:flex-row gap-2">
                <label htmlFor="waitlist-email" className="sr-only">
                  Email
                </label>
                <input
                  id="waitlist-email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="flex-1 min-w-0 px-4 py-3 bg-white border border-[#d9dce3] text-[14px] focus:outline-none focus:border-[#05536c]"
                />
                <input type="text" tabIndex={-1} autoComplete="off" value={hp} onChange={e => setHp(e.target.value)} className="hidden" aria-hidden="true" />
                <button type="submit" disabled={status === 'sending'} className="mk-btn mk-btn-teal mk-btn-lg justify-center disabled:opacity-60">
                  {status === 'sending' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {CHECKOUT_LIVE ? 'Notify me' : 'Reserve my spot'}
                </button>
              </form>
            )}
            {status === 'error' && (
              <p className="mt-2 text-[13px] text-[#c2410c]" role="alert">
                {message}
              </p>
            )}
          </div>
        </div>
      </section>
    </MarketingPage>
  );
};

export default Pricing;
