/**
 * Analytics Service for NoteWeb
 * Pushes custom events to Google Tag Manager dataLayer
 */

import { v4 as uuidv4 } from 'uuid';

// Extend window type for dataLayer
declare global {
  interface Window {
    dataLayer: any[];
  }
}

// ============ USER IDENTITY ============

const ANON_ID_KEY = 'noteweb_anon_id';
let currentUserId: string | null = null;

// Get or create anonymous ID (persists in localStorage)
export const getAnonId = (): string => {
  let anonId = localStorage.getItem(ANON_ID_KEY);
  if (!anonId) {
    anonId = uuidv4();
    localStorage.setItem(ANON_ID_KEY, anonId);
  }
  return anonId;
};

// Set user ID after signup/login (call this when user authenticates)
export const setUserId = (userId: string) => {
  currentUserId = userId;

  // Push user identification event to link anon_id with user_id
  pushEvent('user_identified', {
    user_id: userId,
    anon_id: getAnonId()
  });
};

// Clear user ID on logout
export const clearUserId = () => {
  currentUserId = null;
};

// Get current user context for all events
const getUserContext = () => {
  return {
    anon_id: getAnonId(),
    ...(currentUserId && { user_id: currentUserId })
  };
};

// Helper to push events to GTM (now includes user context)
const pushEvent = (eventName: string, params?: Record<string, any>) => {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: eventName,
    ...getUserContext(),
    ...params
  });
};

// ============ NOTE EVENTS ============

export const trackNoteCreated = () => {
  pushEvent('note_created');
};

export const trackNoteDeleted = () => {
  pushEvent('note_deleted');
};

export const trackNoteDuplicated = () => {
  pushEvent('note_duplicated');
};

export const trackNoteRenamed = () => {
  pushEvent('note_renamed');
};

// ============ LINK EVENTS ============

export const trackLinkCreated = (targetTitle: string) => {
  pushEvent('link_created', {
    link_target: targetTitle
  });
};

export const trackLinkClicked = (targetTitle: string) => {
  pushEvent('link_clicked', {
    link_target: targetTitle
  });
};

// ============ FOLDER EVENTS ============

export const trackFolderCreated = () => {
  pushEvent('folder_created');
};

export const trackFolderDeleted = () => {
  pushEvent('folder_deleted');
};

export const trackFolderRenamed = () => {
  pushEvent('folder_renamed');
};

export const trackNoteMoved = (toFolder: boolean) => {
  pushEvent('note_moved', {
    to_folder: toFolder
  });
};

// ============ GRAPH EVENTS ============

export const trackGraphViewed = (mode: '2D' | '3D') => {
  pushEvent('graph_viewed', {
    graph_mode: mode
  });
};

export const trackGraphNodeClicked = () => {
  pushEvent('graph_node_clicked');
};

export const trackGraphModeChanged = (mode: '2D' | '3D') => {
  pushEvent('graph_mode_changed', {
    graph_mode: mode
  });
};

// ============ EDITOR EVENTS ============

export const trackSlashCommandUsed = (command: string) => {
  pushEvent('slash_command_used', {
    command: command
  });
};

export const trackDateChipCreated = () => {
  pushEvent('date_chip_created');
};

// ============ ENGAGEMENT EVENTS ============

export const trackSessionStart = (noteCount: number, folderCount: number) => {
  pushEvent('session_start', {
    note_count: noteCount,
    folder_count: folderCount
  });
};

export const trackReturnVisitor = (noteCount: number) => {
  pushEvent('return_visitor', {
    note_count: noteCount
  });
};

// ============ CONVERSION EVENTS ============

export const trackSignupStarted = () => {
  pushEvent('signup_started');
};

export const trackSignupCompleted = (userId: string) => {
  // First set the user ID to link accounts
  setUserId(userId);

  pushEvent('signup_completed', {
    had_notes_before_signup: localStorage.getItem('noteweb_notes') !== null
  });
};

export const trackLogin = (userId: string) => {
  setUserId(userId);
  pushEvent('login');
};

export const trackLogout = () => {
  pushEvent('logout');
  clearUserId();
};

export const trackDataMigrated = (noteCount: number, folderCount: number) => {
  pushEvent('data_migrated', {
    note_count: noteCount,
    folder_count: folderCount
  });
};
