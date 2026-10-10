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
const SURFACE_KEY = 'noteweb_surface';

/** Pro surface themes: background and text tones, each with a light and a dark variant. */
export const SURFACES = [
  { id: 'default', label: 'Default', swatch: ['#ffffff', '#0f1117'] },
  { id: 'paper', label: 'Paper', swatch: ['#fbf8f1', '#1c1915'] },
  { id: 'nord', label: 'Nord', swatch: ['#eceff4', '#2e3440'] },
  { id: 'contrast', label: 'High contrast', swatch: ['#ffffff', '#000000'] },
] as const;

export type SurfaceId = (typeof SURFACES)[number]['id'];

export const applySurface = (surface: SurfaceId) => {
  if (surface === 'default') document.documentElement.removeAttribute('data-surface');
  else document.documentElement.setAttribute('data-surface', surface);
  try {
    localStorage.setItem(SURFACE_KEY, surface);
  } catch {
    // ignore
  }
};

export const readSurface = (): SurfaceId => {
  try {
    return (localStorage.getItem(SURFACE_KEY) as SurfaceId) || 'default';
  } catch {
    return 'default';
  }
};

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

  // Accent and surface themes are Pro perks: fall back to the default when Pro is off.
  useEffect(() => {
    if (!pro && readAccent() !== 'iris') applyAccent('iris');
    if (!pro && readSurface() !== 'default') applySurface('default');
  }, [pro]);

  return { pro, state };
};
