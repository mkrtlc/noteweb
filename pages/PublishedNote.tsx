import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronRight, Loader2 } from 'lucide-react';
import { MarketingPage } from '../components/SiteChrome';
import { markdownToHtml } from '../utils/markdownParser';
import { useSeo } from '../hooks/useSeo';
import { plainText } from '../utils/noteUtils';

interface Page {
  title: string;
  markdown: string;
  tags: string[];
  updated_at: number;
}

/** Public page for a note published with NoteWeb Pro: /p/:slug */
const PublishedNote: React.FC = () => {
  const { slug = '' } = useParams();
  const [page, setPage] = useState<Page | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'missing'>('loading');

  useEffect(() => {
    setState('loading');
    fetch(`/api/pages/${encodeURIComponent(slug)}`)
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then((p: Page) => {
        setPage(p);
        setState('ok');
      })
      .catch(() => setState('missing'));
  }, [slug]);

  useSeo(page ? `${page.title} · NoteWeb` : 'NoteWeb', page ? plainText(page.markdown).slice(0, 155) : 'A note published with NoteWeb.', `/p/${slug}`);

  const html = useMemo(() => {
    if (!page) return '';
    const div = document.createElement('div');
    div.innerHTML = markdownToHtml(page.markdown);
    div.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
    // Internal links to other published notes open in the same tab.
    div.querySelectorAll('a[href^="/p/"]').forEach(a => {
      a.removeAttribute('target');
      a.removeAttribute('rel');
    });
    return div.innerHTML;
  }, [page]);

  return (
    <MarketingPage solidNav>
      <main className="max-w-[720px] mx-auto px-4 sm:px-6 pt-32 pb-24 min-h-[70vh]">
        {state === 'loading' && (
          <p className="flex items-center gap-2 text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </p>
        )}
        {state === 'missing' && (
          <div className="text-center py-16">
            <h1 className="mk-serif text-[40px]">This page isn't here</h1>
            <p className="mt-3 text-[#5d6170]">It may have been unpublished by its author.</p>
          </div>
        )}
        {state === 'ok' && page && (
          <article>
            <p className="text-[12px] tracking-[0.08em] uppercase text-[#8a8e9b]">Updated {new Date(page.updated_at).toLocaleDateString()}</p>
            <h1 className="mk-serif text-[clamp(34px,5vw,52px)] leading-[1.1] mt-3">{page.title}</h1>
            {page.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {page.tags.map(t => (
                  <span key={t} className="text-xs px-2 py-0.5 bg-[#f1f3f5] text-[#5d6170]">#{t}</span>
                ))}
              </div>
            )}
            <div className="editor-content mt-10 text-[17px]" dangerouslySetInnerHTML={{ __html: html }} />
          </article>
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

export default PublishedNote;
