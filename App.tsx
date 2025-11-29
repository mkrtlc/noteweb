import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { Note, GraphData, Folder } from './types';
import BlogList from './components/BlogList';
import BlogPostPage from './components/BlogPost';
import HelpPage from './components/HelpPage';
import { extractLinks } from './utils/markdownParser';
import { loadNotes, saveNotes, loadFolders, saveFolders } from './services/storageService';
import {
  scheduleNotificationsForNotes,
  getNotificationPermission,
  isNotificationSupported
} from './services/notificationService';
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
  trackGraphViewed,
  trackGraphNodeClicked,
  trackGraphModeChanged,
  trackSessionStart
} from './services/analyticsService';
import RichEditor from './components/RichEditor';
import GraphView from './components/GraphView';
import GraphView3D from './components/GraphView3D';
import {
  Plus,
  Search,
  Network,
  FileText,
  Menu,
  ChevronRight,
  Tags,
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
  HelpCircle
} from 'lucide-react';

// --- Empty Dataset Generation ---
const generateCosmosData = (): Note[] => {
  return [];
};

// Hook for debouncing values
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

const NotesApp: React.FC = () => {
  // --- State ---
  const [notes, setNotes] = useState<Note[]>(generateCosmosData());
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activeNoteId, setActiveNoteId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showGraph, setShowGraph] = useState(true); // Default to true to show off the galaxy
  const [graphMode, setGraphMode] = useState<'2D' | '3D'>('2D'); // Default to 2D
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Folder management state
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [draggedNote, setDraggedNote] = useState<string | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
  const [dragOverNote, setDragOverNote] = useState<string | null>(null);

  // Folder creation modal state
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Rename note modal state
  const [renameModal, setRenameModal] = useState<{
    visible: boolean;
    noteId: string | null;
    currentTitle: string;
  }>({ visible: false, noteId: null, currentTitle: '' });
  const [renameInput, setRenameInput] = useState('');

  // Delete folder confirmation modal state
  const [deleteFolderConfirm, setDeleteFolderConfirm] = useState<{
    visible: boolean;
    folderId: string | null;
    folderName: string;
    noteCount: number;
  }>({ visible: false, folderId: null, folderName: '', noteCount: 0 });

  // Create linked note confirmation modal state
  const [createLinkModal, setCreateLinkModal] = useState<{
    visible: boolean;
    title: string;
  }>({ visible: false, title: '' });
  
  // Right Panel State
  const [rightPanelWidth, setRightPanelWidth] = useState(500); // Wider by default for graph
  const [isResizing, setIsResizing] = useState(false);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    noteId: string | null;
    folderId: string | null;
    type: 'note' | 'folder' | 'sidebar' | null;
  }>({ visible: false, x: 0, y: 0, noteId: null, folderId: null, type: null });

  // Delete Confirmation State
  const [deleteConfirm, setDeleteConfirm] = useState<{
    visible: boolean;
    noteId: string | null;
    noteTitle: string;
  }>({ visible: false, noteId: null, noteTitle: '' });

  // Debounce notes for Graph logic
  const debouncedNotes = useDebounce(notes, 800);

  // --- Derived State ---
  const activeNote = useMemo(() => {
    if (notes.length === 0) return null;
    return notes.find(n => n.id === activeNoteId) || notes[0];
  }, [notes, activeNoteId]);
  
  const filteredNotes = useMemo(() => {
    let result = notes;
    if (searchQuery) {
      result = notes.filter(n =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return result.sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [notes, searchQuery]);

  // Calculate Backlinks
  const backlinks = useMemo(() => {
    if (!activeNote) return [];
    return notes.filter(n => {
      const links = extractLinks(n.content);
      return links.includes(activeNote.title); // Linking by Title for this demo
    });
  }, [notes, activeNote]);

  // --- Graph Data Optimization ---
  const graphTopology = useMemo(() => {
    return debouncedNotes.map(n => ({
      id: n.id,
      title: n.title,
      links: extractLinks(n.content).sort()
    }));
  }, [debouncedNotes]);

  const lastGraphData = useRef<GraphData>({ nodes: [], links: [] });
  const lastTopologyJson = useRef<string>('');

  const graphData: GraphData = useMemo(() => {
    const currentTopologyJson = JSON.stringify(graphTopology);
    
    if (currentTopologyJson === lastTopologyJson.current) {
      return lastGraphData.current;
    }

    const nodes = debouncedNotes.map(n => ({ id: n.id, title: n.title }));
    const links: any[] = [];
    
    debouncedNotes.forEach(sourceNote => {
      const extracted = extractLinks(sourceNote.content);
      extracted.forEach(targetTitle => {
        const targetNote = debouncedNotes.find(n => n.title === targetTitle);
        if (targetNote) {
          links.push({ source: sourceNote.id, target: targetNote.id });
        }
      });
    });

    const newData = { nodes, links };
    lastGraphData.current = newData;
    lastTopologyJson.current = currentTopologyJson;
    
    return newData;
  }, [graphTopology, debouncedNotes]);

  // --- Effects ---
  // Load notes and folders from file on mount
  useEffect(() => {
    const initData = async () => {
      const [loadedNotes, loadedFolders] = await Promise.all([
        loadNotes(),
        loadFolders()
      ]);

      setFolders(loadedFolders);

      if (loadedNotes.length > 0) {
        setNotes(loadedNotes);
        // Restore last active note from localStorage, or default to first note
        const savedActiveNoteId = localStorage.getItem('noteweb_activeNoteId');
        const noteExists = savedActiveNoteId && loadedNotes.some(n => n.id === savedActiveNoteId);
        setActiveNoteId(noteExists ? savedActiveNoteId : loadedNotes[0].id);
        trackSessionStart(loadedNotes.length, loadedFolders.length);
      } else {
        // If no notes in file, create a welcome note
        const welcomeNote: Note = {
          id: uuidv4(),
          title: 'Welcome to NoteWeb',
          content: 'Start taking notes with [[wiki-style links]] to connect your ideas!\n\nClick the **+ button** to create a new note.',
          tags: [],
          folderId: null,
          order: 0,
          updatedAt: Date.now(),
          createdAt: Date.now()
        };
        setNotes([welcomeNote]);
        setActiveNoteId(welcomeNote.id);
        await saveNotes([welcomeNote]);
        trackSessionStart(1, 0);
      }
      setIsLoading(false);
    };
    initData();
  }, []);

  // Save active note ID to localStorage when it changes
  useEffect(() => {
    if (activeNoteId) {
      localStorage.setItem('noteweb_activeNoteId', activeNoteId);
    }
  }, [activeNoteId]);

  // Save notes to file whenever they change
  useEffect(() => {
    if (!isLoading && notes.length > 0) {
      saveNotes(notes);
    }
  }, [notes, isLoading]);

  // Save folders to file whenever they change
  useEffect(() => {
    if (!isLoading && folders.length >= 0) {
      saveFolders(folders);
    }
  }, [folders, isLoading]);

  // Schedule notifications whenever notes change
  useEffect(() => {
    if (!isLoading && notes.length > 0 && isNotificationSupported() && getNotificationPermission() === 'granted') {
      scheduleNotificationsForNotes(notes);
    }
  }, [notes, isLoading]);

  // Resize Logic
  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = window.innerWidth - e.clientX;
      // Constraints
      if (newWidth > 250 && newWidth < 800) {
        setRightPanelWidth(newWidth);
      }
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

  // --- Handlers ---
  const createNote = () => {
    const maxOrder = Math.max(0, ...notes.map(n => n.order || 0));
    const newNote: Note = {
      id: uuidv4(),
      title: 'Untitled Note',
      content: '',
      tags: [],
      folderId: null,
      order: maxOrder + 1,
      updatedAt: Date.now(),
      createdAt: Date.now(),
    };
    setNotes([newNote, ...notes]);
    setActiveNoteId(newNote.id);
    trackNoteCreated();
  };

  const createFolder = () => {
    setNewFolderName('');
    setShowFolderModal(true);
  };

  const handleCreateFolder = () => {
    if (!newFolderName || newFolderName.trim() === '') return;

    const newFolder: Folder = {
      id: uuidv4(),
      name: newFolderName.trim(),
      createdAt: Date.now()
    };
    setFolders([...folders, newFolder]);
    setShowFolderModal(false);
    setNewFolderName('');
    trackFolderCreated();
  };

  const deleteFolder = (folderId: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    const notesInFolder = notes.filter(n => n.folderId === folderId);

    if (notesInFolder.length > 0) {
      // Show confirmation modal
      setDeleteFolderConfirm({
        visible: true,
        folderId,
        folderName: folder.name,
        noteCount: notesInFolder.length
      });
    } else {
      // No notes in folder, delete directly
      setFolders(folders.filter(f => f.id !== folderId));
    }
  };

  const confirmDeleteFolder = () => {
    if (!deleteFolderConfirm.folderId) return;

    // Move notes to root
    setNotes(notes.map(n =>
      n.folderId === deleteFolderConfirm.folderId ? { ...n, folderId: null } : n
    ));

    // Delete the folder
    setFolders(folders.filter(f => f.id !== deleteFolderConfirm.folderId));
    setDeleteFolderConfirm({ visible: false, folderId: null, folderName: '', noteCount: 0 });
    trackFolderDeleted();
  };

  const cancelDeleteFolder = () => {
    setDeleteFolderConfirm({ visible: false, folderId: null, folderName: '', noteCount: 0 });
  };

  const startRenamingFolder = (folder: Folder) => {
    setEditingFolderId(folder.id);
    setEditingFolderName(folder.name);
  };

  const finishRenamingFolder = () => {
    if (editingFolderId && editingFolderName.trim()) {
      setFolders(folders.map(f =>
        f.id === editingFolderId ? { ...f, name: editingFolderName.trim() } : f
      ));
      trackFolderRenamed();
    }
    setEditingFolderId(null);
    setEditingFolderName('');
  };

  const toggleFolder = (folderId: string) => {
    setCollapsedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const moveNoteToFolder = (noteId: string, targetFolderId: string | null) => {
    setNotes(notes.map(n =>
      n.id === noteId ? { ...n, folderId: targetFolderId } : n
    ));
  };

  // Context Menu Handlers
  const handleNoteContextMenu = (e: React.MouseEvent, noteId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      noteId,
      folderId: null,
      type: 'note'
    });
  };

  const handleFolderContextMenu = (e: React.MouseEvent, folderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      noteId: null,
      folderId,
      type: 'folder'
    });
  };

  const handleSidebarContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      noteId: null,
      folderId: null,
      type: 'sidebar'
    });
  };

  const closeContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0, noteId: null, folderId: null, type: null });
  };

  const duplicateNote = (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    const maxOrder = Math.max(0, ...notes.map(n => n.order || 0));
    const newNote: Note = {
      ...note,
      id: uuidv4(),
      title: `${note.title} (Copy)`,
      order: maxOrder + 1,
      updatedAt: Date.now(),
      createdAt: Date.now(),
    };
    setNotes([newNote, ...notes]);
    setActiveNoteId(newNote.id);
    closeContextMenu();
    trackNoteDuplicated();
  };

  const renameNote = (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    setRenameInput(note.title);
    setRenameModal({
      visible: true,
      noteId,
      currentTitle: note.title
    });
    closeContextMenu();
  };

  const confirmRenameNote = () => {
    if (!renameModal.noteId || !renameInput.trim()) return;

    setNotes(notes.map(n =>
      n.id === renameModal.noteId ? { ...n, title: renameInput.trim(), updatedAt: Date.now() } : n
    ));
    setRenameModal({ visible: false, noteId: null, currentTitle: '' });
    setRenameInput('');
    trackNoteRenamed();
  };

  const cancelRenameNote = () => {
    setRenameModal({ visible: false, noteId: null, currentTitle: '' });
    setRenameInput('');
  };

  // Close context menu when clicking elsewhere
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Don't close if clicking inside the context menu
      const target = e.target as HTMLElement;
      if (target.closest('[data-context-menu]')) {
        return;
      }
      closeContextMenu();
    };
    if (contextMenu.visible) {
      // Use setTimeout to avoid the click that opened the menu from immediately closing it
      const timeoutId = setTimeout(() => {
        document.addEventListener('click', handleClick);
      }, 0);
      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('click', handleClick);
      };
    }
  }, [contextMenu.visible]);

  const updateActiveNote = (updates: Partial<Note>) => {
    setNotes(prev => prev.map(n => 
      n.id === activeNoteId ? { ...n, ...updates, updatedAt: Date.now() } : n
    ));
  };

  const handleNodeClick = useCallback((nodeId: string) => {
    setActiveNoteId(nodeId);
    trackGraphNodeClicked();
  }, []);

  const handleLinkClick = (title: string) => {
    const target = notes.find(n => n.title === title);
    if (target) {
      setActiveNoteId(target.id);
      trackLinkClicked(title);
    } else {
      // Show confirmation modal to create linked note
      setCreateLinkModal({
        visible: true,
        title
      });
    }
  };

  const confirmCreateLinkedNote = () => {
    if (!createLinkModal.title) return;

    const maxOrder = Math.max(0, ...notes.map(n => n.order || 0));
    const newNote: Note = {
      id: uuidv4(),
      title: createLinkModal.title,
      content: activeNote ? `Linked from [[${activeNote.title}]]` : '',
      tags: [],
      folderId: null,
      order: maxOrder + 1,
      updatedAt: Date.now(),
      createdAt: Date.now()
    };
    setNotes([newNote, ...notes]);
    setActiveNoteId(newNote.id);
    setCreateLinkModal({ visible: false, title: '' });
  };

  const cancelCreateLinkedNote = () => {
    setCreateLinkModal({ visible: false, title: '' });
  };

  const deleteNote = (noteId: string) => {
    // Guard: check if noteId is valid
    const noteToDelete = notes.find(n => n.id === noteId);
    if (!noteToDelete) {
      closeContextMenu();
      return;
    }

    if (notes.length === 1) {
      alert("Cannot delete the last note.");
      closeContextMenu();
      return;
    }

    // Show confirmation modal
    closeContextMenu();
    setDeleteConfirm({
      visible: true,
      noteId,
      noteTitle: noteToDelete.title
    });
  };

  const confirmDeleteNote = () => {
    if (!deleteConfirm.noteId) return;

    const updatedNotes = notes.filter(n => n.id !== deleteConfirm.noteId);
    setNotes(updatedNotes);

    // If we deleted the active note, switch to another one
    if (deleteConfirm.noteId === activeNoteId) {
      setActiveNoteId(updatedNotes[0].id);
    }

    setDeleteConfirm({ visible: false, noteId: null, noteTitle: '' });
    trackNoteDeleted();
  };

  const cancelDeleteNote = () => {
    setDeleteConfirm({ visible: false, noteId: null, noteTitle: '' });
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, noteId: string) => {
    setDraggedNote(noteId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragOverFolder = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDragOverFolder(folderId);
  };

  const handleDragLeaveFolder = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverFolder(null);
  };

  const handleDropOnFolder = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedNote) {
      moveNoteToFolder(draggedNote, folderId);
      setDraggedNote(null);
      setDragOverFolder(null);
      trackNoteMoved(true);
    }
  };

  const handleDropOnRoot = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedNote) {
      moveNoteToFolder(draggedNote, null);
      setDraggedNote(null);
      setDragOverFolder(null);
      trackNoteMoved(false);
    }
  };

  const handleDragOverNote = (e: React.DragEvent, noteId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedNote && draggedNote !== noteId) {
      setDragOverNote(noteId);
    }
  };

  const handleDragLeaveNote = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverNote(null);
  };

  const handleDropOnNote = (e: React.DragEvent, targetNoteId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedNote || draggedNote === targetNoteId) {
      setDraggedNote(null);
      setDragOverNote(null);
      return;
    }

    const draggedNoteObj = notes.find(n => n.id === draggedNote);
    const targetNoteObj = notes.find(n => n.id === targetNoteId);

    if (!draggedNoteObj || !targetNoteObj) return;

    // Move to same folder as target note
    const updatedNotes = notes.map(n => {
      if (n.id === draggedNote) {
        return { ...n, folderId: targetNoteObj.folderId };
      }
      return n;
    });

    // Get notes in the target folder (or root) for reordering
    const targetFolderId = targetNoteObj.folderId;
    const notesInTargetFolder = updatedNotes.filter(n => n.folderId === targetFolderId);

    // Find positions in the filtered list
    const draggedInFolder = notesInTargetFolder.find(n => n.id === draggedNote);
    const targetInFolder = notesInTargetFolder.find(n => n.id === targetNoteId);

    if (!draggedInFolder || !targetInFolder) {
      setNotes(updatedNotes);
      setDraggedNote(null);
      setDragOverNote(null);
      return;
    }

    // Reorder within the folder
    const draggedFolderIndex = notesInTargetFolder.indexOf(draggedInFolder);
    const targetFolderIndex = notesInTargetFolder.indexOf(targetInFolder);

    notesInTargetFolder.splice(draggedFolderIndex, 1);
    const newIndex = draggedFolderIndex < targetFolderIndex ? targetFolderIndex : targetFolderIndex;
    notesInTargetFolder.splice(newIndex, 0, draggedInFolder);

    // Update order values for notes in this folder
    notesInTargetFolder.forEach((note, index) => {
      const noteInFull = updatedNotes.find(n => n.id === note.id);
      if (noteInFull) noteInFull.order = index;
    });

    setNotes(updatedNotes);
    setDraggedNote(null);
    setDragOverNote(null);
  };

  return (
    <div className="flex h-screen bg-white text-slate-900 font-sans overflow-hidden">
      
      {/* Sidebar */}
      <aside 
        className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-slate-50 border-r border-slate-200 flex flex-col overflow-hidden shrink-0 relative z-10`}
      >
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-slate-700">
             <Network className="w-5 h-5 text-brand-600" />
             <span>NoteWeb</span>
          </div>
          <div className="flex gap-1">
            <button onClick={() => createFolder()} className="p-1.5 hover:bg-slate-200 rounded-md transition-colors text-slate-600" title="New Folder">
              <FolderIcon className="w-5 h-5" />
            </button>
            <button onClick={() => createNote()} className="p-1.5 hover:bg-slate-200 rounded-md transition-colors text-slate-600" title="New Note">
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4">
           <div className="relative">
             <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
             <input 
               type="text" 
               placeholder="Search notes..." 
               className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
             />
           </div>
        </div>

        <div
          className="flex-1 overflow-y-auto px-2 space-y-1 pb-4"
          onDragOver={handleDragOver}
          onDrop={handleDropOnRoot}
          onContextMenu={handleSidebarContextMenu}
        >
          {isLoading ? (
            // Skeleton Loaders
            <>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-full px-3 py-3 rounded-lg border border-transparent flex items-start gap-3 animate-pulse">
                  <div className="w-4 h-4 mt-1 shrink-0 bg-slate-200 rounded" />
                  <div className="overflow-hidden w-full space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 rounded w-full" />
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
              {/* Root notes (no folder) */}
              {filteredNotes.filter(n => !n.folderId).map(note => (
                <button
                  key={note.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, note.id)}
                  onDragOver={(e) => handleDragOverNote(e, note.id)}
                  onDragLeave={handleDragLeaveNote}
                  onDrop={(e) => handleDropOnNote(e, note.id)}
                  onClick={() => setActiveNoteId(note.id)}
                  onContextMenu={(e) => handleNoteContextMenu(e, note.id)}
                  className={`w-full text-left px-3 py-3 rounded-lg transition-colors group flex items-start gap-3 ${
                    dragOverNote === note.id
                      ? 'border-t-2 border-t-brand-500'
                      : activeNoteId === note.id
                      ? 'bg-white shadow-sm border border-slate-200'
                      : 'hover:bg-slate-100 border border-transparent'
                  } ${draggedNote === note.id ? 'opacity-50' : ''}`}
                >
                  <FileText className={`w-4 h-4 mt-1 shrink-0 ${activeNoteId === note.id ? 'text-brand-500' : 'text-slate-400'}`} />
                  <div className="overflow-hidden w-full">
                    <h3 className={`text-sm font-medium truncate ${activeNoteId === note.id ? 'text-slate-900' : 'text-slate-600'}`}>{note.title}</h3>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {note.content.slice(0, 40).replace(/[#*\[\]]/g, '') || 'No content'}
                    </p>
                  </div>
                </button>
              ))}

              {/* Folders */}
              {folders.map(folder => {
                const folderNotes = filteredNotes.filter(n => n.folderId === folder.id);
                const isCollapsed = collapsedFolders.has(folder.id);
                const isEditing = editingFolderId === folder.id;

                return (
                  <div key={folder.id} className="space-y-1">
                    {/* Folder Header */}
                    <div
                      className={`w-full px-2 py-2 rounded-lg transition-colors group flex items-center gap-2 ${
                        dragOverFolder === folder.id
                          ? 'bg-brand-100 border-2 border-brand-400'
                          : 'hover:bg-slate-100 border-2 border-transparent'
                      }`}
                      onDragOver={(e) => handleDragOverFolder(e, folder.id)}
                      onDragLeave={handleDragLeaveFolder}
                      onDrop={(e) => handleDropOnFolder(e, folder.id)}
                      onContextMenu={(e) => handleFolderContextMenu(e, folder.id)}
                    >
                      <button
                        onClick={() => toggleFolder(folder.id)}
                        className="p-0.5 hover:bg-slate-200 rounded transition-colors"
                      >
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                      </button>

                      {isCollapsed ? (
                        <FolderIcon className="w-4 h-4 text-slate-400 shrink-0" />
                      ) : (
                        <FolderOpen className="w-4 h-4 text-slate-400 shrink-0" />
                      )}

                      {isEditing ? (
                        <input
                          type="text"
                          value={editingFolderName}
                          onChange={(e) => setEditingFolderName(e.target.value)}
                          onBlur={finishRenamingFolder}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') finishRenamingFolder();
                            if (e.key === 'Escape') {
                              setEditingFolderId(null);
                              setEditingFolderName('');
                            }
                          }}
                          className="flex-1 px-2 py-0.5 text-sm bg-white border border-brand-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-500"
                          autoFocus
                        />
                      ) : (
                        <span className="flex-1 text-sm font-medium text-slate-600 truncate">
                          {folder.name} <span className="text-xs text-slate-400">({folderNotes.length})</span>
                        </span>
                      )}

                      <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                        <button
                          onClick={() => startRenamingFolder(folder)}
                          className="p-1 hover:bg-slate-200 rounded transition-colors"
                          title="Rename Folder"
                        >
                          <Edit2 className="w-3 h-3 text-slate-500" />
                        </button>
                        <button
                          onClick={() => deleteFolder(folder.id)}
                          className="p-1 hover:bg-red-100 rounded transition-colors"
                          title="Delete Folder"
                        >
                          <X className="w-3 h-3 text-red-500" />
                        </button>
                      </div>
                    </div>

                    {/* Folder Notes */}
                    {!isCollapsed && (
                      <div className="pl-6 space-y-1">
                        {folderNotes.map(note => (
                          <button
                            key={note.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, note.id)}
                            onDragOver={(e) => handleDragOverNote(e, note.id)}
                            onDragLeave={handleDragLeaveNote}
                            onDrop={(e) => handleDropOnNote(e, note.id)}
                            onClick={() => setActiveNoteId(note.id)}
                            onContextMenu={(e) => handleNoteContextMenu(e, note.id)}
                            className={`w-full text-left px-3 py-2 rounded-lg transition-colors group flex items-start gap-3 ${
                              dragOverNote === note.id
                                ? 'border-t-2 border-t-brand-500'
                                : activeNoteId === note.id
                                ? 'bg-white shadow-sm border border-slate-200'
                                : 'hover:bg-slate-100 border border-transparent'
                            } ${draggedNote === note.id ? 'opacity-50' : ''}`}
                          >
                            <FileText className={`w-4 h-4 mt-0.5 shrink-0 ${activeNoteId === note.id ? 'text-brand-500' : 'text-slate-400'}`} />
                            <div className="overflow-hidden w-full">
                              <h3 className={`text-sm font-medium truncate ${activeNoteId === note.id ? 'text-slate-900' : 'text-slate-600'}`}>{note.title}</h3>
                              <p className="text-xs text-slate-400 truncate mt-0.5">
                                {note.content.slice(0, 35).replace(/[#*\[\]]/g, '') || 'No content'}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-200 shrink-0">
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <Link
              to="/blog"
              className="flex items-center gap-1.5 hover:text-brand-600 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              Blog
            </Link>
            <Link
              to="/help"
              className="flex items-center gap-1.5 hover:text-brand-600 transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              Help
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-white relative">
        
        {/* Header */}
        <header className="h-14 border-b border-slate-100 flex items-center px-6 justify-between shrink-0 bg-white z-30 relative shadow-sm">
          <div className="flex items-center gap-4 flex-1">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-400 hover:text-slate-600">
               <Menu className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={activeNote?.title || ''}
              onChange={(e) => updateActiveNote({ title: e.target.value })}
              className="text-lg font-bold bg-transparent focus:outline-none text-slate-800 placeholder-slate-300 flex-1"
              placeholder="Note Title"
            />
            <button
              onClick={() => deleteNote(activeNoteId)}
              className="text-slate-400 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-lg"
              title="Delete Note"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-center gap-2">
             {/* Graph Toggle */}
             <button 
               onClick={() => setShowGraph(!showGraph)}
               className={`p-2 flex items-center gap-2 text-sm font-medium rounded-lg transition-colors ${showGraph ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:bg-slate-100'}`}
               title="Toggle Graph View"
             >
               {showGraph ? <PanelRightOpen className="w-4 h-4" /> : <PanelRightClose className="w-4 h-4" />}
               <span className="hidden md:inline">{showGraph ? 'Hide Graph' : 'View Graph'}</span>
             </button>

          </div>
        </header>

        {/* Main Pane: Split into Editor and Graph/Backlinks */}
        <div className="flex-1 flex overflow-hidden relative z-0">
          
          {/* Editor */}
          <div className="flex-1 flex flex-col relative overflow-hidden">
            {isLoading ? (
              // Skeleton Loader for Editor
              <div className="p-8 space-y-4 animate-pulse">
                <div className="h-8 bg-slate-200 rounded w-1/3" />
                <div className="space-y-3 mt-8">
                  <div className="h-4 bg-slate-200 rounded w-full" />
                  <div className="h-4 bg-slate-200 rounded w-5/6" />
                  <div className="h-4 bg-slate-200 rounded w-4/5" />
                  <div className="h-4 bg-slate-200 rounded w-full" />
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                </div>
              </div>
            ) : (
              <>
                {activeNote && activeNote.tags.length > 0 && (
                  <div className="px-8 pt-4 flex gap-2">
                    {activeNote.tags.map(t => (
                      <span key={t} className="text-xs px-2 py-1 bg-slate-100 text-slate-500 rounded-full flex items-center gap-1">
                        <Tags className="w-3 h-3" /> {t}
                      </span>
                    ))}
                  </div>
                )}

                {activeNote && (
                  <RichEditor
                    key={activeNote.id}
                    noteId={activeNote.id}
                    initialContent={activeNote.content}
                    availableNotes={notes}
                    onChange={(md) => updateActiveNote({ content: md })}
                    onLinkClick={handleLinkClick}
                    placeholder="Start typing... Use @ to link other notes."
                  />
                )}
              </>
            )}
          </div>

          {/* Right Panel: Graph / Backlinks */}
          {(showGraph || backlinks.length > 0) && (
             <div 
               className="border-l border-slate-200 bg-slate-50/50 flex flex-col overflow-hidden shrink-0 relative z-10 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)]"
               style={{ width: rightPanelWidth }}
             >
                {/* Resizer Handle */}
                <div 
                  className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-brand-400/50 active:bg-brand-500 transition-colors z-50"
                  onMouseDown={startResizing}
                />

                {showGraph && (
                  <div className="h-1/2 min-h-[300px] border-b border-slate-200 relative bg-slate-100">
                     <div className="absolute top-0 left-0 w-full flex justify-between items-center p-2 z-10 bg-slate-100/80 backdrop-blur-sm">
                         <div className="flex items-center gap-1">
                           <button
                             onClick={() => { setGraphMode('2D'); trackGraphModeChanged('2D'); }}
                             className={`px-2 py-0.5 text-xs font-medium rounded transition-colors ${
                               graphMode === '2D'
                                 ? 'bg-slate-700 text-white'
                                 : 'text-slate-500 hover:bg-slate-200'
                             }`}
                           >
                             2D
                           </button>
                           <button
                             onClick={() => { setGraphMode('3D'); trackGraphModeChanged('3D'); }}
                             className={`px-2 py-0.5 text-xs font-medium rounded transition-colors ${
                               graphMode === '3D'
                                 ? 'bg-slate-700 text-white'
                                 : 'text-slate-500 hover:bg-slate-200'
                             }`}
                           >
                             3D
                           </button>
                         </div>
                     </div>
                    {graphMode === '2D' ? (
                      <GraphView
                        data={graphData}
                        onNodeClick={handleNodeClick}
                        activeNodeId={activeNoteId}
                      />
                    ) : (
                      <GraphView3D
                        data={graphData}
                        onNodeClick={handleNodeClick}
                        activeNodeId={activeNoteId}
                      />
                    )}
                  </div>
                )}

                <div className="flex-1 overflow-y-auto p-4">
                   <div className="flex items-center gap-2 mb-3">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Linked From</h3>
                      <span className="text-xs bg-slate-200 text-slate-500 px-1.5 rounded-full">{backlinks.length}</span>
                   </div>
                   
                   {backlinks.length === 0 ? (
                     <p className="text-sm text-slate-400 italic">No backlinks found.</p>
                   ) : (
                     <div className="space-y-2">
                       {backlinks.map(bl => (
                         <button 
                           key={bl.id}
                           onClick={() => setActiveNoteId(bl.id)}
                           className="w-full text-left p-3 bg-white rounded border border-slate-200 hover:border-brand-300 hover:shadow-sm transition-all group"
                         >
                            <div className="flex items-center gap-2 mb-1">
                               <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-brand-500 transition-colors" />
                               <span className="text-sm font-medium text-slate-700 group-hover:text-brand-700 truncate">{bl.title}</span>
                            </div>
                            <div className="text-xs text-slate-400 pl-5 line-clamp-2">
                              {bl.content.replace(/[#*\[\]]/g, '')}
                            </div>
                         </button>
                       ))}
                     </div>
                   )}
                </div>
             </div>
          )}

        </div>
      </main>

      {/* Context Menu */}
      {contextMenu.visible && (
        <div
          data-context-menu
          className="fixed z-[100] bg-white rounded-lg shadow-xl border border-slate-200 py-1 min-w-[160px] animate-in fade-in zoom-in-95 duration-100"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.type === 'note' && contextMenu.noteId && (
            <>
              <button
                onClick={() => renameNote(contextMenu.noteId!)}
                className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2"
              >
                <Pencil className="w-4 h-4 text-slate-400" />
                Rename
              </button>
              <button
                onClick={() => duplicateNote(contextMenu.noteId!)}
                className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2"
              >
                <Copy className="w-4 h-4 text-slate-400" />
                Duplicate
              </button>
              {folders.length > 0 && (
                <div className="border-t border-slate-100 my-1">
                  <div className="px-3 py-1 text-xs text-slate-400 font-medium">Move to folder</div>
                  {notes.find(n => n.id === contextMenu.noteId)?.folderId && (
                    <button
                      onClick={() => {
                        moveNoteToFolder(contextMenu.noteId!, null);
                        closeContextMenu();
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4 text-slate-400" />
                      Root (No folder)
                    </button>
                  )}
                  {folders.map(folder => (
                    <button
                      key={folder.id}
                      onClick={() => {
                        moveNoteToFolder(contextMenu.noteId!, folder.id);
                        closeContextMenu();
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                    >
                      <FolderIcon className="w-4 h-4 text-slate-400" />
                      {folder.name}
                    </button>
                  ))}
                </div>
              )}
              <div className="border-t border-slate-100 my-1" />
              <button
                onClick={() => deleteNote(contextMenu.noteId!)}
                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </>
          )}
          {contextMenu.type === 'folder' && contextMenu.folderId && (
            <>
              <button
                onClick={() => {
                  const folder = folders.find(f => f.id === contextMenu.folderId);
                  if (folder) startRenamingFolder(folder);
                  closeContextMenu();
                }}
                className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2"
              >
                <Pencil className="w-4 h-4 text-slate-400" />
                Rename
              </button>
              <div className="border-t border-slate-100 my-1" />
              <button
                onClick={() => {
                  deleteFolder(contextMenu.folderId!);
                  closeContextMenu();
                }}
                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Folder
              </button>
            </>
          )}
          {contextMenu.type === 'sidebar' && (
            <>
              <button
                onClick={() => {
                  createNote();
                  closeContextMenu();
                }}
                className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2"
              >
                <Plus className="w-4 h-4 text-slate-400" />
                New Note
              </button>
              <button
                onClick={() => {
                  createFolder();
                  closeContextMenu();
                }}
                className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2"
              >
                <FolderIcon className="w-4 h-4 text-slate-400" />
                New Folder
              </button>
              {notes.length > 0 && (
                <>
                  <div className="border-t border-slate-100 my-1" />
                  <div className="px-3 py-1 text-xs text-slate-400 font-medium">
                    {notes.length} note{notes.length !== 1 ? 's' : ''} • {folders.length} folder{folders.length !== 1 ? 's' : ''}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.visible && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete Note</h3>
            <p className="text-slate-600 mb-6">
              Are you sure you want to delete "<span className="font-medium">{deleteConfirm.noteTitle}</span>"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDeleteNote}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteNote}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Folder Modal */}
      {showFolderModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm mx-4 w-full">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Create New Folder</h3>
            <input
              type="text"
              autoFocus
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateFolder();
                } else if (e.key === 'Escape') {
                  setShowFolderModal(false);
                }
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowFolderModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Note Modal */}
      {renameModal.visible && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm mx-4 w-full">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Rename Note</h3>
            <input
              type="text"
              autoFocus
              placeholder="Note title"
              value={renameInput}
              onChange={(e) => setRenameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  confirmRenameNote();
                } else if (e.key === 'Escape') {
                  cancelRenameNote();
                }
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelRenameNote}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmRenameNote}
                disabled={!renameInput.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Folder Confirmation Modal */}
      {deleteFolderConfirm.visible && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete Folder</h3>
            <p className="text-slate-600 mb-6">
              The folder "<span className="font-medium">{deleteFolderConfirm.folderName}</span>" contains {deleteFolderConfirm.noteCount} note{deleteFolderConfirm.noteCount !== 1 ? 's' : ''}. Deleting the folder will move them to root.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDeleteFolder}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteFolder}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Delete Folder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Linked Note Confirmation Modal */}
      {createLinkModal.visible && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Create Note</h3>
            <p className="text-slate-600 mb-6">
              Note "<span className="font-medium">{createLinkModal.title}</span>" does not exist. Would you like to create it?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelCreateLinkedNote}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmCreateLinkedNote}
                className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors"
              >
                Create Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<NotesApp />} />
        <Route path="/blog" element={<BlogList />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route path="/help" element={<HelpPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;