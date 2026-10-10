import React, { useEffect, useState } from 'react';
import { Share2, Copy, Check, Lock, AlertTriangle } from 'lucide-react';
import Modal, { Button } from './ui/Modal';
import { Note } from '../types';
import { buildShareUrl, MAX_SHARE_URL } from '../services/shareService';
import { trackFeature } from '../services/analyticsService';

const ShareModal: React.FC<{ open: boolean; onClose: () => void; note: Note | null }> = ({ open, onClose, note }) => {
  const [url, setUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open && note) {
      setUrl(buildShareUrl(note));
      setCopied(false);
    }
  }, [open, note]);

  const tooLong = url.length > MAX_SHARE_URL;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopied(true);
    trackFeature('note_shared', { length: url.length });
  };

  return (
    <Modal open={open} onClose={onClose} title={<span className="flex items-center gap-2"><Share2 className="w-4 h-4" /> Share “{note?.title}”</span>}>
      <div className="p-5 space-y-4">
        <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 text-sm text-slate-600">
          <Lock className="w-5 h-5 text-emerald-600 shrink-0" />
          <p>
            The note is packed into the link itself and never uploaded. Anyone with the link can read a snapshot of it as it is right now, and
            save their own copy.
          </p>
        </div>
        {tooLong ? (
          <p className="flex items-start gap-2 text-sm text-amber-700">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> This note is too long to fit in a link. Export it as Markdown instead.
          </p>
        ) : (
          <div className="flex gap-2">
            <input readOnly value={url} onFocus={e => e.target.select()} className="flex-1 min-w-0 px-3 py-2 text-sm rounded-lg bg-white ring-1 ring-slate-200 text-slate-600" aria-label="Share link" />
            <Button variant="primary" onClick={copy}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy link'}
            </Button>
          </div>
        )}
        <p className="text-xs text-slate-400">Live, editable public pages are coming with NoteWeb Pro.</p>
      </div>
    </Modal>
  );
};

export default ShareModal;
