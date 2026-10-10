import React, { useEffect, useState } from 'react';
import { Cloud, CloudOff, RefreshCw, Lock, Loader2, AlertTriangle, Check } from 'lucide-react';
import Modal, { Button } from './ui/Modal';
import { setupSync, vaultExists, disableSync, eraseVault, getSyncConfig } from '../services/syncService';
import { SyncStatus } from '../hooks/useSync';
import { relativeTime } from '../utils/noteUtils';
import { trackFeature } from '../services/analyticsService';

interface Props {
  open: boolean;
  onClose: () => void;
  pro: boolean;
  status: SyncStatus;
  onSyncNow: () => void;
  onUpgrade: () => void;
  /** Moves this device's notes to the trash before the first pull (joining an existing vault). */
  onReplaceLocal: () => void;
  localNoteCount: number;
}

const SyncModal: React.FC<Props> = ({ open, onClose, pro, status, onSyncNow, onUpgrade, onReplaceLocal, localNoteCount }) => {
  const [exists, setExists] = useState<boolean | null>(null);
  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');
  const [replace, setReplace] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmErase, setConfirmErase] = useState(false);
  const config = getSyncConfig();

  useEffect(() => {
    if (!open || !pro || config.enabled) return;
    setExists(null);
    setError(null);
    vaultExists()
      .then(setExists)
      .catch(e => setError((e as Error).message));
  }, [open, pro, config.enabled]);

  const submit = async () => {
    setError(null);
    if (!exists && pass !== pass2) return setError('Passphrases do not match.');
    setBusy(true);
    try {
      const { created } = await setupSync(pass, async isNew => {
        if (!isNew && replace && localNoteCount > 0) {
          onReplaceLocal();
          await new Promise(r => setTimeout(r, 300)); // let the state update land before the first sync
        }
      });
      trackFeature('sync_enabled', { created });
      setPass('');
      setPass2('');
      setTimeout(onSyncNow, 50);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const input = 'w-full px-3 py-2 text-sm rounded-lg bg-white ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500';

  return (
    <Modal open={open} onClose={onClose} title={<span className="flex items-center gap-2"><Cloud className="w-4 h-4" /> Sync across devices</span>}>
      <div className="p-5 space-y-4">
        {!pro ? (
          <>
            <p className="text-sm text-slate-600">
              Keep your notes on every computer and phone you use. Notes are encrypted on your device with a passphrase only you know, so nobody else can read them, including us.
            </p>
            <Button variant="primary" onClick={onUpgrade}>
              Get NoteWeb Pro to sync
            </Button>
          </>
        ) : config.enabled ? (
          <>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
              {status === 'error' ? <CloudOff className="w-5 h-5 text-amber-500" /> : <Cloud className="w-5 h-5 text-emerald-600" />}
              <div className="flex-1 text-sm">
                <p className="font-medium text-slate-800">
                  {status === 'syncing' ? 'Syncing…' : status === 'error' ? 'Sync paused' : 'Sync is on'}
                </p>
                <p className="text-xs text-slate-500">
                  {config.lastError || (config.lastSyncAt ? `Last synced ${relativeTime(config.lastSyncAt)}` : 'Waiting for the first sync')}
                </p>
              </div>
              <Button onClick={onSyncNow} disabled={status === 'syncing'}>
                <RefreshCw className={`w-4 h-4 ${status === 'syncing' ? 'animate-spin' : ''}`} /> Sync now
              </Button>
            </div>
            <p className="flex items-start gap-2 text-xs text-slate-500">
              <Lock className="w-3.5 h-3.5 mt-0.5 shrink-0" /> End-to-end encrypted with your passphrase (AES-256). Conflicting edits keep the newest version; the other one is saved in version history.
            </p>
            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
              <Button variant="ghost" onClick={() => disableSync()}>
                Turn off on this device
              </Button>
              {!confirmErase ? (
                <Button variant="ghost" className="!text-red-600" onClick={() => setConfirmErase(true)}>
                  Erase cloud copy…
                </Button>
              ) : (
                <Button variant="danger" onClick={() => eraseVault().catch(e => setError((e as Error).message))}>
                  Yes, erase synced notes from the server
                </Button>
              )}
            </div>
          </>
        ) : exists === null && !error ? (
          <p className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" /> Checking your account…
          </p>
        ) : (
          <>
            <p className="text-sm text-slate-600">
              {exists
                ? 'Enter the sync passphrase you chose on your other device.'
                : 'Choose a sync passphrase. It encrypts your notes before they leave this device. You will enter it once on each device.'}
            </p>
            <input type="password" autoFocus placeholder={exists ? 'Sync passphrase' : 'New passphrase (min. 8 characters)'} value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && exists && submit()} className={input} />
            {!exists && <input type="password" placeholder="Repeat passphrase" value={pass2} onChange={e => setPass2(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} className={input} />}
            {exists && localNoteCount > 0 && (
              <label className="flex items-start gap-2 text-sm text-slate-600 select-none">
                <input type="checkbox" checked={replace} onChange={e => setReplace(e.target.checked)} className="mt-1 accent-brand-600" />
                <span>
                  Use my synced notes on this device. The {localNoteCount} note{localNoteCount === 1 ? '' : 's'} already here move to the trash (restorable for 30 days). Untick to merge them instead.
                </span>
              </label>
            )}
            {!exists && (
              <p className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg">
                <AlertTriangle className="w-4 h-4 shrink-0" /> We can't recover this passphrase. If you lose it, you can erase the cloud copy and start again; notes on your devices are kept.
              </p>
            )}
            <div className="flex justify-end">
              <Button variant="primary" disabled={busy || pass.length < 8} onClick={submit}>
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {exists ? 'Unlock and sync' : 'Turn on sync'}
              </Button>
            </div>
          </>
        )}
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
};

export default SyncModal;
