import React, { useEffect, useRef, useState } from 'react';
import { Download, Upload, Lock, FileArchive, FileJson, ShieldCheck, FileText, FolderSync, Gem } from 'lucide-react';
import Modal, { Button } from './ui/Modal';
import { Note, Folder } from '../types';
import {
  exportMarkdownZip,
  exportJson,
  exportEncrypted,
  exportSingleMarkdown,
  readImportFiles,
  decryptVaultText,
  PasswordRequiredError,
  ImportResult,
} from '../services/backupService';
import { storageUsageBytes, markBackupDone, requestPersistentStorage } from '../services/storageService';
import { trackFeature } from '../services/analyticsService';
import {
  isAutoBackupSupported,
  getAutoBackupMeta,
  chooseBackupFolder,
  disableAutoBackup,
  runAutoBackup,
  backupFolderPermission,
  regrantBackupFolder,
} from '../services/autoBackupService';
import { relativeTime } from '../utils/noteUtils';

interface Props {
  open: boolean;
  onClose: () => void;
  notes: Note[];
  folders: Folder[];
  activeNote: Note | null;
  onImport: (result: ImportResult) => { added: number; updated: number };
  pro: boolean;
  onUpgrade: () => void;
}

const BackupModal: React.FC<Props> = ({ open, onClose, notes, folders, activeNote, onImport, pro, onUpgrade }) => {
  const [auto, setAuto] = useState(getAutoBackupMeta);
  const [perm, setPerm] = useState<string>('missing');
  useEffect(() => {
    if (!open) return;
    setAuto(getAutoBackupMeta());
    backupFolderPermission().then(setPerm).catch(() => setPerm('missing'));
  }, [open]);

  const enableAuto = async () => {
    try {
      await chooseBackupFolder();
      await runAutoBackup(notes, folders, true);
      setAuto(getAutoBackupMeta());
      setPerm('granted');
      trackFeature('autobackup_enabled');
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setStatus({ kind: 'error', text: (e as Error).message });
    }
  };

  const fileRef = useRef<HTMLInputElement>(null);
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [showEncrypt, setShowEncrypt] = useState(false);
  const [pendingVault, setPendingVault] = useState<string | null>(null);
  const [vaultPassword, setVaultPassword] = useState('');
  const [status, setStatus] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const usedKb = Math.round(storageUsageBytes() / 1024);
  const [persisted, setPersisted] = useState<boolean | null>(null);

  React.useEffect(() => {
    if (open) navigator.storage?.persisted?.().then(setPersisted).catch(() => setPersisted(null));
  }, [open]);

  const exported = (format: string) => {
    markBackupDone();
    trackFeature('export_completed', { format });
  };

  const finishImport = (result: ImportResult) => {
    if (!result.notes.length) {
      setStatus({ kind: 'error', text: 'No notes found in that file.' });
      return;
    }
    const { added, updated } = onImport(result);
    trackFeature('import_completed', { added, updated });
    setStatus({ kind: 'ok', text: `Imported ${added} new note${added === 1 ? '' : 's'}${updated ? `, updated ${updated}` : ''}.` });
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setStatus(null);
    setBusy(true);
    try {
      finishImport(await readImportFiles(files));
    } catch (e) {
      if (e instanceof PasswordRequiredError) {
        setPendingVault(e.fileText);
      } else {
        setStatus({ kind: 'error', text: (e as Error).message || 'Import failed.' });
      }
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const unlockVault = async () => {
    if (!pendingVault) return;
    setBusy(true);
    try {
      finishImport(await decryptVaultText(pendingVault, vaultPassword));
      setPendingVault(null);
      setVaultPassword('');
    } catch (e) {
      setStatus({ kind: 'error', text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const doEncrypted = async () => {
    if (password.length < 8 || password !== password2) return;
    setBusy(true);
    await exportEncrypted(notes, folders, password);
    exported('encrypted');
    setBusy(false);
    setPassword('');
    setPassword2('');
    setShowEncrypt(false);
    setStatus({ kind: 'ok', text: 'Encrypted backup downloaded. Keep the password safe: it cannot be recovered.' });
  };

  const Row: React.FC<{ icon: React.ReactNode; title: string; desc: string; onClick: () => void }> = ({ icon, title, desc, onClick }) => (
    <button onClick={onClick} className="w-full flex items-start gap-3 p-3 rounded-xl ring-1 ring-slate-200 hover:ring-brand-300 hover:bg-brand-50/40 text-left transition">
      <span className="mt-0.5 text-brand-600">{icon}</span>
      <span>
        <span className="block text-sm font-medium text-slate-800">{title}</span>
        <span className="block text-xs text-slate-500 mt-0.5">{desc}</span>
      </span>
    </button>
  );

  return (
    <Modal open={open} onClose={onClose} title="Backup, export & import" width="max-w-xl">
      <div className="p-5 space-y-6">
        <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 text-sm text-slate-600">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <p>
            Your {notes.length} notes ({usedKb} KB) live only in this browser. Nothing is uploaded. Export a backup regularly, especially
            before clearing browser data.
          </p>
        </div>
        {persisted === false && (
          <button
            onClick={async () => setPersisted(await requestPersistentStorage())}
            className="w-full text-left p-3 rounded-xl ring-1 ring-amber-200 bg-amber-50 text-sm text-amber-800 hover:ring-amber-300"
          >
            <span className="font-medium">Protect notes from automatic cleanup.</span> Your browser may clear site data when disk space is low.
            Click to ask it to keep NoteWeb's storage.
          </button>
        )}
        {persisted === true && <p className="text-xs text-emerald-600">✓ Your browser will keep NoteWeb's storage even when disk space is low.</p>}

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
            Automatic backups <span className="normal-case tracking-normal text-[10px] px-1.5 py-0.5 rounded bg-brand-50 text-brand-700">Pro</span>
          </h3>
          {!pro ? (
            <button onClick={() => { onClose(); onUpgrade(); }} className="w-full flex items-start gap-3 p-3 rounded-xl ring-1 ring-slate-200 hover:ring-brand-300 text-left">
              <Gem className="w-5 h-5 text-brand-600 mt-0.5" />
              <span>
                <span className="block text-sm font-medium text-slate-800">Back up to a folder every day, automatically</span>
                <span className="block text-xs text-slate-500 mt-0.5">Pick a folder (iCloud Drive, Dropbox, a USB drive). NoteWeb keeps the last 14 daily backups there.</span>
              </span>
            </button>
          ) : !isAutoBackupSupported() ? (
            <p className="text-sm text-slate-500">Automatic folder backups need Chrome, Edge, Brave or Arc on a computer. Encrypted sync keeps an off-device copy everywhere else.</p>
          ) : auto.enabled ? (
            <div className="p-3 rounded-xl ring-1 ring-slate-200 space-y-2">
              <p className="flex items-center gap-2 text-sm text-slate-800">
                <FolderSync className="w-4 h-4 text-emerald-600" /> Daily backups to <span className="font-medium">{auto.folderName}</span>
              </p>
              <p className="text-xs text-slate-500">{auto.lastBackupAt ? `Last backup ${relativeTime(auto.lastBackupAt)}` : 'No backup yet'} · keeps the latest 14</p>
              <div className="flex flex-wrap gap-2">
                {perm !== 'granted' ? (
                  <Button variant="primary" onClick={async () => { if (await regrantBackupFolder()) { setPerm('granted'); await runAutoBackup(notes, folders, true); setAuto(getAutoBackupMeta()); } }}>
                    Allow folder access
                  </Button>
                ) : (
                  <Button onClick={async () => { await runAutoBackup(notes, folders, true); setAuto(getAutoBackupMeta()); setStatus({ kind: 'ok', text: 'Backup written.' }); }}>
                    Back up now
                  </Button>
                )}
                <Button variant="ghost" onClick={async () => { await disableAutoBackup(); setAuto(getAutoBackupMeta()); }}>
                  Turn off
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="primary" onClick={enableAuto}>
              <FolderSync className="w-4 h-4" /> Choose backup folder
            </Button>
          )}
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Export</h3>
          <div className="grid gap-2">
            <Row
              icon={<FileArchive className="w-5 h-5" />}
              title="Markdown (.zip)"
              desc="One .md file per note, in folders. Opens in Obsidian, VS Code, anything."
              onClick={() => {
                exportMarkdownZip(notes, folders);
                exported('markdown_zip');
              }}
            />
            <Row
              icon={<FileJson className="w-5 h-5" />}
              title="Full backup (.json)"
              desc="Everything, including folders, tags and dates. Restores exactly."
              onClick={() => {
                exportJson(notes, folders);
                exported('json');
              }}
            />
            <Row
              icon={<Lock className="w-5 h-5" />}
              title="Encrypted backup (.nwvault)"
              desc="AES-256 encrypted with your password. Safe to store in any cloud drive."
              onClick={() => setShowEncrypt(v => !v)}
            />
            {showEncrypt && (
              <div className="p-3 rounded-xl ring-1 ring-brand-200 bg-brand-50/40 space-y-2">
                <input
                  type="password"
                  placeholder="Password (min. 8 characters)"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-white ring-1 ring-slate-200 focus:outline-none focus:ring-brand-500"
                />
                <input
                  type="password"
                  placeholder="Repeat password"
                  value={password2}
                  onChange={e => setPassword2(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && doEncrypted()}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-white ring-1 ring-slate-200 focus:outline-none focus:ring-brand-500"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    {password2 && password !== password2 ? 'Passwords do not match' : 'There is no password recovery.'}
                  </span>
                  <Button variant="primary" disabled={busy || password.length < 8 || password !== password2} onClick={doEncrypted}>
                    <Download className="w-4 h-4" /> Download
                  </Button>
                </div>
              </div>
            )}
            {activeNote && (
              <Row
                icon={<FileText className="w-5 h-5" />}
                title={`Current note as Markdown`}
                desc={`“${activeNote.title}”`}
                onClick={() => {
                  exportSingleMarkdown(activeNote);
                  trackFeature('export_completed', { format: 'single_md' });
                }}
              />
            )}
          </div>
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Import</h3>
          <div
            className="rounded-xl border-2 border-dashed border-slate-200 p-6 text-center hover:border-brand-300 transition cursor-pointer"
            onClick={() => fileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault();
              handleFiles(e.dataTransfer.files);
            }}
          >
            <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700">Drop files here or click to choose</p>
            <p className="text-xs text-slate-500 mt-1">.md, .txt, .zip (Obsidian vaults too), .json or .nwvault. Existing notes are kept.</p>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept=".md,.markdown,.txt,.zip,.json,.nwvault"
              className="hidden"
              onChange={e => handleFiles(e.target.files)}
            />
          </div>
          {pendingVault && (
            <div className="mt-3 p-3 rounded-xl ring-1 ring-brand-200 bg-brand-50/40 flex gap-2">
              <input
                type="password"
                autoFocus
                placeholder="Backup password"
                value={vaultPassword}
                onChange={e => setVaultPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && unlockVault()}
                className="flex-1 px-3 py-2 text-sm rounded-lg bg-white ring-1 ring-slate-200 focus:outline-none focus:ring-brand-500"
              />
              <Button variant="primary" disabled={busy || !vaultPassword} onClick={unlockVault}>
                Unlock
              </Button>
            </div>
          )}
        </section>

        {status && (
          <p className={`text-sm ${status.kind === 'ok' ? 'text-emerald-600' : 'text-red-600'}`} role="status">
            {status.text}
          </p>
        )}
      </div>
    </Modal>
  );
};

export default BackupModal;
