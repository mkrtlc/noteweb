import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Sparkles, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import SiteHeader, { SiteFooter } from '../components/SiteChrome';
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

const PRO = [
  'Everything in Free',
  'End-to-end encrypted sync across devices',
  'Publish notes as public web pages',
  'Unlimited version history',
  'Images and file attachments',
  'Extra themes and custom fonts',
  'Priority support',
];

type Status = 'idle' | 'sending' | 'done' | 'error';

const Pricing: React.FC = () => {
  const [email, setEmail] = useState('');
  const [plan, setPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [hp, setHp] = useState(''); // honeypot

  useSeo('NoteWeb pricing: free forever, Pro coming soon', 'NoteWeb is free for unlimited local notes. NoteWeb Pro adds encrypted sync, publishing and more. Join the waitlist.', '/pricing');

  useEffect(() => {
    trackFeature('pricing_viewed');
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
        body: JSON.stringify({ email: email.trim(), plan, website: hp, anonId: getAnonId(), source: 'pricing' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
      setStatus('done');
      setMessage(data.already ? "You're already on the list. We'll be in touch." : "You're on the list! We'll email you when Pro opens.");
      trackFeature('pro_waitlist_joined', { plan });
    } catch (err) {
      setStatus('error');
      setMessage((err as Error).message);
    }
  };

  const price = plan === 'yearly' ? { amount: '$5', note: 'per month, billed yearly' } : { amount: '$7', note: 'per month' };

  return (
    <div className="fixed inset-0 overflow-y-auto bg-white text-slate-900">
      <SiteHeader />
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20 pb-20">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">Simple pricing</h1>
          <p className="mt-4 text-lg text-slate-600">Everything you need to think clearly is free, forever. Pro is for people who want their notes everywhere.</p>
          <div className="mt-8 inline-flex p-1 rounded-xl bg-slate-100 text-sm font-medium">
            {(['monthly', 'yearly'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPlan(p)}
                className={`px-4 py-1.5 rounded-lg capitalize transition ${plan === p ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
              >
                {p}
                {p === 'yearly' && <span className="ml-1.5 text-xs text-emerald-600">save 28%</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-12 grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="rounded-3xl ring-1 ring-slate-200 p-8 flex flex-col">
            <h2 className="text-lg font-semibold">Free</h2>
            <p className="mt-1 text-sm text-slate-500">For your private second brain</p>
            <p className="mt-6">
              <span className="text-5xl font-extrabold tracking-tight">$0</span>
              <span className="ml-2 text-sm text-slate-500">forever</span>
            </p>
            <ul className="mt-8 space-y-3 text-sm flex-1">
              {FREE.map(f => (
                <li key={f} className="flex gap-3">
                  <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span className="text-slate-700">{f}</span>
                </li>
              ))}
            </ul>
            <Link to="/app" className="mt-8 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl ring-1 ring-slate-300 font-semibold hover:bg-slate-50">
              Start writing <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="relative rounded-3xl p-8 flex flex-col bg-gradient-to-b from-brand-50 to-white ring-2 ring-brand-500 shadow-xl shadow-brand-600/10">
            <span className="absolute -top-3 left-8 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-600 text-on-accent text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" /> Coming soon
            </span>
            <h2 className="text-lg font-semibold">Pro</h2>
            <p className="mt-1 text-sm text-slate-500">Your notes on every device</p>
            <p className="mt-6">
              <span className="text-5xl font-extrabold tracking-tight">{price.amount}</span>
              <span className="ml-2 text-sm text-slate-500">{price.note}</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">Planned price. Waitlist members get first access.</p>
            <ul className="mt-6 space-y-3 text-sm flex-1">
              {PRO.map(f => (
                <li key={f} className="flex gap-3">
                  <Check className="w-5 h-5 text-brand-600 shrink-0" />
                  <span className="text-slate-700">{f}</span>
                </li>
              ))}
            </ul>
            {status === 'done' ? (
              <p className="mt-8 p-4 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-medium" role="status">
                {message}
              </p>
            ) : (
              <form onSubmit={submit} className="mt-8 space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
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
                    className="flex-1 min-w-0 px-4 py-3 rounded-xl bg-white ring-1 ring-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <input type="text" tabIndex={-1} autoComplete="off" value={hp} onChange={e => setHp(e.target.value)} className="hidden" aria-hidden="true" />
                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-on-accent font-semibold disabled:opacity-60"
                  >
                    {status === 'sending' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Join waitlist
                  </button>
                </div>
                {status === 'error' && (
                  <p className="text-sm text-red-600" role="alert">
                    {message}
                  </p>
                )}
                <p className="text-xs text-slate-400">One email when Pro launches. No spam, unsubscribe anytime.</p>
              </form>
            )}
          </div>
        </div>

        <div className="mt-16 max-w-3xl mx-auto grid sm:grid-cols-3 gap-4 text-sm">
          {[
            ['Is Free really free?', 'Yes. Unlimited notes, no ads, no trial that runs out.'],
            ['Will Pro read my notes?', 'No. Sync will be end-to-end encrypted: only your devices hold the key.'],
            ['Can I leave anytime?', 'Always. Export everything to Markdown with one click, Free or Pro.'],
          ].map(([q, a]) => (
            <div key={q} className="p-5 rounded-2xl bg-slate-50">
              <p className="font-semibold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-600" />
                {q}
              </p>
              <p className="mt-2 text-slate-600">{a}</p>
            </div>
          ))}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
};

export default Pricing;
