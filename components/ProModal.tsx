import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Gem, Check, KeyRound, ExternalLink, Lock, Loader2 } from 'lucide-react';
import Modal, { Button } from './ui/Modal';
import { activateLicense, deactivateLicense, CUSTOMER_PORTAL, CHECKOUT_YEARLY, CHECKOUT_MONTHLY, CHECKOUT_LIVE } from '../services/proService';
import { ACCENTS, applyAccent, readAccent, usePro, AccentId } from '../hooks/usePro';
import { trackFeature } from '../services/analyticsService';

const PERKS_NOW = ['6 accent color themes', '200 saved versions per note (Free keeps 20)', 'Supporter badge, and you fund development'];
const PERKS_SOON = ['End-to-end encrypted sync across devices', 'Publish notes as web pages', 'Images and attachments'];

const ProModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { pro, state } = usePro();
  const [key, setKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [accent, setAccent] = useState<AccentId>(readAccent);

  const activate = async () => {
    setBusy(true);
    const r = await activateLicense(key);
    setBusy(false);
    setMsg({ ok: r.ok, text: r.message });
    if (r.ok) {
      setKey('');
      trackFeature('pro_activated');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={<span className="flex items-center gap-2"><Gem className="w-4 h-4 text-brand-600" /> NoteWeb Pro</span>}>
      <div className="p-5 space-y-5">
        {pro ? (
          <>
            <div className="p-4 rounded-2xl bg-brand-50 ring-1 ring-brand-200">
              <p className="font-semibold text-slate-900 flex items-center gap-2">
                <Check className="w-4 h-4 text-brand-600" /> Pro is active on this device
              </p>
              <p className="text-xs text-slate-500 mt-1 font-mono">{state?.key.replace(/^(.{12}).*(.{4})$/, '$1…$2')}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Accent color</p>
              <div className="flex flex-wrap gap-2">
                {ACCENTS.map(a => (
                  <button
                    key={a.id}
                    onClick={() => {
                      applyAccent(a.id);
                      setAccent(a.id);
                      trackFeature('theme_changed', { accent: a.id });
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ring-1 ${accent === a.id ? 'ring-2 ring-slate-900' : 'ring-slate-200 hover:ring-slate-300'}`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full" style={{ background: a.swatch }} />
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href={CUSTOMER_PORTAL} target="_blank" rel="noopener noreferrer">
                <Button>
                  <ExternalLink className="w-4 h-4" /> Manage subscription
                </Button>
              </a>
              <Button variant="ghost" onClick={deactivateLicense}>
                Remove from this device
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Included now</p>
                <ul className="space-y-1.5">
                  {PERKS_NOW.map(p => (
                    <li key={p} className="flex gap-2 text-slate-700">
                      <Check className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Coming to Pro</p>
                <ul className="space-y-1.5">
                  {PERKS_SOON.map(p => (
                    <li key={p} className="flex gap-2 text-slate-500">
                      <Lock className="w-4 h-4 shrink-0 mt-0.5" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {CHECKOUT_LIVE ? (
              <div className="grid grid-cols-2 gap-2">
                <a href={CHECKOUT_YEARLY} onClick={() => trackFeature('checkout_started', { plan: 'yearly', where: 'app' })}>
                  <Button variant="primary" className="w-full">
                    $60 / year
                  </Button>
                </a>
                <a href={CHECKOUT_MONTHLY} onClick={() => trackFeature('checkout_started', { plan: 'monthly', where: 'app' })}>
                  <Button className="w-full">$7 / month</Button>
                </a>
              </div>
            ) : (
              <Link to="/pricing#early-access" onClick={onClose}>
                <Button variant="primary" className="w-full">
                  Reserve Pro ($7/mo or $60/yr): opening in a few days
                </Button>
              </Link>
            )}
            <div className="pt-4 border-t border-slate-100">
              <p className="text-sm font-medium text-slate-800 flex items-center gap-2 mb-2">
                <KeyRound className="w-4 h-4" /> Already have a license key?
              </p>
              <div className="flex gap-2">
                <input
                  value={key}
                  onChange={e => setKey(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && activate()}
                  placeholder="NOTEWEB-…"
                  className="flex-1 min-w-0 px-3 py-2 text-sm font-mono rounded-lg bg-white ring-1 ring-slate-200 focus:outline-none focus:ring-brand-500"
                  aria-label="License key"
                />
                <Button variant="primary" onClick={activate} disabled={busy || !key.trim()}>
                  {busy && <Loader2 className="w-4 h-4 animate-spin" />} Activate
                </Button>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Your key is in the Polar receipt email and the <a className="underline" href={CUSTOMER_PORTAL} target="_blank" rel="noopener noreferrer">customer portal</a>. Compare plans on the <Link to="/pricing" className="underline" onClick={onClose}>pricing page</Link>.
              </p>
            </div>
          </>
        )}
        {msg && (
          <p className={`text-sm ${msg.ok ? 'text-emerald-600' : 'text-red-600'}`} role="status">
            {msg.text}
          </p>
        )}
      </div>
    </Modal>
  );
};

export default ProModal;
