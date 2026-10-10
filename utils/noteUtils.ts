import { Note } from '../types';

/** Strips Markdown/wiki syntax for previews, search snippets and word counts. */
export const plainText = (markdown: string): string =>
  markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#>*_`~-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const wordCount = (markdown: string): number => {
  const text = plainText(markdown);
  return text ? text.split(' ').length : 0;
};

export const readingMinutes = (words: number): number => Math.max(1, Math.round(words / 230));

export interface OutlineItem {
  level: 1 | 2 | 3;
  text: string;
  index: number; // nth heading in the note
}

export const extractOutline = (markdown: string): OutlineItem[] => {
  const items: OutlineItem[] = [];
  let index = 0;
  markdown.split('\n').forEach(line => {
    const m = /^(#{1,3}) (.+)/.exec(line);
    if (m) {
      items.push({ level: m[1].length as 1 | 2 | 3, text: plainText(m[2]), index: index++ });
    }
  });
  return items;
};

export interface SearchHit {
  note: Note;
  score: number;
  snippet: string;
  titleMatch: boolean;
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Ranked full-text search across titles, tags and content. */
export const searchNotes = (notes: Note[], query: string, limit = 50): SearchHit[] => {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/).filter(Boolean);
  const hits: SearchHit[] = [];
  for (const note of notes) {
    const title = note.title.toLowerCase();
    const body = plainText(note.content);
    const bodyLower = body.toLowerCase();
    const tags = note.tags.join(' ').toLowerCase();
    let score = 0;
    let allMatch = true;
    for (const term of terms) {
      const inTitle = title.includes(term);
      const inTags = tags.includes(term);
      const inBody = bodyLower.includes(term);
      if (!inTitle && !inTags && !inBody) {
        allMatch = false;
        break;
      }
      if (title === q) score += 100;
      if (title.startsWith(term)) score += 30;
      if (inTitle) score += 20;
      if (inTags) score += 10;
      if (inBody) score += 3 + Math.min(5, bodyLower.split(term).length - 1);
    }
    if (!allMatch) continue;
    const first = terms[0];
    const pos = bodyLower.indexOf(first);
    let snippet = '';
    if (pos >= 0) {
      const start = Math.max(0, pos - 40);
      snippet = (start > 0 ? '…' : '') + body.slice(start, pos + 80) + (pos + 80 < body.length ? '…' : '');
    } else {
      snippet = body.slice(0, 100);
    }
    // Recently edited notes win ties.
    score += Math.min(5, (note.updatedAt - Date.now() + 30 * 864e5) / (6 * 864e5));
    hits.push({ note, score, snippet, titleMatch: title.includes(first) });
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
};

/** Splits text into segments so matches can be wrapped in <mark>. */
export const highlightSegments = (text: string, query: string): { text: string; hit: boolean }[] => {
  const terms = query.trim().split(/\s+/).filter(Boolean).map(escapeRegExp);
  if (!terms.length) return [{ text, hit: false }];
  const splitter = new RegExp(`(${terms.join('|')})`, 'gi');
  const exact = new RegExp(`^(${terms.join('|')})$`, 'i');
  return text.split(splitter).filter(Boolean).map(part => ({ text: part, hit: exact.test(part) }));
};

/** Notes that mention `title` in plain text without linking to it. */
export const findUnlinkedMentions = (notes: Note[], target: Note): Note[] => {
  if (target.title.trim().length < 3) return [];
  const re = new RegExp(`(^|[^\\[\\w])${escapeRegExp(target.title)}(?![\\w\\]])`, 'i');
  return notes.filter(n => {
    if (n.id === target.id) return false;
    if (n.content.includes(`[[${target.title}]]`)) return false;
    return re.test(n.content);
  });
};

/** Turns the first plain mention of `title` in `content` into a [[wiki link]]. */
export const linkFirstMention = (content: string, title: string): string => {
  const re = new RegExp(`(^|[^\\[\\w])(${escapeRegExp(title)})(?![\\w\\]])`, 'i');
  return content.replace(re, (_m, pre) => `${pre}[[${title}]]`);
};

export const todayTitle = (d = new Date()): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const relativeTime = (ts: number): string => {
  const diff = Date.now() - ts;
  const min = Math.round(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
};
