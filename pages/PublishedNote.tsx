import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronRight, Loader2, KeyRound, Flame, Timer } from 'lucide-react';
import { MarketingPage } from '../components/SiteChrome';
import { markdownToHtml } from '../utils/markdownParser';
import { useSeo } from '../hooks/useSeo';
import { plainText } from '../utils/noteUtils';
import { unlockPage, decryptPage, EncryptedPage } from '../services/publishService';
import { trackFeature } from '../services/analyticsService';

interface Page {
  title: string;
  markdown: string;
  tags: string[];
  updated_at: number;
  expires_at?: number | null;
  site?: { handle: string; title: string } | null;
}

/** What the API returns: an open page, an encrypted one, or a view-once preview without content. */
interface ApiPage extends Partial<Page> {
  protected?: boolean;
  burn?: boolean;
  cipher?: EncryptedPage;
  check?: Pick<EncryptedPage, 'salt' | 'check_iv' | 'check_ct'>;
}

type State = 'loading' | 'ok' | 'missing' | 'locked' | 'burn';

/** Public page for a note published with NoteWeb Pro: /p/:slug */
const PublishedNote: React.FC = () => {
  const { slug = '' } = useParams();
  const [page, setPage] = useState<Page | null>(null);
  const [api, setApi] = useState<ApiPage | null>(null);
  const [state, setState] = useState<State>('loading');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [opened, setOpened] = useState(false); // a view-once page was consumed by this visit

  useEffect(() => {
    setState('loading');
    fetch(`/api/pages/${encodeURIComponent(slug)}`)
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then((p: ApiPage) => {
        setApi(p);
        if (p.burn) setState('burn');
        else if (p.protected) setState('locked');
        else {
          setPage(p as Page);
          setState('ok');
        }
      })
      .catch(() => setState('missing'));
  }, [slug]);

  /** Opens protected and/or view-once pages. The password is checked before a view-once page is consumed. */
  const open = async () => {
    if (!api) return;
    setBusy(true);
    setError(null);
    try {
      let key: CryptoKey | null = null;
      if (api.protected) {
        key = await unlockPage(password, (api.cipher || api.check)!);
        if (!key) {
          setError('That password is not right.');
          return;
        }
      }
      let source: ApiPage = api;
      if (api.burn) {
        const r = await fetch(`/api/pages/${encodeURIComponent(slug)}`, { method: 'POST' });
        if (!r.ok) {
          setState('missing');
          return;
        }
        source = await r.json();
        setOpened(true);
      }
      const content = key && source.cipher ? await decryptPage(key, source.cipher) : (source as Page);
      setPage({ ...content, updated_at: source.updated_at || Date.now(), expires_at: source.expires_at, site: source.site || null });
      setState('ok');
      trackFeature('page_unlocked', { burn: !!api.burn, protected: !!api.protected });
    } catch {
      setError('This page could not be opened.');
    } finally {
      setBusy(false);
    }
  };

  const hidden = !!api && (api.protected || api.burn);
  useSeo(
    page && !hidden ? `${page.title} · NoteWeb` : 'A note shared with NoteWeb',
    page && !hidden ? plainText(page.markdown).slice(0, 155) : 'A private note shared with NoteWeb.',
    `/p/${slug}`
  );

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
            <p className="mt-3 text-[#5d6170]">It may have been unpublished, expired or already opened once.</p>
          </div>
        )}
        {(state === 'locked' || state === 'burn') && api && (
          <div className="max-w-[420px] mx-auto text-center py-12">
            <span className="inline-flex w-12 h-12 items-center justify-center bg-[#f1f3f5] text-[#05536c]">
              {api.burn ? <Flame className="w-5 h-5" /> : <KeyRound className="w-5 h-5" />}
            </span>
            <h1 className="mk-serif text-[34px] mt-5">{api.burn ? 'This note can be opened once' : 'This note is password protected'}</h1>
            <p className="mt-3 text-[15px] text-[#5d6170]">
              {api.burn
                ? 'After you open it, it is deleted and the link stops working. Make sure you have time to read it.'
                : 'Enter the password the author gave you. The note is decrypted in your browser.'}
            </p>
            {api.protected && (
              <input
                type="password"
                autoFocus
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && password && open()}
                placeholder="Password"
                className="mt-6 w-full px-3 py-2.5 text-[15px] bg-white ring-1 ring-[#e7e8ec] focus:outline-none focus:ring-2 focus:ring-[#05536c]"
                aria-label="Password"
              />
            )}
            <button onClick={open} disabled={busy || (api.protected && !password)} className="mk-btn mk-btn-teal mk-btn-lg mt-4 w-full justify-center disabled:opacity-60">
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              {api.burn ? 'Open and delete' : 'Unlock'}
            </button>
            {error && (
              <p className="mt-3 text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
          </div>
        )}
        {state === 'ok' && page && (
          <article>
            {opened && (
              <p className="mb-6 flex items-center gap-2 px-3 py-2 text-[13px] bg-[#fff6ef] text-[#9a4a22]">
                <Flame className="w-4 h-4 shrink-0" /> This note has been deleted from the server. Copy anything you need before you leave.
              </p>
            )}
            <p className="flex flex-wrap items-center gap-x-3 text-[12px] tracking-[0.08em] uppercase text-[#8a8e9b]">
              <span>Updated {new Date(page.updated_at).toLocaleDateString()}</span>
              {page.expires_at && (
                <span className="flex items-center gap-1">
                  <Timer className="w-3 h-3" /> Expires {new Date(page.expires_at).toLocaleDateString()}
                </span>
              )}
              {page.site && (
                <Link to={`/u/${page.site.handle}`} className="normal-case tracking-normal text-[13px] text-[#05536c] hover:underline">
                  {page.site.title}
                </Link>
              )}
            </p>
            <h1 className="mk-serif text-[clamp(34px,5vw,52px)] leading-[1.1] mt-3">{page.title}</h1>
            {page.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {page.tags.map(t => (
                  <span key={t} className="text-xs px-2 py-0.5 bg-[#f1f3f5] text-[#5d6170]">
                    #{t}
                  </span>
                ))}
              </div>
            )}
            <div className="editor-content mt-10 text-[17px]" dangerouslySetInnerHTML={{ __html: html }} />
            {page.site && (
              <Link to={`/u/${page.site.handle}`} className="mt-12 inline-flex items-center gap-1 text-[14px] text-[#05536c] hover:underline">
                More notes from {page.site.title} <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
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
