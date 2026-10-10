import React, { useEffect, useState } from 'react';
import { Share2, Copy, Check, Lock, AlertTriangle, Globe, Loader2, ExternalLink, Gem, KeyRound, Flame, Timer, LayoutList } from 'lucide-react';
import Modal, { Button } from './ui/Modal';
import { Note } from '../types';
import { buildShareUrl, MAX_SHARE_URL } from '../services/shareService';
import { getPublishedMap, publishNote, unpublishNote, refreshPublished, PublishedInfo, getSite, saveSite, removeSite, SiteInfo } from '../services/publishService';
import { trackFeature } from '../services/analyticsService';
import { relativeTime } from '../utils/noteUtils';

interface Props {
  open: boolean;
  onClose: () => void;
  note: Note | null;
  notes: Note[];
  pro: boolean;
  onUpgrade: () => void;
}

const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
};

/** noteweb.co/u/<handle>: one public page listing every open published note. */
const SiteSettings: React.FC<{ open: boolean }> = ({ open }) => {
  const [site, setSite] = useState<SiteInfo | null | undefined>(undefined);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<SiteInfo>({ handle: '', title: '', bio: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setEditing(false);
    setError(null);
    getSite()
      .then(s => {
        setSite(s);
        if (s) setForm({ ...s, bio: s.bio || '' });
      })
      .catch(() => setSite(null));
  }, [open]);

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const s = await saveSite(form);
      setSite(s);
      setEditing(false);
      trackFeature('site_saved');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (site === undefined) return null;
  const siteUrl = site ? `${window.location.origin}/u/${site.handle}` : '';
  const input = 'w-full px-3 py-2 text-sm rounded-lg bg-white ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500';

  return (
    <div className="mt-4 pt-4 border-t border-slate-100">
      <p className="flex items-center gap-2 text-sm font-medium text-slate-800">
        <LayoutList className="w-4 h-4 text-brand-600" /> Your public site
      </p>
      {site && !editing ? (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <a href={siteUrl} target="_blank" rel="noopener noreferrer" className="text-brand-700 underline underline-offset-2 truncate">
            {siteUrl.replace(/^https?:\/\//, '')}
          </a>
          <Button variant="ghost" onClick={() => setEditing(true)}>Edit</Button>
          <Button variant="ghost" onClick={() => removeSite().then(() => setSite(null))}>Take down</Button>
        </div>
      ) : !site && !editing ? (
        <div className="mt-2">
          <p className="text-xs text-slate-500">One page that lists all your open published notes, with search. Great for a digital garden, docs or a portfolio.</p>
          <Button className="mt-2" onClick={() => setEditing(true)}>Create my site</Button>
        </div>
      ) : (
        <div className="mt-2 space-y-2">
          <div className="flex items-center gap-1 text-sm text-slate-500">
            <span className="shrink-0">noteweb.co/u/</span>
            <input value={form.handle} onChange={e => setForm({ ...form, handle: e.target.value.toLowerCase() })} placeholder="your-name" className={input} aria-label="Site address" />
          </div>
          <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Site title, e.g. Ada's notes" className={input} aria-label="Site title" />
          <input value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="One line about you (optional)" className={input} aria-label="Site description" />
          <div className="flex gap-2">
            <Button variant="primary" disabled={busy || !form.handle || !form.title} onClick={save}>
              {busy && <Loader2 className="w-4 h-4 animate-spin" />} Save site
            </Button>
            <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </div>
      )}
      {error && <p className="mt-2 text-sm text-red-600" role="alert">{error}</p>}
    </div>
  );
};

const ShareModal: React.FC<Props> = ({ open, onClose, note, notes, pro, onUpgrade }) => {
  const [url, setUrl] = useState('');
  const [copied, setCopied] = useState<'snapshot' | 'page' | null>(null);
  const [published, setPublished] = useState<PublishedInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [burn, setBurn] = useState(false);
  const [expiry, setExpiry] = useState(0);

  useEffect(() => {
    if (open && note) {
      const info = getPublishedMap()[note.id] || null;
      setUrl(note.lock ? '' : buildShareUrl(note));
      setCopied(null);
      setError(null);
      setPublished(info);
      setUsePassword(!!info?.protected);
      setPassword('');
      setBurn(!!info?.burn);
      setExpiry(info?.expires_at ? -1 : 0);
      // View-once pages disappear when opened and others expire: check what is still live.
      if (pro && info)
        refreshPublished()
          .then(map => setPublished(map[note.id] || null))
          .catch(() => undefined);
    }
  }, [open, note, pro]);

  const tooLong = url.length > MAX_SHARE_URL;
  const stale = !!(published && note && note.updatedAt > published.updated_at);

  const doPublish = async () => {
    if (!note) return;
    if (usePassword && password.length < 4) return setError('Choose a password of at least 4 characters for readers.');
    setBusy(true);
    setError(null);
    try {
      const info = await publishNote(note, notes, { password: usePassword ? password : undefined, burn, expiresInDays: expiry });
      setPublished(info);
      setPassword('');
      trackFeature('note_published', { update: !!published, protected: usePassword, burn, expiry });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const doUnpublish = async () => {
    if (!note) return;
    setBusy(true);
    try {
      await unpublishNote(note.id);
      setPublished(null);
      trackFeature('note_unpublished');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const optionsBlock = (
    <div className="mt-3 space-y-2.5 p-3 rounded-xl bg-slate-50 text-sm">
      <label className="flex items-center gap-2 text-slate-700 select-none">
        <input type="checkbox" checked={usePassword} onChange={e => setUsePassword(e.target.checked)} className="accent-brand-600" />
        <KeyRound className="w-3.5 h-3.5 text-slate-400" /> Require a password to read
      </label>
      {usePassword && (
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder={published?.protected ? 'Enter the password again to republish' : 'Password for readers'}
          className="w-full px-3 py-2 text-sm rounded-lg bg-white ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
          aria-label="Page password"
        />
      )}
      <label className="flex items-center gap-2 text-slate-700 select-none">
        <input type="checkbox" checked={burn} onChange={e => setBurn(e.target.checked)} className="accent-brand-600" />
        <Flame className="w-3.5 h-3.5 text-slate-400" /> Delete after it's opened once
      </label>
      <label className="flex items-center gap-2 text-slate-700">
        <Timer className="w-3.5 h-3.5 text-slate-400" /> Expires
        <select value={expiry} onChange={e => setExpiry(Number(e.target.value))} className="ml-auto px-2 py-1 text-sm rounded-lg bg-white ring-1 ring-slate-200">
          {published?.expires_at && <option value={-1}>Keep ({new Date(published.expires_at).toLocaleDateString()})</option>}
          <option value={0}>Never</option>
          <option value={1}>In 1 day</option>
          <option value={7}>In 7 days</option>
          <option value={30}>In 30 days</option>
        </select>
      </label>
      {(usePassword || burn) && (
        <p className="text-xs text-slate-500">
          {usePassword ? 'The note is encrypted on this device before upload; we never see the text or the password. ' : ''}
          Protected and view-once pages get a random link and are left off your public site.
        </p>
      )}
    </div>
  );

  return (
    <Modal open={open} onClose={onClose} title={<span className="flex items-center gap-2"><Share2 className="w-4 h-4" /> Share “{note?.title}”</span>}>
      <div className="p-5 space-y-6">
        {/* Publish to the web (Pro) */}
        <section>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Globe className="w-4 h-4 text-brand-600" /> Publish to the web
            <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-brand-50 text-brand-700">Pro</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">A clean page at noteweb.co/p/… that stays up to date when you republish. Add a password, make it view-once or let it expire.</p>
          {!pro ? (
            <Button className="mt-3" onClick={() => { trackFeature('pro_feature_gate', { feature: 'publish' }); onUpgrade(); }}>
              <Gem className="w-4 h-4" /> Unlock publishing with Pro
            </Button>
          ) : note?.lock ? (
            <p className="mt-3 text-sm text-amber-700">Private notes can't be published. Remove the lock first.</p>
          ) : published ? (
            <div className="mt-3 space-y-2">
              {(published.protected || published.burn || published.expires_at) && (
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  {published.protected && <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600"><KeyRound className="w-3 h-3" /> Password</span>}
                  {published.burn && <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600"><Flame className="w-3 h-3" /> View once</span>}
                  {published.expires_at && <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600"><Timer className="w-3 h-3" /> Expires {new Date(published.expires_at).toLocaleDateString()}</span>}
                </div>
              )}
              <div className="flex gap-2">
                <input readOnly value={published.url} onFocus={e => e.target.select()} className="flex-1 min-w-0 px-3 py-2 text-sm rounded-lg bg-white ring-1 ring-slate-200 text-slate-600" aria-label="Published page link" />
                <Button onClick={() => { copyText(published.url); setCopied('page'); }}>
                  {copied === 'page' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
                <a href={published.url} target="_blank" rel="noopener noreferrer">
                  <Button>
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </a>
              </div>
              {optionsBlock}
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="primary" disabled={busy} onClick={doPublish}>
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {stale ? 'Publish latest changes' : 'Republish'}
                </Button>
                <Button variant="ghost" disabled={busy} onClick={doUnpublish}>
                  Unpublish
                </Button>
                <span className="text-xs text-slate-400">Updated {relativeTime(published.updated_at)}{stale ? ' · you have unpublished edits' : ''}</span>
              </div>
            </div>
          ) : (
            <>
              {optionsBlock}
              <Button variant="primary" className="mt-3" disabled={busy} onClick={doPublish}>
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />} Publish this note
              </Button>
            </>
          )}
          {pro && <SiteSettings open={open} />}
        </section>

        {/* Private snapshot link (free) */}
        <section className="pt-5 border-t border-slate-100">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Lock className="w-4 h-4 text-emerald-600" /> Private snapshot link
          </h3>
          <p className="text-xs text-slate-500 mt-1">The note is packed into the link itself and never uploaded. Anyone with the link can read this snapshot and save a copy.</p>
          {note?.lock ? (
            <p className="mt-3 text-sm text-amber-700">Private notes can't be shared as a link.</p>
          ) : tooLong ? (
            <p className="mt-3 flex items-start gap-2 text-sm text-amber-700">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> This note is too long for a link. Publish it or export it as Markdown instead.
            </p>
          ) : (
            <div className="mt-3 flex gap-2">
              <input readOnly value={url} onFocus={e => e.target.select()} className="flex-1 min-w-0 px-3 py-2 text-sm rounded-lg bg-white ring-1 ring-slate-200 text-slate-600" aria-label="Snapshot link" />
              <Button
                onClick={() => {
                  copyText(url);
                  setCopied('snapshot');
                  trackFeature('note_shared', { length: url.length });
                }}
              >
                {copied === 'snapshot' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied === 'snapshot' ? 'Copied' : 'Copy'}
              </Button>
            </div>
          )}
        </section>

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
};

export default ShareModal;
