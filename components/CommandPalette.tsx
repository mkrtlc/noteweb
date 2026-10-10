import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FileText, Plus, Search, CornerDownLeft, Star } from 'lucide-react';
import { Note } from '../types';
import { searchNotes, highlightSegments, relativeTime } from '../utils/noteUtils';
import { Kbd } from './ui/Modal';

export interface PaletteCommand {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  keywords?: string;
  run: () => void;
}

interface Props {
  open: boolean;
  onClose: () => void;
  notes: Note[];
  commands: PaletteCommand[];
  onOpenNote: (id: string) => void;
  onCreateNote: (title: string) => void;
  onSearch?: (query: string) => void;
}

type Item =
  | { kind: 'note'; note: Note; snippet?: string }
  | { kind: 'command'; command: PaletteCommand }
  | { kind: 'create'; title: string };

const Highlight: React.FC<{ text: string; query: string }> = ({ text, query }) => (
  <>
    {highlightSegments(text, query).map((s, i) =>
      s.hit ? (
        <mark key={i} className="nw-hit">
          {s.text}
        </mark>
      ) : (
        <React.Fragment key={i}>{s.text}</React.Fragment>
      )
    )}
  </>
);

const CommandPalette: React.FC<Props> = ({ open, onClose, notes, commands, onOpenNote, onCreateNote, onSearch }) => {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const commandMode = query.startsWith('>');
  const q = commandMode ? query.slice(1).trim() : query.trim();

  const items: Item[] = useMemo(() => {
    const matchCommand = (c: PaletteCommand) =>
      !q || `${c.label} ${c.keywords || ''}`.toLowerCase().includes(q.toLowerCase());
    if (commandMode) return commands.filter(matchCommand).map(command => ({ kind: 'command' as const, command }));
    if (!q) {
      const recent = [...notes].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 6);
      return [
        ...recent.map(note => ({ kind: 'note' as const, note })),
        ...commands.slice(0, 8).map(command => ({ kind: 'command' as const, command })),
      ];
    }
    const hits = searchNotes(notes, q, 30).map(h => ({ kind: 'note' as const, note: h.note, snippet: h.snippet }));
    const cmds = commands.filter(matchCommand).slice(0, 5).map(command => ({ kind: 'command' as const, command }));
    const exact = notes.some(n => n.title.toLowerCase() === q.toLowerCase());
    const create = exact ? [] : [{ kind: 'create' as const, title: q }];
    // When the query is part of a command's name (not just a keyword), Enter should run that command.
    const named = q.length >= 3 && cmds.some(c => c.command.label.toLowerCase().includes(q.toLowerCase()));
    return named ? [...hits, ...cmds, ...create] : [...hits, ...create, ...cmds];
  }, [q, commandMode, notes, commands]);

  useEffect(() => setSelected(0), [query]);

  useEffect(() => {
    if (!q || commandMode || !onSearch) return;
    const t = setTimeout(() => onSearch(q), 800);
    return () => clearTimeout(t);
  }, [q, commandMode, onSearch]);

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${selected}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  const runItem = (item: Item | undefined) => {
    if (!item) return;
    onClose();
    if (item.kind === 'note') onOpenNote(item.note.id);
    else if (item.kind === 'command') item.command.run();
    else onCreateNote(item.title);
  };

  if (!open) return null;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected(s => Math.min(items.length - 1, s + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected(s => Math.max(0, s - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      runItem(items[selected]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  let lastSection = '';
  const sectionOf = (item: Item) =>
    item.kind === 'command' ? 'Commands' : item.kind === 'create' ? 'Create' : q ? 'Notes' : 'Recent';

  return (
    <div className="fixed inset-0 z-[210] flex items-start justify-center bg-slate-950/40 backdrop-blur-[2px] p-4 pt-[12vh]" onMouseDown={onClose}>
      <div
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl ring-1 ring-slate-200 overflow-hidden"
        onMouseDown={e => e.stopPropagation()}
        role="dialog"
        aria-label="Command palette"
      >
        <div className="flex items-center gap-3 px-4 border-b border-slate-100">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search notes, or type > for commands…"
            className="flex-1 py-4 bg-transparent text-[15px] text-slate-900 placeholder-slate-400 focus:outline-none"
            aria-label="Search"
          />
          <Kbd>esc</Kbd>
        </div>
        <div ref={listRef} className="max-h-[55vh] overflow-y-auto py-2">
          {items.length === 0 && <p className="px-4 py-8 text-center text-sm text-slate-400">No results</p>}
          {items.map((item, i) => {
            const section = sectionOf(item);
            const header = section !== lastSection ? section : null;
            lastSection = section;
            const active = i === selected;
            return (
              <React.Fragment key={i}>
                {header && (
                  <div className="px-4 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{header}</div>
                )}
                <button
                  data-index={i}
                  onMouseMove={() => setSelected(i)}
                  onClick={() => runItem(item)}
                  className={`w-full text-left px-4 py-2.5 flex items-start gap-3 ${active ? 'bg-brand-50' : ''}`}
                >
                  <span className={`mt-0.5 shrink-0 ${active ? 'text-brand-600' : 'text-slate-400'}`}>
                    {item.kind === 'note' ? (
                      item.note.pinned ? <Star className="w-4 h-4" /> : <FileText className="w-4 h-4" />
                    ) : item.kind === 'create' ? (
                      <Plus className="w-4 h-4" />
                    ) : (
                      item.command.icon
                    )}
                  </span>
                  <span className="flex-1 min-w-0">
                    {item.kind === 'note' && (
                      <>
                        <span className="flex items-baseline justify-between gap-3">
                          <span className="text-sm font-medium text-slate-800 truncate">
                            <Highlight text={item.note.title || 'Untitled'} query={q} />
                          </span>
                          <span className="text-[11px] text-slate-400 shrink-0">{relativeTime(item.note.updatedAt)}</span>
                        </span>
                        {item.snippet && (
                          <span className="block text-xs text-slate-500 truncate mt-0.5">
                            <Highlight text={item.snippet} query={q} />
                          </span>
                        )}
                      </>
                    )}
                    {item.kind === 'create' && (
                      <span className="text-sm text-slate-800">
                        Create note <span className="font-semibold">“{item.title}”</span>
                      </span>
                    )}
                    {item.kind === 'command' && <span className="text-sm text-slate-800">{item.command.label}</span>}
                  </span>
                  {item.kind === 'command' && item.command.shortcut && (
                    <span className="text-[11px] text-slate-400 shrink-0 mt-0.5">{item.command.shortcut}</span>
                  )}
                  {active && <CornerDownLeft className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-1" />}
                </button>
              </React.Fragment>
            );
          })}
        </div>
        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 flex items-center gap-4 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> navigate
          </span>
          <span className="flex items-center gap-1">
            <Kbd>↵</Kbd> open
          </span>
          <span className="flex items-center gap-1">
            <Kbd>&gt;</Kbd> commands
          </span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
