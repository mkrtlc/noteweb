import React from 'react';
import { LayoutTemplate } from 'lucide-react';
import Modal from './ui/Modal';
import { TEMPLATES, NoteTemplate } from '../utils/templates';

const TemplatePicker: React.FC<{ open: boolean; onClose: () => void; onPick: (t: NoteTemplate) => void }> = ({ open, onClose, onPick }) => (
  <Modal open={open} onClose={onClose} title={<span className="flex items-center gap-2"><LayoutTemplate className="w-4 h-4" /> New from template</span>}>
    <div className="p-4 grid sm:grid-cols-2 gap-2">
      {TEMPLATES.map(t => (
        <button
          key={t.id}
          onClick={() => {
            onPick(t);
            onClose();
          }}
          className="text-left p-3 rounded-xl ring-1 ring-slate-200 hover:ring-brand-300 hover:bg-brand-50/40 transition"
        >
          <span className="block text-sm font-medium text-slate-800">{t.name}</span>
          <span className="block text-xs text-slate-500 mt-0.5">{t.description}</span>
        </button>
      ))}
    </div>
  </Modal>
);

export default TemplatePicker;
