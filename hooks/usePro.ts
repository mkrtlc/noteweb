import { useEffect, useState } from 'react';
import { isPro, getProState, revalidateIfStale, ProState } from '../services/proService';

export const ACCENTS = [
  { id: 'iris', label: 'Iris', swatch: '#5b5bd6' },
  { id: 'emerald', label: 'Emerald', swatch: '#059669' },
  { id: 'rose', label: 'Rose', swatch: '#e11d48' },
  { id: 'amber', label: 'Amber', swatch: '#d97706' },
  { id: 'ocean', label: 'Ocean', swatch: '#0284c7' },
  { id: 'graphite', label: 'Graphite', swatch: '#334155' },
] as const;

export type AccentId = (typeof ACCENTS)[number]['id'];

const ACCENT_KEY = 'noteweb_accent';

export const applyAccent = (accent: AccentId) => {
  if (accent === 'iris') document.documentElement.removeAttribute('data-accent');
  else document.documentElement.setAttribute('data-accent', accent);
  try {
    localStorage.setItem(ACCENT_KEY, accent);
  } catch {
    // ignore
  }
};

export const readAccent = (): AccentId => {
  try {
    return (localStorage.getItem(ACCENT_KEY) as AccentId) || 'iris';
  } catch {
    return 'iris';
  }
};

/** Live Pro status; re-validates the license at most daily. */
export const usePro = () => {
  const [pro, setPro] = useState(isPro);
  const [state, setState] = useState<ProState | null>(getProState);

  useEffect(() => {
    const refresh = () => {
      setPro(isPro());
      setState(getProState());
    };
    window.addEventListener('noteweb-pro-changed', refresh);
    revalidateIfStale().then(refresh);
    return () => window.removeEventListener('noteweb-pro-changed', refresh);
  }, []);

  // Accent themes are a Pro perk: fall back to the default when Pro is off.
  useEffect(() => {
    if (!pro && readAccent() !== 'iris') applyAccent('iris');
  }, [pro]);

  return { pro, state };
};
