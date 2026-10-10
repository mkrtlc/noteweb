import React, { useMemo } from 'react';
import { BarChart3, Flame } from 'lucide-react';
import Modal from './ui/Modal';
import { Note } from '../types';
import { loadActivity, currentStreak, dayKey } from '../services/storageService';
import { extractLinks, extractTasks } from '../utils/markdownParser';
import { wordCount } from '../utils/noteUtils';

const WEEKS = 18;

const StatsModal: React.FC<{ open: boolean; onClose: () => void; notes: Note[] }> = ({ open, onClose, notes }) => {
  const stats = useMemo(() => {
    if (!open) return null;
    const activity = loadActivity();
    const words = notes.reduce((n, note) => n + wordCount(note.content), 0);
    const links = notes.reduce((n, note) => n + extractLinks(note.content).length, 0);
    const tasks = notes.flatMap(n => extractTasks(n.content));
    const weekAgo = Date.now() - 7 * 864e5;
    // Heatmap: WEEKS columns ending this week, Monday-first rows.
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - ((today.getDay() + 6) % 7) - (WEEKS - 1) * 7);
    const cells: { key: string; count: number; future: boolean }[] = [];
    for (let i = 0; i < WEEKS * 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = dayKey(d);
      cells.push({ key, count: activity[key] || 0, future: d > today });
    }
    const max = Math.max(1, ...cells.map(c => c.count));
    return {
      words,
      links,
      tasksDone: tasks.filter(t => t.done).length,
      tasksTotal: tasks.length,
      newThisWeek: notes.filter(n => n.createdAt > weekAgo).length,
      streak: currentStreak(activity),
      activeDays: Object.keys(activity).length,
      cells,
      max,
    };
  }, [open, notes]);

  if (!stats) return null;
  const level = (c: number) => (c === 0 ? 0 : Math.ceil((c / stats.max) * 4));
  const shades = ['bg-slate-100', 'bg-brand-200', 'bg-brand-400', 'bg-brand-500', 'bg-brand-700'];

  return (
    <Modal open={open} onClose={onClose} title={<span className="flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Your writing</span>} width="max-w-2xl">
      <div className="p-5 space-y-6">
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-brand-50 ring-1 ring-slate-200">
          <Flame className={`w-9 h-9 ${stats.streak > 0 ? 'text-amber-500' : 'text-slate-300'}`} />
          <div>
            <p className="text-2xl font-bold text-slate-900">
              {stats.streak} day{stats.streak === 1 ? '' : 's'}
            </p>
            <p className="text-sm text-slate-600">{stats.streak > 0 ? 'Writing streak. Keep it going today!' : 'Write something today to start a streak.'}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            ['Notes', notes.length.toLocaleString()],
            ['Words', stats.words.toLocaleString()],
            ['Links', stats.links.toLocaleString()],
            ['Tasks done', `${stats.tasksDone}/${stats.tasksTotal}`],
          ].map(([label, value]) => (
            <div key={label} className="p-3 rounded-xl ring-1 ring-slate-200">
              <p className="text-xl font-bold text-slate-900">{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          ))}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Last {WEEKS} weeks · {stats.activeDays} active day{stats.activeDays === 1 ? '' : 's'} · {stats.newThisWeek} new note
            {stats.newThisWeek === 1 ? '' : 's'} this week
          </p>
          <div className="grid grid-flow-col grid-rows-7 gap-1 w-max max-w-full overflow-x-auto">
            {stats.cells.map(c => (
              <div
                key={c.key}
                title={`${c.key}: ${c.count} edit session${c.count === 1 ? '' : 's'}`}
                className={`w-3.5 h-3.5 rounded-[3px] ${c.future ? 'opacity-0' : shades[level(c.count)]}`}
              />
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default StatsModal;
