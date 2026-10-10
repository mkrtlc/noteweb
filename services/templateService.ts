/** User-defined templates (NoteWeb Pro): save any note as a reusable template. */
export interface UserTemplate {
  id: string;
  name: string;
  content: string;
  tags: string[];
  createdAt: number;
}

const KEY = 'noteweb_templates';

export const loadUserTemplates = (): UserTemplate[] => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
};

export const saveUserTemplates = (list: UserTemplate[]) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event('noteweb-templates-changed'));
};

export const addUserTemplate = (t: Omit<UserTemplate, 'id' | 'createdAt'>) => {
  const list = loadUserTemplates();
  list.unshift({ ...t, id: crypto.randomUUID(), createdAt: Date.now() });
  saveUserTemplates(list.slice(0, 100));
};

export const deleteUserTemplate = (id: string) => saveUserTemplates(loadUserTemplates().filter(t => t.id !== id));

/** {{date}} and {{title}} placeholders are filled when a note is created. */
export const fillTemplate = (text: string) => {
  const d = new Date();
  const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return text.replace(/\{\{date\}\}/g, iso).replace(/\{\{time\}\}/g, d.toTimeString().slice(0, 5));
};
