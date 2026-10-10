import React, { useEffect, useState } from 'react';
import { History, RotateCcw } from 'lucide-react';
import Modal, { Button } from './ui/Modal';
import { Note, NoteSnapshot } from '../types';
import { loadHistory } from '../services/storageService';
import { relativeTime, wordCount } from '../utils/noteUtils';

interface Props {
  open: boolean;
  onClose: () => void;
  note: Note | null;
  onRestore: (snapshot: NoteSnapshot) => void;
}

const HistoryModal: React.FC<Props> = ({ open, onClose, note, onRestore }) => {
  const [snapshots, setSnapshots] = useState<NoteSnapshot[]>([]);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (open && note) {
      setSnapshots(loadHistory(note.id));
      setSelected(0);
    }
  }, [open, note]);

  const current = snapshots[selected];

  return (
    <Modal open={open} onClose={onClose} title={<span className="flex items-center gap-2"><History className="w-4 h-4" /> Version history</span>} width="max-w-3xl">
      {snapshots.length === 0 ? (
        <p className="p-10 text-center text-sm text-slate-400">
          No earlier versions yet. NoteWeb saves a version every few minutes while you write (20 per note, 200 with Pro).
        </p>
      ) : (
        <div className="flex flex-col sm:flex-row min-h-[50vh]">
          <ul className="sm:w-56 shrink-0 border-b sm:border-b-0 sm:border-r border-slate-100 max-h-48 sm:max-h-none overflow-y-auto">
            {snapshots.map((s, i) => (
              <li key={s.at}>
                <button
                  onClick={() => setSelected(i)}
                  className={`w-full text-left px-4 py-2.5 text-sm ${i === selected ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <span className="block font-medium">{relativeTime(s.at)}</span>
                  <span className="block text-xs text-slate-400">
                    {new Date(s.at).toLocaleString()} · {wordCount(s.content)} words
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div className="flex-1 min-w-0 flex flex-col">
            <pre className="flex-1 p-5 text-sm text-slate-700 whitespace-pre-wrap font-mono overflow-auto max-h-[50vh]">
              <span className="block font-sans text-base font-semibold text-slate-900 mb-3">{current?.title}</span>
              {current?.content || '(empty)'}
            </pre>
            <div className="px-5 py-3 border-t border-slate-100 flex justify-end">
              <Button
                variant="primary"
                onClick={() => {
                  if (current) onRestore(current);
                  onClose();
                }}
              >
                <RotateCcw className="w-4 h-4" /> Restore this version
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default HistoryModal;
