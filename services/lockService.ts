/**
 * Private (locked) notes, a NoteWeb Pro feature. One private-notes password
 * per device encrypts selected notes' content with AES-GCM. The key lives only
 * in memory and auto-locks after inactivity. Unlocking is always allowed, even
 * without Pro, so nobody is ever locked out of their own notes.
 */
import { Note, NoteLock } from '../types';
import { b64, unb64, randomBytes, deriveAesKey, encryptText, decryptText, CHECK_PHRASE } from './cryptoUtils';

const LOCK_KEY = 'noteweb_lock';
const AUTO_LOCK_MS = 10 * 60 * 1000;

interface LockConfig {
  salt: string;
  check_iv: string;
  check_ct: string;
}

let sessionKey: CryptoKey | null = null;
let lockTimer: ReturnType<typeof setTimeout> | undefined;

const emit = () => window.dispatchEvent(new Event('noteweb-lock-changed'));

const touch = () => {
  clearTimeout(lockTimer);
  lockTimer = setTimeout(lockSession, AUTO_LOCK_MS);
};

export const getLockConfig = (): LockConfig | null => {
  try {
    const raw = localStorage.getItem(LOCK_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const hasLockPassword = () => !!getLockConfig();
export const isSessionUnlocked = () => !!sessionKey;

export const lockSession = () => {
  sessionKey = null;
  clearTimeout(lockTimer);
  emit();
};

/** First-time setup of the private-notes password. */
export const createLockPassword = async (password: string) => {
  if (password.length < 6) throw new Error('Use at least 6 characters.');
  const salt = randomBytes(16);
  const key = await deriveAesKey(password, salt);
  const check = await encryptText(key, CHECK_PHRASE);
  localStorage.setItem(LOCK_KEY, JSON.stringify({ salt: b64(salt), check_iv: check.iv, check_ct: check.ct }));
  sessionKey = key;
  touch();
  emit();
};

export const unlockSession = async (password: string) => {
  const cfg = getLockConfig();
  if (!cfg) throw new Error('No private-notes password is set on this device.');
  const key = await deriveAesKey(password, unb64(cfg.salt));
  try {
    if ((await decryptText(key, cfg.check_iv, cfg.check_ct)) !== CHECK_PHRASE) throw new Error();
  } catch {
    throw new Error('Wrong password.');
  }
  sessionKey = key;
  touch();
  emit();
};

const requireKey = () => {
  if (!sessionKey) throw new Error('Unlock private notes first.');
  touch();
  return sessionKey;
};

export const encryptContent = async (markdown: string): Promise<NoteLock> => encryptText(requireKey(), markdown);

export const decryptNote = async (note: Note): Promise<string> => {
  if (!note.lock) return note.content;
  return decryptText(requireKey(), note.lock.iv, note.lock.ct);
};
