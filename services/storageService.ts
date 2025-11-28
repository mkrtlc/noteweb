import { Note, Folder } from "../types";

const NOTES_KEY = 'noteweb_notes';
const FOLDERS_KEY = 'noteweb_folders';

export const loadNotes = async (): Promise<Note[]> => {
  try {
    const stored = localStorage.getItem(NOTES_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  } catch (error) {
    console.error('Error loading notes:', error);
    return [];
  }
};

export const saveNotes = async (notes: Note[]): Promise<boolean> => {
  try {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
    return true;
  } catch (error) {
    console.error('Error saving notes:', error);
    return false;
  }
};

export const loadFolders = async (): Promise<Folder[]> => {
  try {
    const stored = localStorage.getItem(FOLDERS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  } catch (error) {
    console.error('Error loading folders:', error);
    return [];
  }
};

export const saveFolders = async (folders: Folder[]): Promise<boolean> => {
  try {
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
    return true;
  } catch (error) {
    console.error('Error saving folders:', error);
    return false;
  }
};
