import React, { useEffect, useState } from 'react';
import { Share2, Copy, Check, Lock, AlertTriangle, Globe, Loader2, ExternalLink, Gem } from 'lucide-react';
import Modal, { Button } from './ui/Modal';
import { Note } from '../types';
import { buildShareUrl, MAX_SHARE_URL } from '../services/shareService';
import { getPublishedMap, publishNote, unpublishNote, PublishedInfo } from '../services/publishService';
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

const ShareModal: React.FC<Props> = ({ open, onClose, note, notes, pro, onUpgrade }) => {
  const [url, setUrl] = useState('');
  const [copied, setCopied] = useState<'snapshot' | 'page' | null>(null);
  const [published, setPublished] = useState<PublishedInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && note) {
      setUrl(note.lock ? '' : buildShareUrl(note));
      setCopied(null);
      setError(null);
      setPublished(getPublishedMap()[note.id] || null);
    }
  }, [open, note]);

  const tooLong = url.length > MAX_SHARE_URL;
  const stale = !!(published && note && note.updatedAt > published.updated_at);

  const doPublish = async () => {
    if (!note) return;
    setBusy(true);
    setError(null);
    try {
      const info = await publishNote(note, notes);
      setPublished(info);
      trackFeature('note_published', { update: !!published });
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

  return (
    <Modal open={open} onClose={onClose} title={<span className="flex items-center gap-2"><Share2 className="w-4 h-4" /> Share “{note?.title}”</span>}>
      <div className="p-5 space-y-6">
        {/* Publish to the web (Pro) */}
        <section>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Globe className="w-4 h-4 text-brand-600" /> Publish to the web
            <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-brand-50 text-brand-700">Pro</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">A clean public page at noteweb.co/p/… that stays up to date when you republish. Links to your other published notes work.</p>
          {!pro ? (
            <Button className="mt-3" onClick={() => { trackFeature('pro_feature_gate', { feature: 'publish' }); onUpgrade(); }}>
              <Gem className="w-4 h-4" /> Unlock publishing with Pro
            </Button>
          ) : note?.lock ? (
            <p className="mt-3 text-sm text-amber-700">Private notes can't be published. Remove the lock first.</p>
          ) : published ? (
            <div className="mt-3 space-y-2">
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
            <Button variant="primary" className="mt-3" disabled={busy} onClick={doPublish}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />} Publish this note
            </Button>
          )}
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
