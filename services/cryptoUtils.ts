/** Shared WebCrypto helpers (AES-GCM 256, PBKDF2-SHA256). */
export const b64 = (bytes: Uint8Array): string => {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
};
export const unb64 = (s: string): Uint8Array => Uint8Array.from(atob(s), c => c.charCodeAt(0));

export const randomBytes = (n: number) => crypto.getRandomValues(new Uint8Array(n));

export const deriveAesKey = async (password: string, salt: Uint8Array, iterations = 310_000): Promise<CryptoKey> => {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, [
    'encrypt',
    'decrypt',
  ]);
};

export const encryptText = async (key: CryptoKey, text: string): Promise<{ iv: string; ct: string }> => {
  const iv = randomBytes(12);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(text)));
  return { iv: b64(iv), ct: b64(ct) };
};

export const decryptText = async (key: CryptoKey, iv: string, ct: string): Promise<string> => {
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(iv) }, key, unb64(ct));
  return new TextDecoder().decode(plain);
};

export const CHECK_PHRASE = 'noteweb-ok';
