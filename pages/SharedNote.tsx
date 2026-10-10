import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { Download, ArrowRight, Lock, AlertTriangle } from 'lucide-react';
import SiteHeader, { SiteFooter } from '../components/SiteChrome';
import { parseShareHash } from '../services/shareService';
import { markdownToHtml } from '../utils/markdownParser';
import { loadNotes, saveNotes } from '../services/storageService';
import { useSeo } from '../hooks/useSeo';
import { trackFeature } from '../services/analyticsService';
import { Note } from '../types';

/** Read-only view of a note shared by link (#n=...). */
const SharedNote: React.FC = () => {
  const navigate = useNavigate();
  const shared = useMemo(() => parseShareHash(window.location.hash), []);
  const [saved, setSaved] = useState(false);
  useSeo(shared ? `${shared.t} · shared with NoteWeb` : 'Shared note · NoteWeb', 'A note shared with NoteWeb, the private linked notebook.', '/share', true);

  const html = useMemo(() => {
    if (!shared) return '';
    const div = document.createElement('div');
    div.innerHTML = markdownToHtml(shared.c);
    // Links to other notes can't be followed outside the author's notebook.
    div.querySelectorAll('.link-chip').forEach(el => el.removeAttribute('data-link'));
    div.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
    return div.innerHTML;
  }, [shared]);

  const saveCopy = async () => {
    if (!shared) return;
    const notes = await loadNotes();
    const copy: Note = {
      id: uuidv4(),
      title: notes.some(n => n.title === shared.t) ? `${shared.t} (shared)` : shared.t,
      content: shared.c,
      tags: shared.g,
      folderId: null,
      order: Math.max(0, ...notes.map(n => n.order || 0)) + 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await saveNotes([copy, ...notes]);
    localStorage.setItem('noteweb_activeNoteId', copy.id);
    setSaved(true);
    trackFeature('shared_note_saved');
    navigate('/app');
  };

  return (
    <div className="fixed inset-0 overflow-y-auto bg-white text-slate-900">
      <SiteHeader />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {!shared ? (
          <div className="text-center py-20">
            <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold">This share link is incomplete</h1>
            <p className="mt-2 text-slate-600">The note lives inside the link itself. Ask the sender to copy the full link again.</p>
            <Link to="/" className="mt-6 inline-flex items-center gap-2 text-brand-700 font-medium">
              What is NoteWeb? <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
              <Lock className="w-3.5 h-3.5" /> Shared privately with NoteWeb{shared.at ? ` · ${new Date(shared.at).toLocaleDateString()}` : ''}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{shared.t}</h1>
            {shared.g.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {shared.g.map(t => (
                  <span key={t} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                    #{t}
                  </span>
                ))}
              </div>
            )}
            <article className="editor-content mt-8" dangerouslySetInnerHTML={{ __html: html }} />
            <div className="mt-12 p-6 rounded-2xl bg-brand-50 ring-1 ring-brand-100 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
              <div>
                <p className="font-semibold text-slate-900">Keep this note</p>
                <p className="text-sm text-slate-600">Save a copy to your own NoteWeb. Free, private, no signup.</p>
              </div>
              <button
                onClick={saveCopy}
                disabled={saved}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-on-accent font-semibold shrink-0"
              >
                <Download className="w-4 h-4" /> Save to my NoteWeb
              </button>
            </div>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
};

export default SharedNote;
