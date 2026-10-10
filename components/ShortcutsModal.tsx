import React from 'react';
import Modal, { Kbd, modKey } from './ui/Modal';

const GROUPS: { title: string; items: [string, string[]][] }[] = [
  {
    title: 'General',
    items: [
      ['Command palette & search', [modKey, 'P']],
      ['New note', [modKey, 'Alt', 'N']],
      ["Today's daily note", [modKey, 'Shift', 'D']],
      ['New note from template', [modKey, 'Shift', 'T']],
      ['Toggle focus mode', [modKey, '.']],
      ['Toggle sidebar', [modKey, '\\']],
      ['Backup & export', [modKey, 'Shift', 'E']],
      ['Keyboard shortcuts', [modKey, '/']],
    ],
  },
  {
    title: 'Writing',
    items: [
      ['Slash commands at line start', ['/']],
      ['Checklist item', ['/todo']],
      ['Link to another note', ['@']],
      ['Wiki link (type it out)', ['[[Title]]']],
      ['Insert a date / reminder', ['@@']],
      ['Add a web link', [modKey, 'K']],
      ['Bold / italic', [modKey, 'B / I']],
      ['Undo / redo', [modKey, 'Z / Shift Z']],
    ],
  },
];

const ShortcutsModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => (
  <Modal open={open} onClose={onClose} title="Keyboard shortcuts" width="max-w-2xl">
    <div className="p-5 grid sm:grid-cols-2 gap-6">
      {GROUPS.map(g => (
        <section key={g.title}>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">{g.title}</h3>
          <ul className="space-y-2">
            {g.items.map(([label, keys]) => (
              <li key={label} className="flex items-center justify-between gap-3 text-sm text-slate-700">
                <span>{label}</span>
                <span className="flex gap-1 shrink-0">
                  {keys.map(k => (
                    <Kbd key={k}>{k}</Kbd>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  </Modal>
);

export default ShortcutsModal;
