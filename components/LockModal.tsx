import React, { useEffect, useState } from 'react';
import { Lock, Loader2, AlertTriangle } from 'lucide-react';
import Modal, { Button } from './ui/Modal';
import { hasLockPassword, createLockPassword, unlockSession } from '../services/lockService';

/** Sets up (first time) or enters the private-notes password, then runs onUnlocked. */
const LockModal: React.FC<{ open: boolean; onClose: () => void; onUnlocked: () => void }> = ({ open, onClose, onUnlocked }) => {
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const creating = !hasLockPassword();

  useEffect(() => {
    if (open) {
      setPw('');
      setPw2('');
      setError(null);
    }
  }, [open]);

  const submit = async () => {
    setError(null);
    if (creating && pw !== pw2) return setError('Passwords do not match.');
    setBusy(true);
    try {
      if (creating) await createLockPassword(pw);
      else await unlockSession(pw);
      onClose();
      onUnlocked();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const input = 'w-full px-3 py-2 text-sm rounded-lg bg-white ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500';
  return (
    <Modal open={open} onClose={onClose} title={<span className="flex items-center gap-2"><Lock className="w-4 h-4" /> {creating ? 'Set a private-notes password' : 'Unlock private notes'}</span>} width="max-w-sm">
      <div className="p-5 space-y-3">
        <p className="text-sm text-slate-600">
          {creating
            ? 'Private notes are encrypted with this password. They are hidden from search, the graph and previews, and lock again after 10 minutes of inactivity.'
            : 'Enter your private-notes password.'}
        </p>
        <input type="password" autoFocus placeholder="Password" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && !creating && submit()} className={input} />
        {creating && <input type="password" placeholder="Repeat password" value={pw2} onChange={e => setPw2(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} className={input} />}
        {creating && (
          <p className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg">
            <AlertTriangle className="w-4 h-4 shrink-0" /> This password can't be recovered. Without it, private notes can't be opened.
          </p>
        )}
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        <div className="flex justify-end">
          <Button variant="primary" disabled={busy || pw.length < 6} onClick={submit}>
            {busy && <Loader2 className="w-4 h-4 animate-spin" />} {creating ? 'Set password' : 'Unlock'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default LockModal;
