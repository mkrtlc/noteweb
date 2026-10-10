import React, { useMemo, useState } from 'react';
import { CheckSquare, Square, FileText } from 'lucide-react';
import Modal from './ui/Modal';
import { Note } from '../types';
import { extractTasks } from '../utils/markdownParser';

interface Props {
  open: boolean;
  onClose: () => void;
  notes: Note[];
  onToggle: (noteId: string, line: number) => void;
  onOpenNote: (noteId: string) => void;
}

/** Every checklist item across all notes, grouped by note. */
const TasksModal: React.FC<Props> = ({ open, onClose, notes, onToggle, onOpenNote }) => {
  const [showDone, setShowDone] = useState(false);
  const groups = useMemo(
    () =>
      notes
        .map(note => ({ note, tasks: extractTasks(note.content).filter(t => showDone || !t.done) }))
        .filter(g => g.tasks.length > 0)
        .sort((a, b) => b.note.updatedAt - a.note.updatedAt),
    [notes, showDone]
  );
  const openCount = useMemo(() => notes.reduce((n, note) => n + extractTasks(note.content).filter(t => !t.done).length, 0), [notes]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <CheckSquare className="w-4 h-4" /> Tasks <span className="text-sm font-normal text-slate-400">{openCount} open</span>
        </span>
      }
      width="max-w-2xl"
    >
      <div className="p-5">
        <label className="flex items-center gap-2 text-xs text-slate-500 mb-4 select-none">
          <input type="checkbox" checked={showDone} onChange={e => setShowDone(e.target.checked)} className="accent-brand-600" />
          Show completed
        </label>
        {groups.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">
            No open tasks. Type <span className="font-mono">/todo</span> in any note to add a checklist.
          </p>
        ) : (
          <div className="space-y-5">
            {groups.map(({ note, tasks }) => (
              <section key={note.id}>
                <button
                  onClick={() => {
                    onOpenNote(note.id);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-brand-700 mb-1.5"
                >
                  <FileText className="w-3.5 h-3.5" /> {note.title}
                </button>
                <ul className="space-y-0.5">
                  {tasks.map(t => (
                    <li key={t.line}>
                      <button onClick={() => onToggle(note.id, t.line)} className="w-full flex items-start gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 text-left">
                        {t.done ? <CheckSquare className="w-4 h-4 mt-0.5 text-brand-600 shrink-0" /> : <Square className="w-4 h-4 mt-0.5 text-slate-300 shrink-0" />}
                        <span className={`text-sm ${t.done ? 'line-through text-slate-400' : 'text-slate-700'}`}>{t.text || 'Untitled task'}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default TasksModal;
