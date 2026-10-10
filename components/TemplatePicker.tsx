import React, { useEffect, useState } from 'react';
import { LayoutTemplate, Trash2, Gem } from 'lucide-react';
import Modal from './ui/Modal';
import { TEMPLATES, NoteTemplate } from '../utils/templates';
import { loadUserTemplates, deleteUserTemplate, UserTemplate } from '../services/templateService';
import { plainText } from '../utils/noteUtils';

interface Props {
  open: boolean;
  onClose: () => void;
  onPick: (t: NoteTemplate) => void;
  onPickUser: (t: UserTemplate) => void;
  pro: boolean;
  onUpgrade: () => void;
}

const TemplatePicker: React.FC<Props> = ({ open, onClose, onPick, onPickUser, pro, onUpgrade }) => {
  const [mine, setMine] = useState<UserTemplate[]>(loadUserTemplates);

  useEffect(() => {
    const refresh = () => setMine(loadUserTemplates());
    window.addEventListener('noteweb-templates-changed', refresh);
    if (open) refresh();
    return () => window.removeEventListener('noteweb-templates-changed', refresh);
  }, [open]);

  const card = 'text-left p-3 rounded-xl ring-1 ring-slate-200 hover:ring-brand-300 hover:bg-brand-50/40 transition';

  return (
    <Modal open={open} onClose={onClose} title={<span className="flex items-center gap-2"><LayoutTemplate className="w-4 h-4" /> New from template</span>}>
      <div className="p-4 space-y-5">
        <section>
          <h3 className="px-1 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Your templates</h3>
          {!pro ? (
            <button onClick={() => { onClose(); onUpgrade(); }} className={`${card} w-full flex items-center gap-3`}>
              <Gem className="w-4 h-4 text-brand-600" />
              <span>
                <span className="block text-sm font-medium text-slate-800">Save your own templates with Pro</span>
                <span className="block text-xs text-slate-500">Turn any note into a reusable template from the note menu.</span>
              </span>
            </button>
          ) : mine.length === 0 ? (
            <p className="px-1 text-sm text-slate-400">Open any note and choose “Save as template” from the ⋯ menu.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-2">
              {mine.map(t => (
                <div key={t.id} className={`${card} relative group`}>
                  <button className="w-full text-left" onClick={() => { onPickUser(t); onClose(); }}>
                    <span className="block text-sm font-medium text-slate-800 pr-6 truncate">{t.name}</span>
                    <span className="block text-xs text-slate-500 truncate">{plainText(t.content).slice(0, 80) || 'Empty'}</span>
                  </button>
                  <button onClick={() => deleteUserTemplate(t.id)} className="absolute top-2.5 right-2.5 p-1 rounded text-slate-300 hover:text-red-600 opacity-0 group-hover:opacity-100" aria-label={`Delete template ${t.name}`}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
        <section>
          <h3 className="px-1 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Built in</h3>
          <div className="grid sm:grid-cols-2 gap-2">
            {TEMPLATES.map(t => (
              <button key={t.id} onClick={() => { onPick(t); onClose(); }} className={card}>
                <span className="block text-sm font-medium text-slate-800">{t.name}</span>
                <span className="block text-xs text-slate-500 mt-0.5">{t.description}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </Modal>
  );
};

export default TemplatePicker;
