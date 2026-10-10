/**
 * NoteWeb Pro via Polar (merchant of record).
 * Purchases grant a license key (Polar "License Keys" benefit). The key is
 * validated against Polar's public customer-portal endpoint; no secret is
 * needed in the browser. The validated state is cached locally and re-checked
 * daily, so a cancelled subscription (revoked key) turns Pro off.
 */

/**
 * Flip to true once Polar approves the account (payout connected + review passed).
 * Until then Polar rejects checkouts, so Pro CTAs collect early-access emails instead.
 */
export const CHECKOUT_LIVE = true;

export const POLAR_ORG_ID = '1268ea4e-3dcf-4efc-9b30-b38878e4c8e7';
export const CHECKOUT_MONTHLY = 'https://buy.polar.sh/polar_cl_jRFAmc2wIQkzPtxsGvuauCikWw2jV7KGrerQb4HUeOl';
export const CHECKOUT_YEARLY = 'https://buy.polar.sh/polar_cl_FsNNavNvvc9aU86OmrzOq62xzd2a4FeQ3Oj883Da5m9';
export const CUSTOMER_PORTAL = 'https://polar.sh/noteweb/portal';

const PRO_KEY = 'noteweb_pro';
const VALIDATE_URL = 'https://api.polar.sh/v1/customer-portal/license-keys/validate';
const REVALIDATE_MS = 24 * 60 * 60 * 1000;
const OFFLINE_GRACE_MS = 14 * 24 * 60 * 60 * 1000;

export const PRO_HISTORY_LIMIT = 200;
export const FREE_HISTORY_LIMIT = 20;

export interface ProState {
  key: string;
  validatedAt: number;
  status: string;
  expiresAt: string | null;
}

export const getProState = (): ProState | null => {
  try {
    const raw = localStorage.getItem(PRO_KEY);
    return raw ? (JSON.parse(raw) as ProState) : null;
  } catch {
    return null;
  }
};

export const isPro = (): boolean => {
  const s = getProState();
  if (!s || s.status !== 'granted') return false;
  if (s.expiresAt && new Date(s.expiresAt).getTime() < Date.now()) return false;
  return Date.now() - s.validatedAt < OFFLINE_GRACE_MS;
};

const save = (s: ProState | null) => {
  try {
    if (s) localStorage.setItem(PRO_KEY, JSON.stringify(s));
    else localStorage.removeItem(PRO_KEY);
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event('noteweb-pro-changed'));
};

type ValidateResult = { ok: true; state: ProState } | { ok: false; reason: 'invalid' | 'inactive' | 'network' };

const validate = async (key: string): Promise<ValidateResult> => {
  let res: Response;
  try {
    res = await fetch(VALIDATE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: key.trim(), organization_id: POLAR_ORG_ID }),
    });
  } catch {
    return { ok: false, reason: 'network' };
  }
  if (res.status === 404 || res.status === 422) return { ok: false, reason: 'invalid' };
  if (!res.ok) return { ok: false, reason: 'network' };
  const data = await res.json().catch(() => ({}));
  const state: ProState = {
    key: key.trim(),
    validatedAt: Date.now(),
    status: String(data.status || ''),
    expiresAt: data.expires_at || null,
  };
  if (state.status !== 'granted') return { ok: false, reason: 'inactive' };
  return { ok: true, state };
};

export const activateLicense = async (key: string): Promise<{ ok: boolean; message: string }> => {
  if (!key.trim()) return { ok: false, message: 'Paste your license key first.' };
  const r = await validate(key);
  if ('state' in r) {
    save(r.state);
    return { ok: true, message: 'NoteWeb Pro is active on this device. Thank you!' };
  }
  if (r.reason === 'invalid') return { ok: false, message: "That key wasn't found. Check for typos, or copy it again from your Polar receipt." };
  if (r.reason === 'inactive') return { ok: false, message: 'This key is no longer active (the subscription may have ended).' };
  return { ok: false, message: "Couldn't reach the license server. Check your connection and try again." };
};

/** Re-checks the stored key at most once a day. Network failures keep Pro during a grace period. */
export const revalidateIfStale = async (): Promise<void> => {
  const s = getProState();
  if (!s || Date.now() - s.validatedAt < REVALIDATE_MS) return;
  const r = await validate(s.key);
  if ('state' in r) save(r.state);
  else if (r.reason !== 'network') save({ ...s, status: 'revoked', validatedAt: Date.now() });
};

export const deactivateLicense = () => save(null);
