import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronRight, Loader2, Search } from 'lucide-react';
import { MarketingPage } from '../components/SiteChrome';
import { useSeo } from '../hooks/useSeo';

interface SitePage {
  slug: string;
  title: string;
  tags: string[];
  updated_at: number;
  excerpt: string;
}

interface Site {
  handle: string;
  title: string;
  bio: string;
  pages: SitePage[];
}

/** A NoteWeb Pro user's public site: /u/:handle lists their open published notes. */
const PublicSite: React.FC = () => {
  const { handle = '' } = useParams();
  const [site, setSite] = useState<Site | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'missing'>('loading');
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState<string | null>(null);

  useEffect(() => {
    setState('loading');
    fetch(`/api/u/${encodeURIComponent(handle)}`)
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then((s: Site) => {
        setSite(s);
        setState('ok');
      })
      .catch(() => setState('missing'));
  }, [handle]);

  useSeo(site ? `${site.title} · NoteWeb` : 'NoteWeb', site?.bio || (site ? `Notes published by ${site.title} with NoteWeb.` : 'Notes published with NoteWeb.'), `/u/${handle}`);

  const tags = useMemo(() => {
    const counts = new Map<string, number>();
    site?.pages.forEach(p => p.tags.forEach(t => counts.set(t, (counts.get(t) || 0) + 1)));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20);
  }, [site]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (site?.pages || []).filter(
      p => (!tag || p.tags.includes(tag)) && (!q || p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q))
    );
  }, [site, query, tag]);

  return (
    <MarketingPage solidNav>
      <main className="max-w-[760px] mx-auto px-4 sm:px-6 pt-32 pb-24 min-h-[70vh]">
        {state === 'loading' && (
          <p className="flex items-center gap-2 text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </p>
        )}
        {state === 'missing' && (
          <div className="text-center py-16">
            <h1 className="mk-serif text-[40px]">This site isn't here</h1>
            <p className="mt-3 text-[#5d6170]">The address may have changed or the site was taken down.</p>
          </div>
        )}
        {state === 'ok' && site && (
          <>
            <header>
              <p className="text-[12px] tracking-[0.08em] uppercase text-[#8a8e9b]">noteweb.co/u/{site.handle}</p>
              <h1 className="mk-serif text-[clamp(36px,5.5vw,56px)] leading-[1.08] mt-3">{site.title}</h1>
              {site.bio && <p className="mt-4 text-[17px] text-[#5d6170]">{site.bio}</p>}
            </header>

            <div className="mt-10 flex items-center gap-2 px-3 py-2.5 ring-1 ring-[#e7e8ec] bg-white focus-within:ring-2 focus-within:ring-[#05536c]">
              <Search className="w-4 h-4 text-[#8a8e9b]" />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder={`Search ${site.pages.length} notes`} className="flex-1 bg-transparent outline-none text-[15px]" aria-label="Search notes" />
            </div>
            {tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {tags.map(([t, n]) => (
                  <button
                    key={t}
                    onClick={() => setTag(tag === t ? null : t)}
                    className={`text-xs px-2 py-1 transition ${tag === t ? 'bg-[#05536c] text-white' : 'bg-[#f1f3f5] text-[#5d6170] hover:bg-[#e7e8ec]'}`}
                  >
                    #{t} <span className="opacity-60">{n}</span>
                  </button>
                ))}
              </div>
            )}

            <ul className="mt-8 divide-y divide-[#e7e8ec] border-t border-b border-[#e7e8ec]">
              {shown.map(p => (
                <li key={p.slug}>
                  <Link to={`/p/${p.slug}`} className="group block py-5">
                    <span className="flex items-baseline justify-between gap-4">
                      <span className="mk-serif text-[22px] leading-tight group-hover:text-[#05536c]">{p.title}</span>
                      <span className="shrink-0 text-[12px] text-[#8a8e9b]">{new Date(p.updated_at).toLocaleDateString()}</span>
                    </span>
                    {p.excerpt && <span className="block mt-1.5 text-[14px] leading-relaxed text-[#5d6170] line-clamp-2">{p.excerpt}</span>}
                  </Link>
                </li>
              ))}
              {shown.length === 0 && <li className="py-10 text-center text-[#8a8e9b]">{site.pages.length ? 'No notes match.' : 'Nothing published here yet.'}</li>}
            </ul>
          </>
        )}
        <div className="mt-20 pt-8 border-t border-[#e7e8ec] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-[14px] text-[#5d6170]">Published with NoteWeb, the private notebook for connected thinking.</p>
          <Link to="/?home" className="mk-btn mk-btn-teal">
            Try NoteWeb free <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </main>
    </MarketingPage>
  );
};

export default PublicSite;
