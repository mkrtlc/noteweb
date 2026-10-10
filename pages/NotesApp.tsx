import React, { useState, useEffect, useMemo, useCallback, useRef, Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { Note, GraphData, Folder, TrashedNote, NoteSnapshot, SortMode } from '../types';
import { extractLinks, toggleTaskLine } from '../utils/markdownParser';
import {
  loadNotes,
  saveNotes,
  loadFolders,
  saveFolders,
  loadTrash,
  saveTrash,
  recordSnapshot,
  deleteHistory,
  loadSettings,
  saveSettings,
  AppSettings,
  bumpActivity,
  backupReminderDue,
  snoozeBackupReminder,
  requestPersistentStorage,
} from '../services/storageService';
import { scheduleNotificationsForNotes, getNotificationPermission, isNotificationSupported } from '../services/notificationService';
import {
  trackNoteCreated,
  trackNoteDeleted,
  trackNoteDuplicated,
  trackNoteRenamed,
  trackLinkClicked,
  trackFolderCreated,
  trackFolderDeleted,
  trackFolderRenamed,
  trackNoteMoved,
  trackGraphNodeClicked,
  trackGraphModeChanged,
  trackSessionStart,
  trackFeature,
} from '../services/analyticsService';
import { mergeImport, ImportResult } from '../services/backupService';
import { useTheme } from '../hooks/useTheme';
import { useSeo } from '../hooks/useSeo';
import { buildOnboardingNotes } from '../utils/onboarding';
import { TEMPLATES, NoteTemplate } from '../utils/templates';
import {
  wordCount,
  readingMinutes,
  extractOutline,
  findUnlinkedMentions,
  linkFirstMention,
  todayTitle,
  relativeTime,
  plainText,
  searchNotes,
} from '../utils/noteUtils';
import RichEditor from '../components/RichEditor';
import GraphView from '../components/GraphView';
import CommandPalette, { PaletteCommand } from '../components/CommandPalette';
import BackupModal from '../components/BackupModal';
import TrashModal from '../components/TrashModal';
import HistoryModal from '../components/HistoryModal';
import ShortcutsModal from '../components/ShortcutsModal';
import TemplatePicker from '../components/TemplatePicker';
import TasksModal from '../components/TasksModal';
import StatsModal from '../components/StatsModal';
import ShareModal from '../components/ShareModal';
import ProModal from '../components/ProModal';
import { usePro } from '../hooks/usePro';
import Modal, { Button, Kbd, modKey } from '../components/ui/Modal';
import Logo from '../components/Logo';
import {
  Plus,
  Search,
  Network,
  FileText,
  Menu,
  ChevronRight,
  X,
  PanelRightOpen,
  PanelRightClose,
  Trash2,
  Folder as FolderIcon,
  FolderOpen,
  Edit2,
  ChevronDown,
  Copy,
  Pencil,
  BookOpen,
  HelpCircle,
  Star,
  Hash,
  CalendarDays,
  LayoutTemplate,
  History,
  HardDriveDownload,
  Sun,
  Moon,
  Monitor,
  Maximize2,
  Minimize2,
  Keyboard,
  MoreHorizontal,
  ArrowUpDown,
  ListTree,
  Link2,
  Sparkles,
  Check,
  ShieldCheck,
  Download,
  CheckSquare,
  BarChart3,
  Share2,
  Printer,
  Type,
  Crosshair,
  AlertCircle,
} from 'lucide-react';

const GraphView3D = lazy(() => import('../components/GraphView3D'));

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const isTypingTarget = (el: EventTarget | null) => {
  const t = el as HTMLElement | null;
  return !!t && (t.isContentEditable || t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT');
};

const SORT_LABELS: Record<SortMode, string> = {
  manual: 'Manual order',
  updated: 'Last edited',
  created: 'Date created',
  title: 'Title A–Z',
};

interface Toast {
  id: number;
  text: string;
  action?: { label: string; run: () => void };
}

const NotesApp: React.FC = () => {
  // --- State ---
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [trash, setTrash] = useState<TrashedNote[]>(() => loadTrash());
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const { theme, setTheme, cycleTheme } = useTheme();
  useSeo('NoteWeb', 'Your private NoteWeb notebook.', '/app', true);

  const [activeNoteId, setActiveNoteId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [graphMode, setGraphMode] = useState<'2D' | '3D'>('2D');
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768);
  const [focusMode, setFocusMode] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  // Overlays
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [backupOpen, setBackupOpen] = useState(false);
  const [trashOpen, setTrashOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [tasksOpen, setTasksOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [proOpen, setProOpen] = useState(false);
  const { pro } = usePro();
  const [noteMenuOpen, setNoteMenuOpen] = useState(false);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [backupDue, setBackupDue] = useState(false);
  const [linkPreview, setLinkPreview] = useState<{ title: string; x: number; y: number } | null>(null);

  // Folder management state
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [draggedNote, setDraggedNote] = useState<string | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
  const [dragOverNote, setDragOverNote] = useState<string | null>(null);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [addingTag, setAddingTag] = useState(false);

  const [renameModal, setRenameModal] = useState<{ visible: boolean; noteId: string | null }>({ visible: false, noteId: null });
  const [renameInput, setRenameInput] = useState('');
  const [deleteFolderConfirm, setDeleteFolderConfirm] = useState<{ visible: boolean; folderId: string | null; folderName: string; noteCount: number }>({
    visible: false,
    folderId: null,
    folderName: '',
    noteCount: 0,
  });
  const [createLinkModal, setCreateLinkModal] = useState<{ visible: boolean; title: string }>({ visible: false, title: '' });

  const [rightPanelWidth, setRightPanelWidth] = useState(440);
  const [isResizing, setIsResizing] = useState(false);

  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    noteId: string | null;
    folderId: string | null;
    type: 'note' | 'folder' | 'sidebar' | null;
  }>({ visible: false, x: 0, y: 0, noteId: null, folderId: null, type: null });

  const debouncedNotes = useDebounce(notes, 800);
  const showGraph = settings.showGraph;

  const updateSettings = (patch: Partial<AppSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  };

  const toast = useCallback((text: string, action?: Toast['action']) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t.slice(-2), { id, text, action }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), action ? 10000 : 5000);
  }, []);

  // --- Derived State ---
  const activeNote = useMemo(() => {
    if (notes.length === 0) return null;
    return notes.find(n => n.id === activeNoteId) || notes[0];
  }, [notes, activeNoteId]);

  const allTags = useMemo(() => {
    const counts = new Map<string, number>();
    notes.forEach(n => n.tags.forEach(t => counts.set(t, (counts.get(t) || 0) + 1)));
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [notes]);

  const sortNotes = useCallback(
    (list: Note[]) => {
      const copy = [...list];
      switch (settings.sortMode) {
        case 'updated':
          return copy.sort((a, b) => b.updatedAt - a.updatedAt);
        case 'created':
          return copy.sort((a, b) => b.createdAt - a.createdAt);
        case 'title':
          return copy.sort((a, b) => a.title.localeCompare(b.title));
        default:
          return copy.sort((a, b) => (a.order || 0) - (b.order || 0));
      }
    },
    [settings.sortMode]
  );

  const filteredNotes = useMemo(() => {
    let result = notes;
    if (tagFilter) result = result.filter(n => n.tags.includes(tagFilter));
    if (searchQuery.trim()) {
      const ids = new Set(searchNotes(result, searchQuery, 500).map(h => h.note.id));
      result = result.filter(n => ids.has(n.id));
    }
    return sortNotes(result);
  }, [notes, searchQuery, tagFilter, sortNotes]);

  const pinnedNotes = useMemo(() => filteredNotes.filter(n => n.pinned), [filteredNotes]);

  const backlinks = useMemo(() => {
    if (!activeNote) return [];
    return notes.filter(n => n.id !== activeNote.id && extractLinks(n.content).includes(activeNote.title));
  }, [notes, activeNote]);

  const unlinkedMentions = useMemo(() => (activeNote ? findUnlinkedMentions(debouncedNotes, activeNote) : []), [debouncedNotes, activeNote]);

  const outline = useMemo(() => (activeNote ? extractOutline(activeNote.content) : []), [activeNote]);
  const words = activeNote ? wordCount(activeNote.content) : 0;

  // --- Graph Data ---
  const graphTopology = useMemo(
    () => debouncedNotes.map(n => ({ id: n.id, title: n.title, links: extractLinks(n.content).sort() })),
    [debouncedNotes]
  );
  const lastGraphData = useRef<GraphData>({ nodes: [], links: [] });
  const lastTopologyJson = useRef<string>('');
  const graphData: GraphData = useMemo(() => {
    const currentTopologyJson = JSON.stringify(graphTopology);
    if (currentTopologyJson === lastTopologyJson.current) return lastGraphData.current;
    const nodes = debouncedNotes.map(n => ({ id: n.id, title: n.title }));
    const byTitle = new Map<string, string>(debouncedNotes.map(n => [n.title, n.id]));
    const links: { source: string; target: string }[] = [];
    debouncedNotes.forEach(sourceNote => {
      extractLinks(sourceNote.content).forEach(targetTitle => {
        const targetId = byTitle.get(targetTitle);
        if (targetId) links.push({ source: sourceNote.id, target: targetId });
      });
    });
    const newData = { nodes, links };
    lastGraphData.current = newData;
    lastTopologyJson.current = currentTopologyJson;
    return newData;
  }, [graphTopology, debouncedNotes]);

  const visibleGraph: GraphData = useMemo(() => {
    if (!settings.localGraph || !activeNote) return graphData;
    const keep = new Set<string>([activeNote.id]);
    // Two hops around the current note.
    for (let hop = 0; hop < 2; hop++) {
      graphData.links.forEach(l => {
        const s = typeof l.source === 'string' ? l.source : (l.source as { id: string }).id;
        const t = typeof l.target === 'string' ? l.target : (l.target as { id: string }).id;
        if (keep.has(s) || keep.has(t)) {
          keep.add(s);
          keep.add(t);
        }
      });
    }
    return {
      nodes: graphData.nodes.filter(n => keep.has(n.id)).map(n => ({ ...n })),
      links: graphData.links
        .map(l => ({
          source: typeof l.source === 'string' ? l.source : (l.source as { id: string }).id,
          target: typeof l.target === 'string' ? l.target : (l.target as { id: string }).id,
        }))
        .filter(l => keep.has(l.source) && keep.has(l.target)),
    };
  }, [graphData, settings.localGraph, activeNote]);

  // --- Effects ---
  useEffect(() => {
    const initData = async () => {
      const [loadedNotes, loadedFolders] = await Promise.all([loadNotes(), loadFolders()]);
      setFolders(loadedFolders);
      if (loadedNotes.length > 0) {
        setNotes(loadedNotes);
        const savedActiveNoteId = localStorage.getItem('noteweb_activeNoteId');
        const noteExists = savedActiveNoteId && loadedNotes.some(n => n.id === savedActiveNoteId);
        setActiveNoteId(noteExists ? savedActiveNoteId : loadedNotes[0].id);
        trackSessionStart(loadedNotes.length, loadedFolders.length);
      } else {
        const onboarding = buildOnboardingNotes();
        setNotes(onboarding);
        setActiveNoteId(onboarding[0].id);
        await saveNotes(onboarding);
        trackSessionStart(onboarding.length, 0);
      }
      setIsLoading(false);
    };
    initData();
  }, []);

  // Safety nudges: back up regularly, and ask the browser not to evict storage.
  const persistAsked = useRef(false);
  useEffect(() => {
    if (isLoading) return;
    setBackupDue(backupReminderDue(notes));
    if (!persistAsked.current && notes.length >= 3) {
      persistAsked.current = true;
      requestPersistentStorage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, backupOpen]);

  // Hover previews for [[links]] in the editor.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const over = (e: MouseEvent) => {
      const chip = (e.target as HTMLElement).closest?.('.editor-content .link-chip') as HTMLElement | null;
      clearTimeout(timer);
      if (!chip) {
        setLinkPreview(null);
        return;
      }
      timer = setTimeout(() => {
        const r = chip.getBoundingClientRect();
        setLinkPreview({ title: chip.dataset.link || chip.textContent || '', x: Math.min(r.left, window.innerWidth - 340), y: r.bottom + 8 });
      }, 350);
    };
    document.addEventListener('mouseover', over);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mouseover', over);
    };
  }, []);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (activeNoteId) localStorage.setItem('noteweb_activeNoteId', activeNoteId);
  }, [activeNoteId]);

  useEffect(() => {
    if (!isLoading) saveNotes(notes);
  }, [notes, isLoading]);

  useEffect(() => {
    if (!isLoading) saveFolders(folders);
  }, [folders, isLoading]);

  useEffect(() => {
    saveTrash(trash);
  }, [trash]);

  // Version history: snapshot the active note a few seconds after edits settle.
  useEffect(() => {
    if (isLoading || !activeNote) return;
    const t = setTimeout(() => recordSnapshot(activeNote), 4000);
    return () => clearTimeout(t);
  }, [activeNote, isLoading]);

  useEffect(() => {
    if (!isLoading && notes.length > 0 && isNotificationSupported() && getNotificationPermission() === 'granted') {
      scheduleNotificationsForNotes(notes);
    }
  }, [notes, isLoading]);

  // Resize logic
  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 260 && newWidth < 800) setRightPanelWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // --- Note handlers ---
  const nextOrder = () => Math.max(0, ...notes.map(n => n.order || 0)) + 1;

  const openNote = (id: string) => {
    setActiveNoteId(id);
    if (isMobile) setSidebarOpen(false);
  };

  const addNote = (partial: Partial<Note>) => {
    const newNote: Note = {
      id: uuidv4(),
      title: 'Untitled Note',
      content: '',
      tags: [],
      folderId: null,
      order: nextOrder(),
      updatedAt: Date.now(),
      createdAt: Date.now(),
      ...partial,
    };
    setNotes(prev => [newNote, ...prev]);
    openNote(newNote.id);
    trackNoteCreated();
    return newNote;
  };

  const createNote = (title?: string) => addNote(title ? { title } : {});

  const createFromTemplate = (t: NoteTemplate) => {
    addNote({ title: t.title(), content: t.content(), tags: t.tags });
    trackFeature('template_used', { template: t.id });
  };

  const openDailyNote = () => {
    const title = todayTitle();
    const existing = notes.find(n => n.title === title);
    if (existing) openNote(existing.id);
    else {
      const daily = TEMPLATES.find(t => t.id === 'daily')!;
      addNote({ title, content: daily.content(), tags: daily.tags });
    }
    trackFeature('daily_note_opened', { existed: !!existing });
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    setNotes(prev => prev.map(n => (n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n)));
  };

  const lastActivityBump = useRef(0);
  const updateActiveNote = (updates: Partial<Note>) => {
    if (!activeNote) return;
    updateNote(activeNote.id, updates);
    if (updates.content !== undefined && Date.now() - lastActivityBump.current > 10 * 60 * 1000) {
      lastActivityBump.current = Date.now();
      bumpActivity();
    }
  };

  const toggleTask = (noteId: string, line: number) => {
    setNotes(prev => prev.map(n => (n.id === noteId ? { ...n, content: toggleTaskLine(n.content, line), updatedAt: Date.now() } : n)));
    trackFeature('task_toggled');
  };

  const printNote = () => {
    trackFeature('note_printed');
    setTimeout(() => window.print(), 50);
  };

  const togglePin = (id: string) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    setNotes(prev => prev.map(n => (n.id === id ? { ...n, pinned: !n.pinned } : n)));
    trackFeature('note_pinned', { pinned: !note.pinned });
  };

  const addTag = (raw: string) => {
    if (!activeNote) return;
    const tag = raw.trim().replace(/^#/, '').replace(/\s+/g, '-').toLowerCase();
    if (!tag || activeNote.tags.includes(tag)) return;
    updateActiveNote({ tags: [...activeNote.tags, tag] });
    trackFeature('tag_added');
  };

  const removeTag = (tag: string) => {
    if (activeNote) updateActiveNote({ tags: activeNote.tags.filter(t => t !== tag) });
  };

  const duplicateNote = (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    addNote({ ...note, id: uuidv4(), title: `${note.title} (Copy)`, pinned: false, createdAt: Date.now() });
    closeContextMenu();
    trackNoteDuplicated();
  };

  const moveToTrash = (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    closeContextMenu();
    recordSnapshot(note, true);
    let remaining = notes.filter(n => n.id !== noteId);
    if (remaining.length === 0) {
      remaining = [
        { id: uuidv4(), title: 'Untitled Note', content: '', tags: [], folderId: null, order: 0, createdAt: Date.now(), updatedAt: Date.now() },
      ];
    }
    setNotes(remaining);
    setTrash(prev => [...prev.filter(t => t.note.id !== noteId), { note, deletedAt: Date.now() }]);
    if (noteId === activeNote?.id) setActiveNoteId(remaining[0].id);
    trackNoteDeleted();
    toast(`“${note.title}” moved to trash`, { label: 'Undo', run: () => restoreFromTrash(note.id, note) });
  };

  const trashRef = useRef(trash);
  trashRef.current = trash;

  const restoreFromTrash = (noteId: string, fallback?: Note) => {
    const note = trashRef.current.find(t => t.note.id === noteId)?.note || fallback;
    if (!note) return;
    setTrash(prev => prev.filter(t => t.note.id !== noteId));
    setNotes(current => (current.some(n => n.id === note.id) ? current : [note, ...current]));
    setActiveNoteId(note.id);
    trackFeature('note_restored');
  };

  const deleteForever = (noteId: string) => {
    setTrash(prev => prev.filter(t => t.note.id !== noteId));
    deleteHistory(noteId);
  };

  const emptyTrash = () => {
    trash.forEach(t => deleteHistory(t.note.id));
    setTrash([]);
    trackFeature('trash_emptied');
  };

  const restoreSnapshot = (s: NoteSnapshot) => {
    if (!activeNote) return;
    recordSnapshot(activeNote, true);
    updateActiveNote({ title: s.title, content: s.content });
    trackFeature('version_restored');
    toast('Version restored. The previous text is saved in history.');
  };

  const handleImport = (result: ImportResult) => {
    const merged = mergeImport({ notes, folders }, result);
    setNotes(merged.notes);
    setFolders(merged.folders);
    return { added: merged.added, updated: merged.updated };
  };

  const linkMention = (source: Note) => {
    if (!activeNote) return;
    updateNote(source.id, { content: linkFirstMention(source.content, activeNote.title) });
    trackFeature('mention_linked');
  };

  // --- Folders ---
  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    setFolders([...folders, { id: uuidv4(), name: newFolderName.trim(), createdAt: Date.now() }]);
    setShowFolderModal(false);
    setNewFolderName('');
    trackFolderCreated();
  };

  const deleteFolder = (folderId: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;
    const notesInFolder = notes.filter(n => n.folderId === folderId);
    if (notesInFolder.length > 0) {
      setDeleteFolderConfirm({ visible: true, folderId, folderName: folder.name, noteCount: notesInFolder.length });
    } else {
      setFolders(folders.filter(f => f.id !== folderId));
      trackFolderDeleted();
    }
  };

  const confirmDeleteFolder = () => {
    if (!deleteFolderConfirm.folderId) return;
    setNotes(notes.map(n => (n.folderId === deleteFolderConfirm.folderId ? { ...n, folderId: null } : n)));
    setFolders(folders.filter(f => f.id !== deleteFolderConfirm.folderId));
    setDeleteFolderConfirm({ visible: false, folderId: null, folderName: '', noteCount: 0 });
    trackFolderDeleted();
  };

  const finishRenamingFolder = () => {
    if (editingFolderId && editingFolderName.trim()) {
      setFolders(folders.map(f => (f.id === editingFolderId ? { ...f, name: editingFolderName.trim() } : f)));
      trackFolderRenamed();
    }
    setEditingFolderId(null);
    setEditingFolderName('');
  };

  const toggleFolder = (folderId: string) => {
    setCollapsedFolders(prev => {
      const s = new Set(prev);
      if (s.has(folderId)) s.delete(folderId);
      else s.add(folderId);
      return s;
    });
  };

  const moveNoteToFolder = (noteId: string, targetFolderId: string | null) => {
    setNotes(prev => prev.map(n => (n.id === noteId ? { ...n, folderId: targetFolderId } : n)));
  };

  // --- Context menu ---
  const openContextMenu = (e: React.MouseEvent, type: 'note' | 'folder' | 'sidebar', id: string | null = null) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      visible: true,
      x: Math.min(e.clientX, window.innerWidth - 200),
      y: Math.min(e.clientY, window.innerHeight - 320),
      noteId: type === 'note' ? id : null,
      folderId: type === 'folder' ? id : null,
      type,
    });
  };

  const closeContextMenu = () => setContextMenu({ visible: false, x: 0, y: 0, noteId: null, folderId: null, type: null });

  useEffect(() => {
    if (!contextMenu.visible && !noteMenuOpen && !sortMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('[data-context-menu]')) return;
      closeContextMenu();
      setNoteMenuOpen(false);
      setSortMenuOpen(false);
    };
    const id = setTimeout(() => document.addEventListener('click', handleClick), 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener('click', handleClick);
    };
  }, [contextMenu.visible, noteMenuOpen, sortMenuOpen]);

  const renameNote = (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    setRenameInput(note.title);
    setRenameModal({ visible: true, noteId });
    closeContextMenu();
  };

  const confirmRenameNote = () => {
    if (!renameModal.noteId || !renameInput.trim()) return;
    updateNote(renameModal.noteId, { title: renameInput.trim() });
    setRenameModal({ visible: false, noteId: null });
    trackNoteRenamed();
  };

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      setActiveNoteId(nodeId);
      trackGraphNodeClicked();
    },
    []
  );

  const handleLinkClick = (title: string) => {
    const target = notes.find(n => n.title === title);
    if (target) {
      openNote(target.id);
      trackLinkClicked(title);
    } else {
      setCreateLinkModal({ visible: true, title });
    }
  };

  const confirmCreateLinkedNote = () => {
    if (!createLinkModal.title) return;
    addNote({ title: createLinkModal.title, content: activeNote ? `Linked from [[${activeNote.title}]]` : '' });
    setCreateLinkModal({ visible: false, title: '' });
  };

  const scrollToHeading = (index: number) => {
    const headings = document.querySelectorAll('.editor-content h1, .editor-content h2, .editor-content h3');
    headings[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // --- Drag and drop ---
  const handleDropOnFolder = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedNote) {
      moveNoteToFolder(draggedNote, folderId);
      trackNoteMoved(true);
    }
    setDraggedNote(null);
    setDragOverFolder(null);
  };

  const handleDropOnRoot = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedNote) {
      moveNoteToFolder(draggedNote, null);
      trackNoteMoved(false);
    }
    setDraggedNote(null);
    setDragOverFolder(null);
  };

  const handleDropOnNote = (e: React.DragEvent, targetNoteId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedNote || draggedNote === targetNoteId) {
      setDraggedNote(null);
      setDragOverNote(null);
      return;
    }
    const target = notes.find(n => n.id === targetNoteId);
    if (!target) return;
    const updated = notes.map(n => (n.id === draggedNote ? { ...n, folderId: target.folderId } : n));
    const inFolder = updated.filter(n => n.folderId === target.folderId).sort((a, b) => (a.order || 0) - (b.order || 0));
    const dragged = inFolder.find(n => n.id === draggedNote);
    if (dragged) {
      inFolder.splice(inFolder.indexOf(dragged), 1);
      inFolder.splice(inFolder.findIndex(n => n.id === targetNoteId), 0, dragged);
      inFolder.forEach((note, index) => {
        note.order = index;
      });
    }
    setNotes(updated);
    if (settings.sortMode !== 'manual') updateSettings({ sortMode: 'manual' });
    setDraggedNote(null);
    setDragOverNote(null);
  };

  // --- Commands (palette + shortcuts) ---
  const toggleFocus = () => {
    setFocusMode(f => !f);
    trackFeature('focus_mode_toggled');
  };

  const commands: PaletteCommand[] = [
    { id: 'new', label: 'New note', icon: <Plus className="w-4 h-4" />, shortcut: `${modKey} Alt N`, run: () => createNote() },
    { id: 'daily', label: "Open today's daily note", icon: <CalendarDays className="w-4 h-4" />, shortcut: `${modKey} ⇧ D`, keywords: 'journal today', run: openDailyNote },
    { id: 'template', label: 'New note from template…', icon: <LayoutTemplate className="w-4 h-4" />, shortcut: `${modKey} ⇧ T`, run: () => setTemplatesOpen(true) },
    ...TEMPLATES.map(t => ({
      id: `tpl-${t.id}`,
      label: `Template: ${t.name}`,
      icon: <LayoutTemplate className="w-4 h-4" />,
      keywords: 'template',
      run: () => createFromTemplate(t),
    })),
    { id: 'tasks', label: 'Open tasks (all checklists)', icon: <CheckSquare className="w-4 h-4" />, keywords: 'todo checklist', run: () => { setTasksOpen(true); trackFeature('tasks_opened'); } },
    { id: 'share', label: 'Share current note as a link', icon: <Share2 className="w-4 h-4" />, keywords: 'publish send link', run: () => setShareOpen(true) },
    { id: 'print', label: 'Print or save as PDF', icon: <Printer className="w-4 h-4" />, keywords: 'pdf export', run: printNote },
    { id: 'stats', label: 'Writing stats & streak', icon: <BarChart3 className="w-4 h-4" />, keywords: 'statistics heatmap words', run: () => { setStatsOpen(true); trackFeature('stats_opened'); } },
    { id: 'folder', label: 'New folder', icon: <FolderIcon className="w-4 h-4" />, run: () => setShowFolderModal(true) },
    { id: 'focus', label: focusMode ? 'Exit focus mode' : 'Enter focus mode', icon: <Maximize2 className="w-4 h-4" />, shortcut: `${modKey} .`, keywords: 'zen distraction', run: toggleFocus },
    { id: 'graph', label: showGraph ? 'Hide side panel' : 'Show graph & links panel', icon: <Network className="w-4 h-4" />, run: () => updateSettings({ showGraph: !showGraph }) },
    { id: 'pin', label: activeNote?.pinned ? 'Unpin current note' : 'Pin current note to favorites', icon: <Star className="w-4 h-4" />, keywords: 'favorite', run: () => activeNote && togglePin(activeNote.id) },
    { id: 'history', label: 'Version history of current note', icon: <History className="w-4 h-4" />, keywords: 'restore undo versions', run: () => setHistoryOpen(true) },
    { id: 'backup', label: 'Backup, export & import', icon: <HardDriveDownload className="w-4 h-4" />, shortcut: `${modKey} ⇧ E`, keywords: 'markdown zip json encrypt obsidian', run: () => setBackupOpen(true) },
    { id: 'trash', label: `Open trash${trash.length ? ` (${trash.length})` : ''}`, icon: <Trash2 className="w-4 h-4" />, keywords: 'deleted restore', run: () => setTrashOpen(true) },
    { id: 'delete', label: 'Move current note to trash', icon: <Trash2 className="w-4 h-4" />, run: () => activeNote && moveToTrash(activeNote.id) },
    { id: 'theme-light', label: 'Theme: Light', icon: <Sun className="w-4 h-4" />, keywords: 'appearance', run: () => { setTheme('light'); trackFeature('theme_changed', { theme: 'light' }); } },
    { id: 'theme-dark', label: 'Theme: Dark', icon: <Moon className="w-4 h-4" />, keywords: 'appearance night', run: () => { setTheme('dark'); trackFeature('theme_changed', { theme: 'dark' }); } },
    { id: 'theme-system', label: 'Theme: Match system', icon: <Monitor className="w-4 h-4" />, keywords: 'appearance auto', run: () => { setTheme('system'); trackFeature('theme_changed', { theme: 'system' }); } },
    { id: 'font-sans', label: 'Editor font: Sans', icon: <Type className="w-4 h-4" />, keywords: 'typography appearance', run: () => updateSettings({ editorFont: 'sans' }) },
    { id: 'font-serif', label: 'Editor font: Serif', icon: <Type className="w-4 h-4" />, keywords: 'typography appearance', run: () => updateSettings({ editorFont: 'serif' }) },
    { id: 'font-mono', label: 'Editor font: Mono', icon: <Type className="w-4 h-4" />, keywords: 'typography appearance code', run: () => updateSettings({ editorFont: 'mono' }) },
    { id: 'wide', label: settings.wideEditor ? 'Readable width editor' : 'Full width editor', icon: <Maximize2 className="w-4 h-4" />, keywords: 'layout', run: () => updateSettings({ wideEditor: !settings.wideEditor }) },
    { id: 'local-graph', label: settings.localGraph ? 'Show full graph' : 'Show local graph (nearby notes)', icon: <Crosshair className="w-4 h-4" />, run: () => updateSettings({ localGraph: !settings.localGraph, showGraph: true, rightTab: 'graph' }) },
    { id: 'shortcuts', label: 'Keyboard shortcuts', icon: <Keyboard className="w-4 h-4" />, shortcut: `${modKey} /`, run: () => setShortcutsOpen(true) },
    { id: 'pro', label: pro ? 'NoteWeb Pro: accent colors & subscription' : 'Upgrade to NoteWeb Pro / activate license', icon: <Sparkles className="w-4 h-4" />, keywords: 'pricing upgrade license key accent color theme', run: () => setProOpen(true) },
  ];

  const commandsRef = useRef(commands);
  commandsRef.current = commands;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      const run = (id: string) => {
        e.preventDefault();
        commandsRef.current.find(c => c.id === id)?.run();
      };
      if (mod && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setPaletteOpen(true);
        trackFeature('command_palette_opened');
      } else if (mod && e.altKey && (e.key.toLowerCase() === 'n' || e.code === 'KeyN')) run('new');
      else if (mod && e.shiftKey && e.key.toLowerCase() === 'd') run('daily');
      else if (mod && e.shiftKey && e.key.toLowerCase() === 't') run('template');
      else if (mod && e.shiftKey && e.key.toLowerCase() === 'e') run('backup');
      else if (mod && e.key === '.') run('focus');
      else if (mod && e.key === '\\') {
        e.preventDefault();
        setSidebarOpen(s => !s);
      } else if (mod && e.key === '/') run('shortcuts');
      else if (e.key === '?' && !isTypingTarget(e.target)) run('shortcuts');
      else if (e.key === 'Escape' && focusMode && !isTypingTarget(e.target)) setFocusMode(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [focusMode]);

  // --- Render helpers ---
  const renderNoteRow = (note: Note, indent = false, keyPrefix = '') => {
    const active = activeNote?.id === note.id;
    return (
      <button
        key={keyPrefix + note.id}
        draggable
        onDragStart={e => {
          setDraggedNote(note.id);
          e.dataTransfer.effectAllowed = 'move';
        }}
        onDragOver={e => {
          e.preventDefault();
          e.stopPropagation();
          if (draggedNote && draggedNote !== note.id) setDragOverNote(note.id);
        }}
        onDragLeave={() => setDragOverNote(null)}
        onDrop={e => handleDropOnNote(e, note.id)}
        onClick={() => openNote(note.id)}
        onContextMenu={e => openContextMenu(e, 'note', note.id)}
        className={`w-full text-left ${indent ? 'pl-3' : 'pl-2.5'} pr-2 py-2 rounded-lg transition-colors group flex items-start gap-2.5 ${
          dragOverNote === note.id ? 'ring-1 ring-brand-400' : active ? 'bg-white shadow-sm ring-1 ring-slate-200' : 'hover:bg-slate-100'
        } ${draggedNote === note.id ? 'opacity-50' : ''}`}
      >
        {note.pinned ? (
          <Star className={`w-4 h-4 mt-0.5 shrink-0 ${active ? 'text-amber-500' : 'text-amber-400'}`} fill="currentColor" />
        ) : (
          <FileText className={`w-4 h-4 mt-0.5 shrink-0 ${active ? 'text-brand-600' : 'text-slate-400'}`} />
        )}
        <div className="overflow-hidden w-full">
          <h3 className={`text-sm font-medium truncate ${active ? 'text-slate-900' : 'text-slate-700'}`}>{note.title || 'Untitled'}</h3>
          <p className="text-xs text-slate-400 truncate mt-0.5">{plainText(note.content).slice(0, 60) || 'No content'}</p>
        </div>
      </button>
    );
  };

  const SectionLabel: React.FC<{ children: React.ReactNode; right?: React.ReactNode }> = ({ children, right }) => (
    <div className="flex items-center justify-between px-2.5 pt-4 pb-1">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{children}</span>
      {right}
    </div>
  );

  const menuItem = 'w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2';
  const themeIcon = theme === 'dark' ? <Moon className="w-4 h-4" /> : theme === 'light' ? <Sun className="w-4 h-4" /> : <Monitor className="w-4 h-4" />;
  const rightTab = settings.rightTab;
  const sidebarVisible = sidebarOpen && !focusMode;
  const panelVisible = showGraph && !focusMode && !isMobile;

  return (
    <div className={`flex h-screen bg-white text-slate-900 overflow-hidden ${focusMode ? 'focus-mode' : ''}`}>
      {/* Mobile backdrop */}
      {sidebarVisible && isMobile && <div className="fixed inset-0 z-30 bg-slate-950/30" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside
        className={`print:hidden ${sidebarVisible ? 'w-72 translate-x-0' : 'w-0 -translate-x-full md:translate-x-0'} ${
          isMobile ? 'fixed inset-y-0 left-0 z-40 w-72 shadow-2xl' : 'relative'
        } transition-all duration-300 bg-slate-50 border-r border-slate-200 flex flex-col overflow-hidden shrink-0`}
      >
        <div className="px-3 pt-3 pb-2 flex items-center justify-between">
          <Link to="/?home" className="flex items-center gap-2 px-1 font-semibold text-slate-800" title="NoteWeb home">
            <Logo className="w-6 h-6" />
            <span className="tracking-tight">NoteWeb</span>
          </Link>
          <div className="flex gap-0.5">
            <button onClick={() => setShowFolderModal(true)} className="p-1.5 hover:bg-slate-200 rounded-md text-slate-500" title="New folder">
              <FolderIcon className="w-4 h-4" />
            </button>
            <button onClick={() => createNote()} className="p-1.5 hover:bg-slate-200 rounded-md text-slate-500" title={`New note (${modKey} Alt N)`}>
              <Plus className="w-4 h-4" />
            </button>
            {isMobile && (
              <button onClick={() => setSidebarOpen(false)} className="p-1.5 hover:bg-slate-200 rounded-md text-slate-500" aria-label="Close sidebar">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="px-3 space-y-1.5">
          <button
            onClick={() => {
              setPaletteOpen(true);
              trackFeature('command_palette_opened');
            }}
            className="w-full flex items-center gap-2 px-2.5 py-2 bg-white ring-1 ring-slate-200 rounded-lg text-sm text-slate-400 hover:ring-slate-300"
          >
            <Search className="w-4 h-4" />
            <span className="flex-1 text-left">Search & commands</span>
            <Kbd>{modKey}</Kbd>
            <Kbd>P</Kbd>
          </button>
          <div className="relative">
            <input
              type="text"
              placeholder="Filter list…"
              className="w-full pl-2.5 pr-7 py-1.5 bg-transparent rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-brand-300"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2 top-2 text-slate-400 hover:text-slate-600" aria-label="Clear filter">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button onClick={openDailyNote} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-200/70">
              <CalendarDays className="w-3.5 h-3.5" /> Today
            </button>
            <button onClick={() => setTemplatesOpen(true)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-200/70">
              <LayoutTemplate className="w-3.5 h-3.5" /> Templates
            </button>
            <button
              onClick={() => {
                setTasksOpen(true);
                trackFeature('tasks_opened');
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-200/70"
            >
              <CheckSquare className="w-3.5 h-3.5" /> Tasks
            </button>
            <button
              onClick={() => {
                setStatsOpen(true);
                trackFeature('stats_opened');
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-200/70"
            >
              <BarChart3 className="w-3.5 h-3.5" /> Stats
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4" onDragOver={e => e.preventDefault()} onDrop={handleDropOnRoot} onContextMenu={e => openContextMenu(e, 'sidebar')}>
          {isLoading ? (
            <div className="space-y-2 pt-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-10 mx-1 rounded-lg bg-slate-200/60 animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {tagFilter && (
                <div className="mx-1 mt-3 px-2.5 py-1.5 rounded-lg bg-brand-50 text-brand-700 text-xs flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    {tagFilter}
                  </span>
                  <button onClick={() => setTagFilter(null)} aria-label="Clear tag filter">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {pinnedNotes.length > 0 && (
                <>
                  <SectionLabel>Favorites</SectionLabel>
                  <div className="space-y-0.5">
                    {pinnedNotes.map(note => renderNoteRow(note, false, 'pin-'))}
                  </div>
                </>
              )}

              <SectionLabel
                right={
                  <div className="relative" data-context-menu>
                    <button
                      onClick={() => setSortMenuOpen(o => !o)}
                      className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600"
                      title="Sort notes"
                    >
                      <ArrowUpDown className="w-3 h-3" />
                      {SORT_LABELS[settings.sortMode]}
                    </button>
                    {sortMenuOpen && (
                      <div className="absolute right-0 top-5 z-50 w-40 bg-white rounded-lg shadow-xl ring-1 ring-slate-200 py-1">
                        {(Object.keys(SORT_LABELS) as SortMode[]).map(m => (
                          <button
                            key={m}
                            onClick={() => {
                              updateSettings({ sortMode: m });
                              setSortMenuOpen(false);
                            }}
                            className={menuItem}
                          >
                            <span className="w-4">{settings.sortMode === m && <Check className="w-3.5 h-3.5 text-brand-600" />}</span>
                            {SORT_LABELS[m]}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                }
              >
                Notes
              </SectionLabel>

              <div className="space-y-0.5">
                {filteredNotes
                  .filter(n => !n.folderId)
                  .map(note => renderNoteRow(note))}
              </div>

              {folders.map(folder => {
                const folderNotes = filteredNotes.filter(n => n.folderId === folder.id);
                if ((searchQuery || tagFilter) && folderNotes.length === 0) return null;
                const isCollapsed = collapsedFolders.has(folder.id);
                const isEditing = editingFolderId === folder.id;
                return (
                  <div key={folder.id} className="mt-1">
                    <div
                      className={`w-full px-1.5 py-1.5 rounded-lg transition-colors group flex items-center gap-1.5 ${
                        dragOverFolder === folder.id ? 'bg-brand-100 ring-1 ring-brand-400' : 'hover:bg-slate-100'
                      }`}
                      onDragOver={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDragOverFolder(folder.id);
                      }}
                      onDragLeave={() => setDragOverFolder(null)}
                      onDrop={e => handleDropOnFolder(e, folder.id)}
                      onContextMenu={e => openContextMenu(e, 'folder', folder.id)}
                    >
                      <button onClick={() => toggleFolder(folder.id)} className="p-0.5 hover:bg-slate-200 rounded" aria-label="Toggle folder">
                        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                      </button>
                      {isCollapsed ? <FolderIcon className="w-4 h-4 text-slate-400 shrink-0" /> : <FolderOpen className="w-4 h-4 text-slate-400 shrink-0" />}
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingFolderName}
                          onChange={e => setEditingFolderName(e.target.value)}
                          onBlur={finishRenamingFolder}
                          onKeyDown={e => {
                            if (e.key === 'Enter') finishRenamingFolder();
                            if (e.key === 'Escape') setEditingFolderId(null);
                          }}
                          className="flex-1 px-2 py-0.5 text-sm bg-white ring-1 ring-brand-300 rounded focus:outline-none"
                          autoFocus
                        />
                      ) : (
                        <button className="flex-1 text-left text-sm font-medium text-slate-600 truncate" onClick={() => toggleFolder(folder.id)}>
                          {folder.name} <span className="text-xs text-slate-400">{folderNotes.length}</span>
                        </button>
                      )}
                      <div className="opacity-0 group-hover:opacity-100 flex gap-0.5">
                        <button
                          onClick={() => {
                            setEditingFolderId(folder.id);
                            setEditingFolderName(folder.name);
                          }}
                          className="p-1 hover:bg-slate-200 rounded"
                          title="Rename folder"
                        >
                          <Edit2 className="w-3 h-3 text-slate-500" />
                        </button>
                        <button onClick={() => deleteFolder(folder.id)} className="p-1 hover:bg-red-100 rounded" title="Delete folder">
                          <X className="w-3 h-3 text-red-500" />
                        </button>
                      </div>
                    </div>
                    {!isCollapsed && (
                      <div className="pl-4 space-y-0.5">
                        {folderNotes.map(note => renderNoteRow(note, true))}
                      </div>
                    )}
                  </div>
                );
              })}

              {filteredNotes.length === 0 && (
                <p className="px-3 py-6 text-center text-xs text-slate-400">No notes match.</p>
              )}

              {allTags.length > 0 && (
                <>
                  <SectionLabel>Tags</SectionLabel>
                  <div className="flex flex-wrap gap-1 px-2">
                    {allTags.map(([tag, count]) => (
                      <button
                        key={tag}
                        onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
                        className={`text-xs px-2 py-0.5 rounded-full ring-1 transition ${
                          tagFilter === tag ? 'bg-brand-600 text-on-accent ring-brand-600' : 'text-slate-600 ring-slate-200 hover:ring-brand-300'
                        }`}
                      >
                        #{tag} <span className="opacity-60">{count}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Sidebar footer */}
        <div className="border-t border-slate-200 p-2 space-y-0.5 shrink-0">
          <button
            onClick={() => setProOpen(true)}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm font-medium text-brand-700 bg-brand-50 hover:bg-brand-100"
          >
            <Sparkles className="w-4 h-4" />
            <span className="flex-1 text-left">NoteWeb Pro</span>
            <span className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded ${pro ? 'bg-brand-600 text-on-accent' : 'bg-white/70'}`}>
              {pro ? 'Active' : 'Upgrade'}
            </span>
          </button>
          <div className="flex items-center justify-between px-1 pt-1">
            <div className="flex items-center">
              <button onClick={() => setBackupOpen(true)} className="p-2 rounded-lg text-slate-500 hover:bg-slate-200/70" title="Backup & export">
                <HardDriveDownload className="w-4 h-4" />
              </button>
              <button onClick={() => setTrashOpen(true)} className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-200/70" title="Trash">
                <Trash2 className="w-4 h-4" />
                {trash.length > 0 && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-brand-500" />}
              </button>
              <button
                onClick={() => {
                  cycleTheme();
                  trackFeature('theme_changed');
                }}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-200/70"
                title={`Theme: ${theme}`}
              >
                {themeIcon}
              </button>
              <button onClick={() => setShortcutsOpen(true)} className="p-2 rounded-lg text-slate-500 hover:bg-slate-200/70" title="Keyboard shortcuts">
                <Keyboard className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center">
              <Link to="/blog" className="p-2 rounded-lg text-slate-500 hover:bg-slate-200/70" title="Blog">
                <BookOpen className="w-4 h-4" />
              </Link>
              <Link to="/help" className="p-2 rounded-lg text-slate-500 hover:bg-slate-200/70" title="Help">
                <HelpCircle className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 bg-white relative">
        <header className="print:hidden h-14 border-b border-slate-100 flex items-center px-3 md:px-5 gap-2 shrink-0 bg-white z-20">
          {!focusMode && (
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100" title={`Toggle sidebar (${modKey} \\)`}>
              <Menu className="w-5 h-5" />
            </button>
          )}
          <input
            type="text"
            value={activeNote?.title || ''}
            onChange={e => updateActiveNote({ title: e.target.value })}
            className="min-w-0 flex-1 text-base md:text-lg font-semibold tracking-tight bg-transparent focus:outline-none text-slate-900 placeholder-slate-300"
            placeholder="Note title"
            aria-label="Note title"
          />
          {activeNote && (
            <button
              onClick={() => togglePin(activeNote.id)}
              className={`p-2 rounded-lg hover:bg-slate-100 ${activeNote.pinned ? 'text-amber-500' : 'text-slate-400'}`}
              title={activeNote.pinned ? 'Unpin' : 'Pin to favorites'}
            >
              <Star className="w-4 h-4" fill={activeNote.pinned ? 'currentColor' : 'none'} />
            </button>
          )}
          <button
            onClick={() => {
              setPaletteOpen(true);
              trackFeature('command_palette_opened');
            }}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:bg-slate-100"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>
          <button onClick={() => setShareOpen(true)} className="hidden sm:inline-flex p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100" title="Share as link">
            <Share2 className="w-4 h-4" />
          </button>
          <button onClick={toggleFocus} className="hidden md:inline-flex p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100" title={`Focus mode (${modKey} .)`}>
            {focusMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          {!focusMode && !isMobile && (
            <button
              onClick={() => updateSettings({ showGraph: !showGraph })}
              className={`p-2 flex items-center gap-2 text-sm font-medium rounded-lg transition-colors ${showGraph ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:bg-slate-100'}`}
              title="Toggle graph & links panel"
            >
              {showGraph ? <PanelRightOpen className="w-4 h-4" /> : <PanelRightClose className="w-4 h-4" />}
              <span className="hidden lg:inline">{showGraph ? 'Hide panel' : 'Graph'}</span>
            </button>
          )}
          <div className="relative" data-context-menu>
            <button onClick={() => setNoteMenuOpen(o => !o)} className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100" title="More">
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {noteMenuOpen && activeNote && (
              <div className="absolute right-0 top-10 z-50 w-56 bg-white rounded-xl shadow-xl ring-1 ring-slate-200 py-1">
                <button className={menuItem} onClick={() => { setHistoryOpen(true); setNoteMenuOpen(false); }}>
                  <History className="w-4 h-4 text-slate-400" /> Version history
                </button>
                <button className={menuItem} onClick={() => { duplicateNote(activeNote.id); setNoteMenuOpen(false); }}>
                  <Copy className="w-4 h-4 text-slate-400" /> Duplicate
                </button>
                <button className={menuItem} onClick={() => { setShareOpen(true); setNoteMenuOpen(false); }}>
                  <Share2 className="w-4 h-4 text-slate-400" /> Share as link
                </button>
                <button className={menuItem} onClick={() => { printNote(); setNoteMenuOpen(false); }}>
                  <Printer className="w-4 h-4 text-slate-400" /> Print / PDF
                </button>
                <button className={menuItem} onClick={() => { setBackupOpen(true); setNoteMenuOpen(false); }}>
                  <Download className="w-4 h-4 text-slate-400" /> Export…
                </button>
                <button className={menuItem} onClick={() => { toggleFocus(); setNoteMenuOpen(false); }}>
                  <Maximize2 className="w-4 h-4 text-slate-400" /> {focusMode ? 'Exit focus mode' : 'Focus mode'}
                </button>
                <div className="border-t border-slate-100 my-1" />
                <div className="px-3 pt-1 pb-1.5">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    <Type className="w-3 h-3" /> Text
                  </p>
                  <div className="grid grid-cols-3 gap-1 mb-1.5">
                    {(['sans', 'serif', 'mono'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => updateSettings({ editorFont: f })}
                        className={`py-1 text-xs rounded-md capitalize ${settings.editorFont === f ? 'bg-brand-600 text-on-accent' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'} ${f === 'serif' ? 'font-serif' : f === 'mono' ? 'font-mono' : ''}`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => updateSettings({ wideEditor: !settings.wideEditor })}
                    className="w-full flex items-center justify-between py-1 text-xs text-slate-600"
                  >
                    Full width
                    <span className={`w-7 h-4 rounded-full relative transition ${settings.wideEditor ? 'bg-brand-600' : 'bg-slate-300'}`}>
                      <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${settings.wideEditor ? 'left-3.5' : 'left-0.5'}`} />
                    </span>
                  </button>
                </div>
                <div className="border-t border-slate-100 my-1" />
                <button className={`${menuItem} text-red-600 hover:bg-red-50`} onClick={() => { moveToTrash(activeNote.id); setNoteMenuOpen(false); }}>
                  <Trash2 className="w-4 h-4" /> Move to trash
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden relative z-0">
          {/* Editor column */}
          <div className="flex-1 flex flex-col relative overflow-hidden min-w-0">
            {isLoading ? (
              <div className="p-8 space-y-4 animate-pulse max-w-3xl mx-auto w-full">
                <div className="h-4 bg-slate-200 rounded w-full" />
                <div className="h-4 bg-slate-200 rounded w-5/6" />
                <div className="h-4 bg-slate-200 rounded w-4/5" />
              </div>
            ) : (
              activeNote && (
                <>
                  {/* Tags */}
                  <h1 className="hidden print:block text-3xl font-bold px-10 pt-6">{activeNote.title}</h1>
                  {backupDue && (
                    <div className="print:hidden mx-4 mt-3 px-3 py-2 rounded-xl bg-amber-50 ring-1 ring-amber-200 text-amber-800 text-sm flex flex-wrap items-center gap-x-3 gap-y-1">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span className="flex-1 min-w-[12rem]">Your notes only live in this browser. It's been a while since your last backup.</span>
                      <button onClick={() => setBackupOpen(true)} className="font-semibold hover:underline">
                        Back up now
                      </button>
                      <button
                        onClick={() => {
                          snoozeBackupReminder();
                          setBackupDue(false);
                        }}
                        className="text-amber-700/70 hover:text-amber-900"
                      >
                        Later
                      </button>
                    </div>
                  )}
                  <div className={`print:hidden ${settings.wideEditor ? 'max-w-5xl' : 'max-w-3xl'} w-full mx-auto px-6 md:px-10 pt-4 flex flex-wrap items-center gap-1.5 min-h-[2.25rem]`}>
                    {activeNote.tags.map(t => (
                      <span key={t} className="group text-xs pl-2 pr-1 py-0.5 bg-slate-100 text-slate-600 rounded-full flex items-center gap-1">
                        <button onClick={() => setTagFilter(t)} title="Show notes with this tag">#{t}</button>
                        <button onClick={() => removeTag(t)} className="opacity-40 group-hover:opacity-100 hover:text-red-600" aria-label={`Remove tag ${t}`}>
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    {addingTag ? (
                      <input
                        autoFocus
                        value={tagInput}
                        onChange={e => setTagInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ',') {
                            e.preventDefault();
                            addTag(tagInput);
                            setTagInput('');
                          } else if (e.key === 'Escape') {
                            setAddingTag(false);
                            setTagInput('');
                          }
                        }}
                        onBlur={() => {
                          if (tagInput) addTag(tagInput);
                          setTagInput('');
                          setAddingTag(false);
                        }}
                        placeholder="tag name"
                        list="nw-tag-suggestions"
                        className="text-xs px-2 py-0.5 w-28 rounded-full ring-1 ring-brand-300 bg-white focus:outline-none"
                      />
                    ) : (
                      <button onClick={() => setAddingTag(true)} className="text-xs px-2 py-0.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center gap-1">
                        <Hash className="w-3 h-3" /> Add tag
                      </button>
                    )}
                    <datalist id="nw-tag-suggestions">
                      {allTags.map(([t]) => (
                        <option key={t} value={t} />
                      ))}
                    </datalist>
                  </div>

                  <div className={`flex-1 min-h-0 ${settings.wideEditor ? 'max-w-5xl' : 'max-w-3xl'} w-full mx-auto nw-font-${settings.editorFont}`}>
                    <RichEditor
                      key={activeNote.id}
                      noteId={activeNote.id}
                      initialContent={activeNote.content}
                      availableNotes={notes}
                      onChange={md => updateActiveNote({ content: md })}
                      onLinkClick={handleLinkClick}
                      placeholder="Start writing… Type / for blocks, @ to link a note."
                    />
                  </div>

                  {/* Status bar */}
                  <div className="print:hidden h-8 shrink-0 border-t border-slate-100 px-4 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-3">
                      <span>{words.toLocaleString()} words</span>
                      <span>{readingMinutes(words)} min read</span>
                      <span className="hidden sm:inline">Edited {relativeTime(activeNote.updatedAt)}</span>
                    </span>
                    <button onClick={() => setBackupOpen(true)} className="flex items-center gap-1 hover:text-slate-600" title="Stored only on this device. Click to back up.">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      Saved on this device
                    </button>
                  </div>
                </>
              )
            )}
          </div>

          {/* Right panel */}
          {panelVisible && (
            <div className="print:hidden border-l border-slate-200 bg-slate-50 flex flex-col overflow-hidden shrink-0 relative z-10" style={{ width: rightPanelWidth }}>
              <div className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-brand-400/50 active:bg-brand-500 transition-colors z-50" onMouseDown={startResizing} />
              <div className="flex items-center gap-1 p-2 border-b border-slate-200">
                {([
                  ['graph', 'Graph', <Network key="g" className="w-3.5 h-3.5" />],
                  ['outline', 'Outline', <ListTree key="o" className="w-3.5 h-3.5" />],
                  ['links', `Links ${backlinks.length + unlinkedMentions.length || ''}`, <Link2 key="l" className="w-3.5 h-3.5" />],
                ] as const).map(([id, label, icon]) => (
                  <button
                    key={id}
                    onClick={() => updateSettings({ rightTab: id })}
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md ${
                      rightTab === id ? 'bg-white text-slate-800 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {icon}
                    {label}
                  </button>
                ))}
                {rightTab === 'graph' && (
                  <div className="ml-auto flex items-center gap-0.5">
                    <button
                      onClick={() => updateSettings({ localGraph: !settings.localGraph })}
                      className={`mr-1 flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded ${settings.localGraph ? 'bg-brand-600 text-on-accent' : 'text-slate-500 hover:bg-slate-200'}`}
                      title="Show only notes near the current one"
                    >
                      <Crosshair className="w-3 h-3" /> Local
                    </button>
                    {(['2D', '3D'] as const).map(m => (
                      <button
                        key={m}
                        onClick={() => {
                          setGraphMode(m);
                          trackGraphModeChanged(m);
                        }}
                        className={`px-2 py-0.5 text-[11px] font-medium rounded ${graphMode === m ? 'bg-slate-700 text-on-accent' : 'text-slate-500 hover:bg-slate-200'}`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {rightTab === 'graph' && (
                <div className="flex-1 relative bg-slate-100 min-h-0">
                  {graphMode === '2D' ? (
                    <GraphView data={visibleGraph} onNodeClick={handleNodeClick} activeNodeId={activeNote?.id || ''} />
                  ) : (
                    <Suspense fallback={<div className="p-6 text-sm text-slate-400">Loading 3D graph…</div>}>
                      <GraphView3D data={visibleGraph} onNodeClick={handleNodeClick} activeNodeId={activeNote?.id || ''} />
                    </Suspense>
                  )}
                </div>
              )}

              {rightTab === 'outline' && (
                <div className="flex-1 overflow-y-auto p-3">
                  {outline.length === 0 ? (
                    <p className="p-3 text-sm text-slate-400">Add headings with / → Heading to build an outline.</p>
                  ) : (
                    <ul className="space-y-0.5">
                      {outline.map(h => (
                        <li key={h.index}>
                          <button
                            onClick={() => scrollToHeading(h.index)}
                            className={`w-full text-left text-sm rounded-md px-2 py-1 hover:bg-white text-slate-600 hover:text-slate-900 truncate ${
                              h.level === 1 ? 'font-semibold' : h.level === 2 ? 'pl-5' : 'pl-8 text-xs'
                            }`}
                          >
                            {h.text}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {rightTab === 'links' && (
                <div className="flex-1 overflow-y-auto p-3 space-y-5">
                  <section>
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Linked from · {backlinks.length}</h3>
                    {backlinks.length === 0 ? (
                      <p className="text-sm text-slate-400">No notes link here yet. Type @ in another note to link it.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {backlinks.map(bl => (
                          <button key={bl.id} onClick={() => openNote(bl.id)} className="w-full text-left p-2.5 bg-white rounded-lg ring-1 ring-slate-200 hover:ring-brand-300 group">
                            <span className="flex items-center gap-1.5 text-sm font-medium text-slate-700 group-hover:text-brand-700 truncate">
                              <ChevronRight className="w-3 h-3 text-slate-300" />
                              {bl.title}
                            </span>
                            <span className="block text-xs text-slate-400 pl-4 line-clamp-2">{plainText(bl.content).slice(0, 140)}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </section>
                  <section>
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Unlinked mentions · {unlinkedMentions.length}</h3>
                    {unlinkedMentions.length === 0 ? (
                      <p className="text-sm text-slate-400">No other notes mention “{activeNote?.title}”.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {unlinkedMentions.map(n => (
                          <div key={n.id} className="p-2.5 bg-white rounded-lg ring-1 ring-slate-200 flex items-center gap-2">
                            <button onClick={() => openNote(n.id)} className="flex-1 min-w-0 text-left text-sm font-medium text-slate-700 hover:text-brand-700 truncate">
                              {n.title}
                            </button>
                            <button onClick={() => linkMention(n)} className="text-xs font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 px-2 py-1 rounded-md shrink-0">
                              Link it
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Context menu */}
      {contextMenu.visible && (
        <div
          data-context-menu
          className="fixed z-[100] bg-white rounded-xl shadow-xl ring-1 ring-slate-200 py-1 min-w-[180px]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={e => e.stopPropagation()}
        >
          {contextMenu.type === 'note' && contextMenu.noteId && (
            <>
              <button onClick={() => renameNote(contextMenu.noteId!)} className={menuItem}>
                <Pencil className="w-4 h-4 text-slate-400" /> Rename
              </button>
              <button onClick={() => { togglePin(contextMenu.noteId!); closeContextMenu(); }} className={menuItem}>
                <Star className="w-4 h-4 text-slate-400" /> {notes.find(n => n.id === contextMenu.noteId)?.pinned ? 'Unpin' : 'Pin to favorites'}
              </button>
              <button onClick={() => duplicateNote(contextMenu.noteId!)} className={menuItem}>
                <Copy className="w-4 h-4 text-slate-400" /> Duplicate
              </button>
              {folders.length > 0 && (
                <div className="border-t border-slate-100 my-1">
                  <div className="px-3 py-1 text-xs text-slate-400 font-medium">Move to folder</div>
                  {notes.find(n => n.id === contextMenu.noteId)?.folderId && (
                    <button onClick={() => { moveNoteToFolder(contextMenu.noteId!, null); closeContextMenu(); }} className={menuItem}>
                      <FileText className="w-4 h-4 text-slate-400" /> No folder
                    </button>
                  )}
                  {folders.map(folder => (
                    <button key={folder.id} onClick={() => { moveNoteToFolder(contextMenu.noteId!, folder.id); closeContextMenu(); }} className={menuItem}>
                      <FolderIcon className="w-4 h-4 text-slate-400" /> {folder.name}
                    </button>
                  ))}
                </div>
              )}
              <div className="border-t border-slate-100 my-1" />
              <button onClick={() => moveToTrash(contextMenu.noteId!)} className={`${menuItem} text-red-600 hover:bg-red-50`}>
                <Trash2 className="w-4 h-4" /> Move to trash
              </button>
            </>
          )}
          {contextMenu.type === 'folder' && contextMenu.folderId && (
            <>
              <button
                onClick={() => {
                  const folder = folders.find(f => f.id === contextMenu.folderId);
                  if (folder) {
                    setEditingFolderId(folder.id);
                    setEditingFolderName(folder.name);
                  }
                  closeContextMenu();
                }}
                className={menuItem}
              >
                <Pencil className="w-4 h-4 text-slate-400" /> Rename
              </button>
              <div className="border-t border-slate-100 my-1" />
              <button onClick={() => { deleteFolder(contextMenu.folderId!); closeContextMenu(); }} className={`${menuItem} text-red-600 hover:bg-red-50`}>
                <Trash2 className="w-4 h-4" /> Delete folder
              </button>
            </>
          )}
          {contextMenu.type === 'sidebar' && (
            <>
              <button onClick={() => { createNote(); closeContextMenu(); }} className={menuItem}>
                <Plus className="w-4 h-4 text-slate-400" /> New note
              </button>
              <button onClick={() => { setTemplatesOpen(true); closeContextMenu(); }} className={menuItem}>
                <LayoutTemplate className="w-4 h-4 text-slate-400" /> New from template
              </button>
              <button onClick={() => { setShowFolderModal(true); closeContextMenu(); }} className={menuItem}>
                <FolderIcon className="w-4 h-4 text-slate-400" /> New folder
              </button>
              <div className="border-t border-slate-100 my-1" />
              <div className="px-3 py-1 text-xs text-slate-400 font-medium">
                {notes.length} note{notes.length !== 1 ? 's' : ''} · {folders.length} folder{folders.length !== 1 ? 's' : ''}
              </div>
            </>
          )}
        </div>
      )}

      {/* Link hover preview */}
      {linkPreview &&
        (() => {
          const target = notes.find(n => n.title === linkPreview.title);
          return (
            <div
              className="print:hidden fixed z-[150] w-80 p-3 rounded-xl bg-white shadow-xl ring-1 ring-slate-200 pointer-events-none"
              style={{ left: linkPreview.x, top: linkPreview.y }}
            >
              <p className="text-sm font-semibold text-slate-900 truncate">{linkPreview.title}</p>
              <p className="mt-1 text-xs text-slate-500 line-clamp-4">
                {target ? plainText(target.content).slice(0, 280) || 'Empty note' : 'This note does not exist yet. Click to create it.'}
              </p>
              {target && <p className="mt-2 text-[10px] text-slate-400">Edited {relativeTime(target.updatedAt)}</p>}
            </div>
          );
        })()}

      {/* Toasts */}
      <div className="print:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-[300] flex flex-col gap-2 items-center pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm shadow-xl" role="status">
            <span>{t.text}</span>
            {t.action && (
              <button
                onClick={() => {
                  t.action!.run();
                  setToasts(ts => ts.filter(x => x.id !== t.id));
                }}
                className="font-semibold text-brand-300 hover:text-brand-200"
              >
                {t.action.label}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Overlays */}
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        notes={notes}
        commands={commands}
        onOpenNote={openNote}
        onCreateNote={title => createNote(title)}
        onSearch={q => trackFeature('search_performed', { length: q.length })}
      />
      <BackupModal open={backupOpen} onClose={() => setBackupOpen(false)} notes={notes} folders={folders} activeNote={activeNote} onImport={handleImport} />
      <TrashModal
        open={trashOpen}
        onClose={() => setTrashOpen(false)}
        trash={trash}
        onRestore={id => restoreFromTrash(id)}
        onDeleteForever={deleteForever}
        onEmpty={emptyTrash}
      />
      <HistoryModal open={historyOpen} onClose={() => setHistoryOpen(false)} note={activeNote} onRestore={restoreSnapshot} />
      <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <TemplatePicker open={templatesOpen} onClose={() => setTemplatesOpen(false)} onPick={createFromTemplate} />
      <TasksModal open={tasksOpen} onClose={() => setTasksOpen(false)} notes={notes} onToggle={toggleTask} onOpenNote={openNote} />
      <StatsModal open={statsOpen} onClose={() => setStatsOpen(false)} notes={notes} />
      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} note={activeNote} />
      <ProModal open={proOpen} onClose={() => setProOpen(false)} />

      <Modal
        open={showFolderModal}
        onClose={() => setShowFolderModal(false)}
        title="New folder"
        width="max-w-sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowFolderModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreateFolder} disabled={!newFolderName.trim()}>Create</Button>
          </>
        }
      >
        <div className="p-5">
          <input
            type="text"
            autoFocus
            placeholder="Folder name"
            value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreateFolder()}
            className="w-full px-3 py-2 rounded-lg bg-white ring-1 ring-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </Modal>

      <Modal
        open={renameModal.visible}
        onClose={() => setRenameModal({ visible: false, noteId: null })}
        title="Rename note"
        width="max-w-sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRenameModal({ visible: false, noteId: null })}>Cancel</Button>
            <Button variant="primary" onClick={confirmRenameNote} disabled={!renameInput.trim()}>Rename</Button>
          </>
        }
      >
        <div className="p-5">
          <input
            type="text"
            autoFocus
            value={renameInput}
            onChange={e => setRenameInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && confirmRenameNote()}
            className="w-full px-3 py-2 rounded-lg bg-white ring-1 ring-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </Modal>

      <Modal
        open={deleteFolderConfirm.visible}
        onClose={() => setDeleteFolderConfirm({ visible: false, folderId: null, folderName: '', noteCount: 0 })}
        title="Delete folder"
        width="max-w-sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteFolderConfirm({ visible: false, folderId: null, folderName: '', noteCount: 0 })}>Cancel</Button>
            <Button variant="danger" onClick={confirmDeleteFolder}>Delete folder</Button>
          </>
        }
      >
        <p className="p-5 text-sm text-slate-600">
          “{deleteFolderConfirm.folderName}” contains {deleteFolderConfirm.noteCount} note{deleteFolderConfirm.noteCount !== 1 ? 's' : ''}. They will be kept and moved out of the folder.
        </p>
      </Modal>

      <Modal
        open={createLinkModal.visible}
        onClose={() => setCreateLinkModal({ visible: false, title: '' })}
        title="Create note"
        width="max-w-sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateLinkModal({ visible: false, title: '' })}>Cancel</Button>
            <Button variant="primary" onClick={confirmCreateLinkedNote}>Create note</Button>
          </>
        }
      >
        <p className="p-5 text-sm text-slate-600">
          “{createLinkModal.title}” doesn't exist yet. Create it?
        </p>
      </Modal>
    </div>
  );
};

export default NotesApp;
