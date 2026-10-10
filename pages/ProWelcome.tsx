import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, Mail, ExternalLink, Loader2, Check, ArrowRight } from 'lucide-react';
import { MarketingPage, MarkWhite } from '../components/SiteChrome';
import { useSeo } from '../hooks/useSeo';
import { activateLicense, CUSTOMER_PORTAL } from '../services/proService';
import { usePro } from '../hooks/usePro';
import { trackFeature } from '../services/analyticsService';

/** Polar checkout success URL: thank the customer and activate their license key. */
const ProWelcome: React.FC = () => {
  const navigate = useNavigate();
  const { pro } = usePro();
  const [key, setKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const fromCheckout = new URLSearchParams(window.location.search).has('checkout_id');
  useSeo('Welcome to NoteWeb Pro', 'Activate your NoteWeb Pro license.', '/pro/welcome', true);

  useEffect(() => {
    if (fromCheckout) trackFeature('checkout_completed');
  }, [fromCheckout]);

  const activate = async () => {
    setBusy(true);
    const r = await activateLicense(key);
    setBusy(false);
    setMsg({ ok: r.ok, text: r.message });
    if (r.ok) {
      trackFeature('pro_activated', { where: 'welcome' });
      setTimeout(() => navigate('/app'), 1200);
    }
  };

  return (
    <MarketingPage solidNav>
      <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-32 pb-24">
        <div className="text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-brand-600 text-on-accent flex items-center justify-center shadow-lg shadow-brand-600/25">
            <MarkWhite className="w-7 h-7" />
          </div>
          <h1 className="mt-6 text-3xl sm:text-4xl font-extrabold tracking-tight">
            {pro ? 'NoteWeb Pro is active' : fromCheckout ? 'Thank you for supporting NoteWeb!' : 'Activate NoteWeb Pro'}
          </h1>
          <p className="mt-3 text-slate-600">
            {pro
              ? 'Pro features are unlocked on this device. Open the Pro menu in the sidebar to turn on sync, publishing, private notes and automatic backups.'
              : 'One last step: paste your license key to unlock Pro in this browser. Your notes never leave your device; the key is the only thing we check.'}
          </p>
        </div>

        {pro ? (
          <div className="mt-10 text-center">
            <Link to="/app" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-on-accent font-semibold">
              Open NoteWeb <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <>
            <ol className="mt-10 space-y-4">
              <li className="flex gap-4 p-4 rounded-2xl ring-1 ring-slate-200">
                <Mail className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-slate-900">Find your key</p>
                  <p className="text-slate-600 mt-1">
                    It's in the receipt email from Polar (starts with <span className="font-mono">NOTEWEB-</span>). You can also open the{' '}
                    <a href={CUSTOMER_PORTAL} target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-1">
                      customer portal <ExternalLink className="w-3 h-3" />
                    </a>{' '}
                    and sign in with your email.
                  </p>
                </div>
              </li>
              <li className="flex gap-4 p-4 rounded-2xl ring-1 ring-brand-200 bg-brand-50/50">
                <KeyRound className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">Paste it here</p>
                  <div className="mt-2 flex flex-col sm:flex-row gap-2">
                    <input
                      autoFocus
                      value={key}
                      onChange={e => setKey(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && activate()}
                      placeholder="NOTEWEB-XXXXXXXX-…"
                      className="flex-1 min-w-0 px-3 py-2.5 text-sm font-mono rounded-xl bg-white ring-1 ring-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      aria-label="License key"
                    />
                    <button
                      onClick={activate}
                      disabled={busy || !key.trim()}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-on-accent font-semibold disabled:opacity-60"
                    >
                      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Activate
                    </button>
                  </div>
                  {msg && (
                    <p className={`mt-2 text-sm ${msg.ok ? 'text-emerald-600' : 'text-red-600'}`} role="status">
                      {msg.text}
                    </p>
                  )}
                </div>
              </li>
            </ol>
            <p className="mt-6 text-center text-xs text-slate-500">
              Using NoteWeb on another browser or device? Activate the same key there too.
            </p>
          </>
        )}
      </main>
    </MarketingPage>
  );
};

export default ProWelcome;
