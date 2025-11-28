/**
 * Push Notification Service for NoteWeb
 * Handles browser push notifications for scheduled dates in notes
 */

import { Note } from '../types';
import { extractDates, ExtractedDate } from '../utils/markdownParser';

interface ScheduledNotification {
  noteId: string;
  noteTitle: string;
  date: Date;
  label: string;
  timeoutId?: ReturnType<typeof setTimeout>;
}

// Store for scheduled notifications
let scheduledNotifications: ScheduledNotification[] = [];

// Check if notifications are supported
export const isNotificationSupported = (): boolean => {
  return 'Notification' in window;
};

// Request notification permission
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!isNotificationSupported()) {
    console.warn('Notifications are not supported in this browser');
    return 'denied';
  }

  const permission = await Notification.requestPermission();
  return permission;
};

// Get current permission status
export const getNotificationPermission = (): NotificationPermission => {
  if (!isNotificationSupported()) {
    return 'denied';
  }
  return Notification.permission;
};

// Show a notification
const showNotification = (title: string, body: string, noteTitle: string): void => {
  if (getNotificationPermission() !== 'granted') {
    console.warn('Notification permission not granted');
    return;
  }

  // Use unique tag with timestamp so multiple notifications can show at once
  const uniqueTag = `noteweb-${noteTitle}-${Date.now()}`;

  const notification = new Notification(title, {
    body,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: uniqueTag,
    requireInteraction: true, // Keeps notification visible until user interacts
    silent: false, // Play sound
  });

  notification.onclick = () => {
    window.focus();
    notification.close();
  };
};

// Schedule a notification for a specific date
const scheduleNotification = (
  noteId: string,
  noteTitle: string,
  date: Date,
  label: string
): void => {
  const now = new Date();
  const timeUntilNotification = date.getTime() - now.getTime();

  // Don't schedule if the date is in the past
  if (timeUntilNotification <= 0) {
    return;
  }

  // Clear any existing notification for this note/date combination
  const existingIndex = scheduledNotifications.findIndex(
    (n) => n.noteId === noteId && n.date.getTime() === date.getTime()
  );
  if (existingIndex !== -1) {
    const existing = scheduledNotifications[existingIndex];
    if (existing.timeoutId) {
      clearTimeout(existing.timeoutId);
    }
    scheduledNotifications.splice(existingIndex, 1);
  }

  // Schedule the notification
  const timeoutId = setTimeout(() => {
    showNotification(
      `Reminder: ${noteTitle}`,
      `${label} - ${formatDateForDisplay(date)}`,
      noteTitle
    );

    // Remove from scheduled list after firing
    scheduledNotifications = scheduledNotifications.filter(
      (n) => !(n.noteId === noteId && n.date.getTime() === date.getTime())
    );
  }, timeUntilNotification);

  scheduledNotifications.push({
    noteId,
    noteTitle,
    date,
    label,
    timeoutId,
  });
};

// Format date for display in notification
const formatDateForDisplay = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  return date.toLocaleDateString('en-US', options);
};

// Process all notes and schedule notifications for dates
export const scheduleNotificationsForNotes = (notes: Note[]): void => {
  // Clear all existing scheduled notifications
  scheduledNotifications.forEach((notification) => {
    if (notification.timeoutId) {
      clearTimeout(notification.timeoutId);
    }
  });
  scheduledNotifications = [];

  // Don't schedule if permission not granted
  if (getNotificationPermission() !== 'granted') {
    return;
  }

  // Process each note
  notes.forEach((note) => {
    const dates = extractDates(note.content);
    dates.forEach((dateInfo: ExtractedDate) => {
      // Use the exact time from the date (already includes time set by user)
      const notificationDate = new Date(dateInfo.date);

      scheduleNotification(note.id, note.title, notificationDate, dateInfo.label);
    });
  });
};

// Cancel all scheduled notifications
export const cancelAllNotifications = (): void => {
  scheduledNotifications.forEach((notification) => {
    if (notification.timeoutId) {
      clearTimeout(notification.timeoutId);
    }
  });
  scheduledNotifications = [];
};

// Get count of scheduled notifications
export const getScheduledNotificationCount = (): number => {
  return scheduledNotifications.length;
};

// Send a test notification immediately
export const sendTestNotification = (): void => {
  if (getNotificationPermission() !== 'granted') {
    console.warn('Notification permission not granted');
    return;
  }

  showNotification(
    'Test Notification',
    'Push notifications are working! You will receive reminders at the scheduled times.',
    'test'
  );
};
