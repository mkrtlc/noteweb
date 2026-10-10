import React from 'react';
import { RotateCcw, Trash2 } from 'lucide-react';
import Modal, { Button } from './ui/Modal';
import { TrashedNote } from '../types';
import { plainText, relativeTime } from '../utils/noteUtils';

interface Props {
  open: boolean;
  onClose: () => void;
  trash: TrashedNote[];
  onRestore: (noteId: string) => void;
  onDeleteForever: (noteId: string) => void;
  onEmpty: () => void;
}

const TrashModal: React.FC<Props> = ({ open, onClose, trash, onRestore, onDeleteForever, onEmpty }) => (
  <Modal
    open={open}
    onClose={onClose}
    title="Trash"
    footer={
      trash.length > 0 ? (
        <Button variant="danger" onClick={onEmpty}>
          <Trash2 className="w-4 h-4" /> Empty trash
        </Button>
      ) : undefined
    }
  >
    <div className="p-5">
      <p className="text-xs text-slate-500 mb-3">Deleted notes are kept for 30 days, then removed automatically.</p>
      {trash.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-400">Trash is empty</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {[...trash]
            .sort((a, b) => b.deletedAt - a.deletedAt)
            .map(t => (
              <li key={t.note.id} className="py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{t.note.title}</p>
                  <p className="text-xs text-slate-500 truncate">
                    Deleted {relativeTime(t.deletedAt)} · {plainText(t.note.content).slice(0, 60) || 'Empty'}
                  </p>
                </div>
                <Button onClick={() => onRestore(t.note.id)}>
                  <RotateCcw className="w-4 h-4" /> Restore
                </Button>
                <button
                  onClick={() => onDeleteForever(t.note.id)}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                  title="Delete forever"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  </Modal>
);

export default TrashModal;
