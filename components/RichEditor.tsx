
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { markdownToHtml, htmlToMarkdown } from '../utils/markdownParser';
import { Note } from '../types';
import { Hash, FilePlus, Heading1, Heading2, Heading3, Bold, Italic, Code, List, ListOrdered, Quote, Minus, Calendar, Clock, GripVertical } from 'lucide-react';

interface RichEditorProps {
  initialContent: string;
  noteId: string; // Added to track note switching
  availableNotes: Note[];
  onChange: (markdown: string) => void;
  onLinkClick: (title: string) => void;
  placeholder?: string;
}

const RichEditor: React.FC<RichEditorProps> = ({ 
  initialContent, 
  noteId,
  availableNotes, 
  onChange, 
  onLinkClick,
  placeholder 
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLButtonElement>(null);
  const dragHandleContainerRef = useRef<HTMLDivElement>(null);
  const [showLinkMenu, setShowLinkMenu] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [showDateMenu, setShowDateMenu] = useState(false);
  const [linkSearch, setLinkSearch] = useState('');
  const [slashSearch, setSlashSearch] = useState('');
  const [dateSearch, setDateSearch] = useState('');
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [selectionRange, setSelectionRange] = useState<Range | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [editingDateChip, setEditingDateChip] = useState<HTMLElement | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('09:00'); // Default time for reminders

  // Drag & drop state
  const [draggedBlockIndex, setDraggedBlockIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [blocks, setBlocks] = useState<HTMLElement[]>([]);

  // Undo/Redo state (max 3 history items)
  const undoStack = useRef<string[]>([]);
  const redoStack = useRef<string[]>([]);
  const isUndoRedo = useRef(false);
  const MAX_UNDO_HISTORY = 3;

  // Generate date options (relative dates)
  const generateDateOptions = useCallback(() => {
    const options: { id: string; label: string; date: Date; formatted: string }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayDayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Today
    options.push({
      id: 'today',
      label: 'Today',
      date: new Date(today),
      formatted: formatDate(today)
    });

    // Tomorrow
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    options.push({
      id: 'tomorrow',
      label: 'Tomorrow',
      date: tomorrow,
      formatted: formatDate(tomorrow)
    });

    // Next 5 days (after tomorrow) - show day names
    // If a day is in next week (after Sunday), prefix with "Next"
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Calculate days until end of this week (Sunday)
    // If today is Friday (5), Sunday is in 2 days
    // If today is Saturday (6), Sunday is in 1 day
    // If today is Sunday (0), we're at end of week
    const daysUntilSunday = (7 - todayDayOfWeek) % 7;

    for (let i = 2; i <= 6; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dayName = dayNames[date.getDay()];

      // If this day is past Sunday (in next week), add "Next" prefix
      const isNextWeek = i > daysUntilSunday;
      const label = isNextWeek ? `Next ${dayName}` : dayName;

      options.push({
        id: `day-${i}`,
        label: label,
        date: date,
        formatted: formatDate(date)
      });
    }

    // In 2 weeks
    const twoWeeks = new Date(today);
    twoWeeks.setDate(twoWeeks.getDate() + 14);
    options.push({
      id: 'two-weeks',
      label: 'In 2 Weeks',
      date: twoWeeks,
      formatted: formatDate(twoWeeks)
    });

    // Next month
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    options.push({
      id: 'next-month',
      label: 'Next Month',
      date: nextMonth,
      formatted: formatDate(nextMonth)
    });

    // In 2 months
    const twoMonths = new Date(today);
    twoMonths.setMonth(twoMonths.getMonth() + 2);
    options.push({
      id: 'two-months',
      label: 'In 2 Months',
      date: twoMonths,
      formatted: formatDate(twoMonths)
    });

    return options;
  }, []);

  // Format date as DD.MM.YYYY
  const formatDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  // Format date with time as DD.MM.YYYY HH:MM
  const formatDateTime = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  };

  // Format time as HH:MM
  const formatTime = (date: Date): string => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Apply selected time to a date
  const applyTimeToDate = (date: Date, time: string): Date => {
    const newDate = new Date(date);
    const [hours, minutes] = time.split(':').map(Number);
    newDate.setHours(hours, minutes, 0, 0);
    return newDate;
  };

  // Parse date from DD.MM.YYYY or YYYY-MM-DD format
  const parseDate = (input: string): Date | null => {
    // Try DD.MM.YYYY format
    const dotMatch = input.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (dotMatch) {
      const [, day, month, year] = dotMatch;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date.getTime())) return date;
    }

    // Try YYYY-MM-DD format (from date input)
    const dashMatch = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dashMatch) {
      const [, year, month, day] = dashMatch;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date.getTime())) return date;
    }

    return null;
  };

  // Get label for a custom date
  const getLabelForDate = (date: Date): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const diffDays = Math.round((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 1 && diffDays <= 7) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return dayNames[targetDate.getDay()];
    }

    // For other dates, use a descriptive format
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[targetDate.getMonth()]} ${targetDate.getDate()}`;
  };

  const dateOptions = generateDateOptions();

  // Track the last content we sent to the parent to avoid self-update loops
  const lastEmittedMarkdown = useRef<string>(initialContent);

  // Auto-scroll selected item into view when navigating with arrow keys
  useEffect(() => {
    if (selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [selectedIndex]);

  // Slash command options with aliases for quick access
  const slashCommands = [
    { id: 'h1', label: 'Heading 1', icon: Heading1, format: '# ', description: 'Large heading', aliases: ['h1', 'header1', 'heading1'] },
    { id: 'h2', label: 'Heading 2', icon: Heading2, format: '## ', description: 'Medium heading', aliases: ['h2', 'header2', 'heading2'] },
    { id: 'h3', label: 'Heading 3', icon: Heading3, format: '### ', description: 'Small heading', aliases: ['h3', 'header3', 'heading3'] },
    { id: 'bold', label: 'Bold', icon: Bold, format: '**', suffix: '**', description: 'Bold text', aliases: ['b', 'bold', 'strong'] },
    { id: 'italic', label: 'Italic', icon: Italic, format: '*', suffix: '*', description: 'Italic text', aliases: ['i', 'italic', 'em'] },
    { id: 'code', label: 'Inline Code', icon: Code, format: '`', suffix: '`', description: 'Inline code', aliases: ['code', 'inline'] },
    { id: 'codeblock', label: 'Code Block', icon: Code, format: '```', suffix: '```', description: 'Code block', aliases: ['codeblock', 'cb', 'pre'] },
    { id: 'bullet', label: 'Bullet List', icon: List, format: '- ', description: 'Bullet list', aliases: ['bullet', 'ul', 'list', '-'] },
    { id: 'numbered', label: 'Numbered List', icon: ListOrdered, format: '1. ', description: 'Numbered list', aliases: ['numbered', 'ol', 'number', '1.'] },
    { id: 'quote', label: 'Quote', icon: Quote, format: '> ', description: 'Block quote', aliases: ['quote', 'blockquote', '>'] },
    { id: 'divider', label: 'Divider', icon: Minus, format: '---', description: 'Horizontal rule', aliases: ['divider', 'hr', 'line', '---'] },
  ];

  // Initialize or Switch Notes
  useEffect(() => {
    if (editorRef.current) {
      const html = markdownToHtml(initialContent);

      // Logic:
      // 1. If the Note ID changed, ALWAYS update the editor (switching notes).
      // 2. If Note ID is same, ONLY update if the content is different from what we last typed.
      //    This allows external updates (like AI or Search replace) to work,
      //    while ignoring updates triggered by our own typing (which avoids cursor jumps).

      if (noteId !== editorRef.current.dataset.noteId) {
         // Note switched, force update
         editorRef.current.innerHTML = html;
         editorRef.current.dataset.noteId = noteId;
         lastEmittedMarkdown.current = initialContent; // Sync tracker
      } else if (initialContent !== lastEmittedMarkdown.current) {
         // Content changed externally (e.g. AI appended text), so we must update DOM
         editorRef.current.innerHTML = html;
         lastEmittedMarkdown.current = initialContent; // Sync tracker
      }
      // Update blocks for drag handles
      updateBlocks();
    }
  }, [initialContent, noteId]);

  // Function to identify draggable blocks in the editor
  const getBlockElements = useCallback((): HTMLElement[] => {
    if (!editorRef.current) return [];

    const blockElements: HTMLElement[] = [];
    const childNodes = Array.from(editorRef.current.childNodes) as ChildNode[];

    childNodes.forEach((node: ChildNode) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const tagName = el.tagName;
        // Block elements that can be dragged
        if (['H1', 'H2', 'H3', 'BLOCKQUOTE', 'HR', 'CODE'].includes(tagName) ||
            el.classList.contains('bullet-item') ||
            el.classList.contains('numbered-item')) {
          blockElements.push(el);
        }
      }
    });

    return blockElements;
  }, []);

  // Update blocks state
  const updateBlocks = useCallback(() => {
    const newBlocks = getBlockElements();
    setBlocks(newBlocks);
  }, [getBlockElements]);

  // Drag handlers
  const handleDragStart = useCallback((index: number, e: React.DragEvent) => {
    setDraggedBlockIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));

    // Add dragging class
    const target = e.currentTarget as HTMLElement;
    setTimeout(() => target.classList.add('dragging'), 0);
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement;
    target.classList.remove('dragging');
    setDraggedBlockIndex(null);
    setDragOverIndex(null);

    // Remove all drag-over classes
    document.querySelectorAll('.drag-over, .drag-over-bottom').forEach(el => {
      el.classList.remove('drag-over', 'drag-over-bottom');
    });
  }, []);

  const handleDragOver = useCallback((index: number, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (draggedBlockIndex === null || draggedBlockIndex === index) return;

    setDragOverIndex(index);

    // Visual feedback
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;

    // Remove existing classes
    target.classList.remove('drag-over', 'drag-over-bottom');

    if (e.clientY < midY) {
      target.classList.add('drag-over');
    } else {
      target.classList.add('drag-over-bottom');
    }
  }, [draggedBlockIndex]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement;
    target.classList.remove('drag-over', 'drag-over-bottom');
  }, []);

  const handleDrop = useCallback((index: number, e: React.DragEvent) => {
    e.preventDefault();

    if (draggedBlockIndex === null || draggedBlockIndex === index || !editorRef.current) {
      return;
    }

    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const insertAfter = e.clientY >= midY;

    // Get all current child nodes
    const children = Array.from(editorRef.current.childNodes) as ChildNode[];
    const draggedNode = children[draggedBlockIndex];

    if (!draggedNode) return;

    // Remove the dragged node
    editorRef.current.removeChild(draggedNode);

    // Recalculate target index after removal
    const newChildren = Array.from(editorRef.current.childNodes) as ChildNode[];
    let targetIndex = index;
    if (draggedBlockIndex < index) {
      targetIndex = index - 1;
    }

    const targetNode = newChildren[targetIndex];

    if (targetNode) {
      if (insertAfter) {
        if (targetNode.nextSibling) {
          editorRef.current.insertBefore(draggedNode, targetNode.nextSibling);
        } else {
          editorRef.current.appendChild(draggedNode);
        }
      } else {
        editorRef.current.insertBefore(draggedNode, targetNode);
      }
    } else {
      editorRef.current.appendChild(draggedNode);
    }

    // Clean up classes
    target.classList.remove('drag-over', 'drag-over-bottom');
    setDraggedBlockIndex(null);
    setDragOverIndex(null);

    // Trigger save
    const html = editorRef.current.innerHTML;
    const markdown = htmlToMarkdown(html);
    lastEmittedMarkdown.current = markdown;
    onChange(markdown);

    // Update blocks
    updateBlocks();
  }, [draggedBlockIndex, onChange, updateBlocks]);

  // Save current state to undo stack
  const saveToUndoStack = useCallback(() => {
    if (!editorRef.current || isUndoRedo.current) return;

    const currentHtml = editorRef.current.innerHTML;

    // Don't save if it's the same as the last state
    if (undoStack.current.length > 0 && undoStack.current[undoStack.current.length - 1] === currentHtml) {
      return;
    }

    // Add to undo stack
    undoStack.current.push(currentHtml);

    // Limit undo stack size
    if (undoStack.current.length > MAX_UNDO_HISTORY) {
      undoStack.current.shift();
    }

    // Clear redo stack when new change is made
    redoStack.current = [];
  }, []);

  // Undo function
  const handleUndo = useCallback(() => {
    if (!editorRef.current || undoStack.current.length === 0) return;

    isUndoRedo.current = true;

    // Save current state to redo stack
    const currentHtml = editorRef.current.innerHTML;
    redoStack.current.push(currentHtml);

    // Limit redo stack size
    if (redoStack.current.length > MAX_UNDO_HISTORY) {
      redoStack.current.shift();
    }

    // Restore previous state
    const previousHtml = undoStack.current.pop()!;
    editorRef.current.innerHTML = previousHtml;

    // Update markdown
    const markdown = htmlToMarkdown(previousHtml);
    lastEmittedMarkdown.current = markdown;
    onChange(markdown);
    updateBlocks();

    isUndoRedo.current = false;
  }, [onChange, updateBlocks]);

  // Redo function
  const handleRedo = useCallback(() => {
    if (!editorRef.current || redoStack.current.length === 0) return;

    isUndoRedo.current = true;

    // Save current state to undo stack
    const currentHtml = editorRef.current.innerHTML;
    undoStack.current.push(currentHtml);

    // Limit undo stack size
    if (undoStack.current.length > MAX_UNDO_HISTORY) {
      undoStack.current.shift();
    }

    // Restore next state
    const nextHtml = redoStack.current.pop()!;
    editorRef.current.innerHTML = nextHtml;

    // Update markdown
    const markdown = htmlToMarkdown(nextHtml);
    lastEmittedMarkdown.current = markdown;
    onChange(markdown);
    updateBlocks();

    isUndoRedo.current = false;
  }, [onChange, updateBlocks]);

  const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    if (!editorRef.current) return;

    // Save to undo stack before processing the change
    saveToUndoStack();

    const html = editorRef.current.innerHTML;
    const markdown = htmlToMarkdown(html);

    // Update our tracker BEFORE notifying parent so useEffect knows this change came from us
    lastEmittedMarkdown.current = markdown;
    onChange(markdown);

    // Update blocks for drag handles
    updateBlocks();

    // Trigger detection logic for @mentions and /commands
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const textNode = range.startContainer;

      if (textNode.nodeType === Node.TEXT_NODE && textNode.textContent) {
        const textBefore = textNode.textContent.slice(0, range.startOffset);

        // Auto-convert "- " to bullet point
        // Check if we just typed "- " followed by any whitespace at the start of a line
        // Note: browsers may insert non-breaking space (char code 160) instead of regular space (32)
        const lastTwo = textBefore.slice(-2);
        const endsWithDashSpace = lastTwo.length === 2 &&
                                   lastTwo[0] === '-' &&
                                   (lastTwo[1] === ' ' || lastTwo.charCodeAt(1) === 160 || /\s/.test(lastTwo[1]));
        if (endsWithDashSpace) {
          // Check if this is at the start of the line
          // Get everything before the "- " and remove zero-width spaces
          const beforeDashSpace = textBefore.slice(0, -2);
          const cleanedBeforeDash = beforeDashSpace.replace(/[\u200B\u200C\u200D\uFEFF]/g, '');
          const isAtLineStart = beforeDashSpace.length === 0 ||
                                 beforeDashSpace.endsWith('\n') ||
                                 cleanedBeforeDash.trim() === '';

          if (isAtLineStart) {
            e.preventDefault?.();

            // Get the current text content
            const currentText = textNode.textContent || '';
            const offset = range.startOffset;
            // Clean any trailing content after cursor (remove zero-width spaces)
            const afterSpace = currentText.slice(offset).replace(/[\u200B\u200C\u200D\uFEFF]/g, '');

            // Create a bullet list item
            const listItem = document.createElement('li');
            listItem.className = 'bullet-item';

            // Put any text after the cursor into the list item
            const textInList = document.createTextNode(afterSpace || '\u200B'); // Zero-width space if empty
            listItem.appendChild(textInList);

            // Get parent of text node
            const parent = textNode.parentNode;

            // If we're at the start of the text node (just zero-width space + "- " or just "- ")
            if (cleanedBeforeDash.trim() === '') {
              // Replace the text node with the list item
              if (parent) {
                // Insert list item in place of the text node
                parent.insertBefore(listItem, textNode);
                // Remove the old text node entirely
                parent.removeChild(textNode);
              }
            } else {
              // There's real content before "- " (after a newline)
              // Keep content before, insert list item after
              textNode.textContent = beforeDashSpace;
              if (parent) {
                parent.insertBefore(listItem, textNode.nextSibling);
              }
            }

            // Move cursor inside the list item at the start
            const cursorRange = document.createRange();
            cursorRange.setStart(textInList, 0);
            cursorRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(cursorRange);

            // Trigger save
            setTimeout(() => {
              if (editorRef.current) {
                const newHtml = editorRef.current.innerHTML;
                const newMarkdown = htmlToMarkdown(newHtml);
                lastEmittedMarkdown.current = newMarkdown;
                onChange(newMarkdown);
              }
            }, 0);
            return;
          }
        }

        // Check if we just typed '/' at the start of a line
        if (textBefore.endsWith('/')) {
          // Only show slash menu if at the start of a line
          // Remove zero-width spaces and other invisible chars for the check
          const beforeSlash = textBefore.slice(0, -1);
          const cleanedBeforeSlash = beforeSlash.replace(/[\u200B\u200C\u200D\uFEFF]/g, '');
          const isAtLineStart = textBefore.length === 1 ||
                                 beforeSlash.endsWith('\n') ||
                                 cleanedBeforeSlash.trim() === '';

          if (isAtLineStart) {
            const rect = range.getBoundingClientRect();
            const editorRect = editorRef.current.getBoundingClientRect();
            setMenuPos({
              top: rect.bottom - editorRect.top + 24 + editorRef.current.scrollTop,
              left: rect.left - editorRect.left
            });
            setSelectionRange(range.cloneRange());
            setShowSlashMenu(true);
            setSlashSearch('');
            setSelectedIndex(0);
          }
        }
        // Check if we just typed '@@' for date picker
        else if (textBefore.endsWith('@@')) {
           const rect = range.getBoundingClientRect();
           const editorRect = editorRef.current.getBoundingClientRect();
           setMenuPos({
             top: rect.bottom - editorRect.top + 24 + editorRef.current.scrollTop,
             left: rect.left - editorRect.left
           });
           setSelectionRange(range.cloneRange());
           setShowDateMenu(true);
           setDateSearch('');
           setSelectedIndex(0);
           // Close link menu if open
           setShowLinkMenu(false);
        }
        // Check if we just typed '@' (but not '@@')
        else if (textBefore.endsWith('@') && !textBefore.endsWith('@@')) {
           const rect = range.getBoundingClientRect();
           const editorRect = editorRef.current.getBoundingClientRect();
           setMenuPos({
             top: rect.bottom - editorRect.top + 24 + editorRef.current.scrollTop,
             left: rect.left - editorRect.left
           });
           setSelectionRange(range.cloneRange());
           setShowLinkMenu(true);
           setLinkSearch('');
           setSelectedIndex(0);
        }
      }
    }
  }, [onChange]);

  const handleSlashCommand = (command: typeof slashCommands[0]) => {
    if (!selectionRange || !editorRef.current) return;

    // Restore selection
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(selectionRange);

      const textNode = selectionRange.startContainer;
      if (textNode.nodeType === Node.TEXT_NODE && textNode.textContent) {
         const currentText = textNode.textContent;
         const offset = selectionRange.startOffset;

         // Remove the '/' trigger character
         if (currentText[offset - 1] === '/') {
             textNode.textContent = currentText.slice(0, offset - 1) + currentText.slice(offset);
             selectionRange.setStart(textNode, offset - 1);
             selectionRange.setEnd(textNode, offset - 1);
         }
      }

      // Handle different command types
      let element: HTMLElement | null = null;

      // Block-level elements - insert actual HTML elements
      if (command.id === 'h1') {
        element = document.createElement('h1');
        element.textContent = 'Heading 1';
      } else if (command.id === 'h2') {
        element = document.createElement('h2');
        element.textContent = 'Heading 2';
      } else if (command.id === 'h3') {
        element = document.createElement('h3');
        element.textContent = 'Heading 3';
      } else if (command.id === 'bullet') {
        element = document.createElement('li');
        element.className = 'bullet-item';
        element.textContent = 'List item';
      } else if (command.id === 'numbered') {
        element = document.createElement('li');
        element.className = 'numbered-item';
        element.textContent = 'List item';
      } else if (command.id === 'quote') {
        element = document.createElement('blockquote');
        element.textContent = 'Quote';
      } else if (command.id === 'divider') {
        element = document.createElement('hr');
      } else if (command.id === 'codeblock') {
        element = document.createElement('code');
        element.className = 'code-block';
        element.textContent = 'code';
      }

      // If we created a block element, insert it
      if (element) {
        // Insert the element
        selectionRange.insertNode(element);

        // For divider, add a line break after
        if (command.id === 'divider') {
          const br = document.createElement('br');
          selectionRange.setStartAfter(element);
          selectionRange.insertNode(br);
          selectionRange.setStartAfter(br);
          selectionRange.collapse(true);
        } else {
          // Select the text inside the element so user can start typing
          const newRange = document.createRange();
          newRange.selectNodeContents(element);
          selection.removeAllRanges();
          selection.addRange(newRange);
        }

        // Trigger save
        handleInput({} as any);
      }
      // Inline elements - insert HTML elements for immediate formatting
      else if (command.suffix) {
        let inlineElement: HTMLElement | null = null;

        if (command.id === 'bold') {
          inlineElement = document.createElement('b');
          inlineElement.textContent = 'text';
        } else if (command.id === 'italic') {
          inlineElement = document.createElement('i');
          inlineElement.textContent = 'text';
        } else if (command.id === 'code') {
          inlineElement = document.createElement('code');
          inlineElement.textContent = 'code';
        } else if (command.id === 'codeblock') {
          // Code block is handled above, but just in case
          inlineElement = document.createElement('code');
          inlineElement.className = 'code-block';
          inlineElement.textContent = 'code';
        }

        if (inlineElement) {
          selectionRange.insertNode(inlineElement);

          // Select the text inside so user can start typing
          const newRange = document.createRange();
          newRange.selectNodeContents(inlineElement);
          selection.removeAllRanges();
          selection.addRange(newRange);

          // Trigger save
          handleInput({} as any);
        }
      }
    }

    setShowSlashMenu(false);
    editorRef.current.focus();
  };

  const handleLinkSelect = (targetTitle: string) => {
    if (!selectionRange || !editorRef.current) return;

    // Restore selection
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(selectionRange);

      const textNode = selectionRange.startContainer;
      if (textNode.nodeType === Node.TEXT_NODE && textNode.textContent) {
         const currentText = textNode.textContent;
         const offset = selectionRange.startOffset;

         // Remove the '@' trigger character
         if (currentText[offset - 1] === '@') {
             textNode.textContent = currentText.slice(0, offset - 1) + currentText.slice(offset);
             selectionRange.setStart(textNode, offset - 1);
             selectionRange.setEnd(textNode, offset - 1);
         }
      }

      // Create the link chip
      const span = document.createElement('span');
      span.className = 'link-chip';
      span.contentEditable = 'false';
      span.dataset.link = targetTitle;
      span.textContent = targetTitle;

      selectionRange.deleteContents();
      selectionRange.insertNode(span);

      // Move cursor after span and add space
      selectionRange.setStartAfter(span);
      selectionRange.setEndAfter(span);
      const space = document.createTextNode('\u00A0'); // Non-breaking space
      selectionRange.insertNode(space);
      selectionRange.setStartAfter(space);
      selectionRange.setEndAfter(space);

      selection.removeAllRanges();
      selection.addRange(selectionRange);

      // Trigger save
      handleInput({} as any);
    }

    setShowLinkMenu(false);
    editorRef.current.focus();
  };

  const handleDateSelect = (option: { id: string; label: string; date: Date; formatted: string }, withTime: boolean = true) => {
    if (!editorRef.current) return;

    // Apply selected time to the date
    const dateWithTime = withTime ? applyTimeToDate(option.date, selectedTime) : option.date;
    const formattedWithTime = formatDateTime(dateWithTime);

    // If editing an existing date chip, replace it
    if (editingDateChip) {
      editingDateChip.dataset.date = dateWithTime.toISOString();
      editingDateChip.textContent = `📅 ${option.label} (${formattedWithTime})`;

      // Trigger save
      handleInput({} as any);

      setShowDateMenu(false);
      setEditingDateChip(null);
      editorRef.current.focus();
      return;
    }

    // Creating new date chip
    if (!selectionRange) return;

    // Restore selection
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(selectionRange);

      const textNode = selectionRange.startContainer;
      if (textNode.nodeType === Node.TEXT_NODE && textNode.textContent) {
         const currentText = textNode.textContent;
         const offset = selectionRange.startOffset;

         // Remove the '@@' trigger characters
         if (currentText.slice(offset - 2, offset) === '@@') {
             textNode.textContent = currentText.slice(0, offset - 2) + currentText.slice(offset);
             selectionRange.setStart(textNode, offset - 2);
             selectionRange.setEnd(textNode, offset - 2);
         }
      }

      // Create the date chip
      const span = document.createElement('span');
      span.className = 'date-chip';
      span.contentEditable = 'false';
      span.dataset.date = dateWithTime.toISOString();
      span.textContent = `📅 ${option.label} (${formattedWithTime})`;

      selectionRange.deleteContents();
      selectionRange.insertNode(span);

      // Move cursor after span and add space
      selectionRange.setStartAfter(span);
      selectionRange.setEndAfter(span);
      const space = document.createTextNode('\u00A0'); // Non-breaking space
      selectionRange.insertNode(space);
      selectionRange.setStartAfter(space);
      selectionRange.setEndAfter(space);

      selection.removeAllRanges();
      selection.addRange(selectionRange);

      // Trigger save
      handleInput({} as any);
    }

    setShowDateMenu(false);
    setEditingDateChip(null);
    editorRef.current.focus();
  };

  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('link-chip')) {
      const title = target.dataset.link;
      if (title) onLinkClick(title);
    }
    // Handle date chip click - open date picker to change the date
    if (target.classList.contains('date-chip')) {
      e.preventDefault();
      e.stopPropagation();

      const rect = target.getBoundingClientRect();
      const editorRect = editorRef.current?.getBoundingClientRect();
      if (editorRect) {
        setMenuPos({
          top: rect.bottom - editorRect.top + 8 + (editorRef.current?.scrollTop || 0),
          left: rect.left - editorRect.left
        });
        setEditingDateChip(target);
        setShowDateMenu(true);
        setDateSearch('');
        setSelectedIndex(0);
        return;
      }
    }
    // Hide menus on click elsewhere
    setShowLinkMenu(false);
    setShowSlashMenu(false);
    setShowDateMenu(false);
    setEditingDateChip(null);
  };

  // Filter logic for link menu
  const filteredNotes = availableNotes.filter(n =>
    n.title.toLowerCase().includes(linkSearch.toLowerCase())
  );

  // Combined list for navigation (existing notes + create option)
  const showCreateOption = linkSearch.trim().length > 0 && !filteredNotes.find(n => n.title.toLowerCase() === linkSearch.toLowerCase());
  const linkMenuOptions = [
    ...filteredNotes,
    ...(showCreateOption ? [{ id: 'create-new', title: linkSearch, isCreate: true }] : [])
  ];

  // Filter logic for slash menu (includes aliases)
  const filteredCommands = slashCommands.filter(cmd => {
    const search = slashSearch.toLowerCase();
    return cmd.label.toLowerCase().includes(search) ||
           cmd.description.toLowerCase().includes(search) ||
           cmd.aliases.some(alias => alias.toLowerCase().startsWith(search));
  });

  // Filter logic for date menu
  const filteredDates = dateOptions.filter(opt =>
    opt.label.toLowerCase().includes(dateSearch.toLowerCase()) ||
    opt.formatted.includes(dateSearch)
  );

  // Handle Keyboard Navigation for Menus
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle backspace to delete date chips and link chips
    if (e.key === 'Backspace' && !showSlashMenu && !showLinkMenu && !showDateMenu) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);

        // Check if cursor is right after a chip (date or link)
        if (range.collapsed && range.startOffset === 0) {
          // Cursor at start of a text node, check previous sibling
          const prevSibling = range.startContainer.previousSibling;
          if (prevSibling && prevSibling.nodeType === Node.ELEMENT_NODE) {
            const prevElement = prevSibling as HTMLElement;
            if (prevElement.classList.contains('date-chip') || prevElement.classList.contains('link-chip')) {
              e.preventDefault();
              prevElement.remove();
              handleInput({} as any);
              return;
            }
          }
        } else if (range.collapsed && range.startContainer.nodeType === Node.TEXT_NODE) {
          // Check if previous character position has a chip
          const textNode = range.startContainer as Text;
          const offset = range.startOffset;

          if (offset === 0) {
            const prevSibling = textNode.previousSibling;
            if (prevSibling && prevSibling.nodeType === Node.ELEMENT_NODE) {
              const prevElement = prevSibling as HTMLElement;
              if (prevElement.classList.contains('date-chip') || prevElement.classList.contains('link-chip')) {
                e.preventDefault();
                prevElement.remove();
                handleInput({} as any);
                return;
              }
            }
          }
        } else if (range.collapsed) {
          // Cursor might be directly after a chip element
          const container = range.startContainer;
          if (container.nodeType === Node.ELEMENT_NODE) {
            const element = container as HTMLElement;
            const offset = range.startOffset;
            if (offset > 0) {
              const prevChild = element.childNodes[offset - 1];
              if (prevChild && prevChild.nodeType === Node.ELEMENT_NODE) {
                const prevElement = prevChild as HTMLElement;
                if (prevElement.classList.contains('date-chip') || prevElement.classList.contains('link-chip')) {
                  e.preventDefault();
                  prevElement.remove();
                  handleInput({} as any);
                  return;
                }
              }
            }
          }
        }
      }
    }

    // Keyboard shortcuts (Cmd/Ctrl + B, I, Z, etc.)
    if ((e.metaKey || e.ctrlKey) && !showSlashMenu && !showLinkMenu && !showDateMenu) {
      // Undo: Cmd/Ctrl + Z
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }
      // Redo: Cmd/Ctrl + Shift + Z or Cmd/Ctrl + Y
      if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
        e.preventDefault();
        handleRedo();
        return;
      }
      if (e.key === 'b') {
        e.preventDefault();
        saveToUndoStack();
        document.execCommand('bold');
        handleInput({} as any);
        return;
      }
      if (e.key === 'i') {
        e.preventDefault();
        saveToUndoStack();
        document.execCommand('italic');
        handleInput({} as any);
        return;
      }
      if (e.key === 'u') {
        e.preventDefault();
        saveToUndoStack();
        document.execCommand('underline');
        handleInput({} as any);
        return;
      }
      // Cmd/Ctrl + K: Open link menu
      if (e.key === 'k') {
        e.preventDefault();
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0 && editorRef.current) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          const editorRect = editorRef.current.getBoundingClientRect();
          setMenuPos({
            top: rect.bottom - editorRect.top + 8 + editorRef.current.scrollTop,
            left: rect.left - editorRect.left
          });
          setSelectionRange(range.cloneRange());
          setShowLinkMenu(true);
          setLinkSearch('');
          setSelectedIndex(0);
        }
        return;
      }
    }

    // Handle Enter key to exit block elements (headings, lists, quotes, code blocks)
    if (e.key === 'Enter' && !showSlashMenu && !showLinkMenu && !showDateMenu) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const node = range.startContainer;

        // Check if we're in a heading, blockquote, or code block
        let blockElement = node.nodeType === Node.ELEMENT_NODE ? node as HTMLElement : node.parentElement;
        while (blockElement && blockElement !== editorRef.current) {
          const tagName = blockElement.tagName;

          // Handle headings - always exit to paragraph on Enter
          if (tagName === 'H1' || tagName === 'H2' || tagName === 'H3') {
            e.preventDefault();

            // Create a text node for the new line (just empty text, cursor will go here)
            const textNode = document.createTextNode('\u200B'); // Zero-width space as placeholder

            // Insert after the heading
            if (blockElement.nextSibling) {
              blockElement.parentNode?.insertBefore(textNode, blockElement.nextSibling);
            } else {
              blockElement.parentNode?.appendChild(textNode);
            }

            // Move cursor to the new text node
            const newRange = document.createRange();
            newRange.setStart(textNode, 1);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);

            handleInput({} as any);
            return;
          }

          // Handle blockquote - exit on Enter when empty or at end
          if (tagName === 'BLOCKQUOTE') {
            const text = blockElement.textContent?.trim() || '';
            if (text === '' || text === 'Quote') {
              e.preventDefault();

              const br = document.createElement('br');
              blockElement.parentNode?.insertBefore(br, blockElement.nextSibling);
              blockElement.remove();

              const textNode = document.createTextNode('\u200B');
              br.parentNode?.insertBefore(textNode, br.nextSibling);

              const newRange = document.createRange();
              newRange.setStart(textNode, 0);
              newRange.collapse(true);
              selection.removeAllRanges();
              selection.addRange(newRange);

              handleInput({} as any);
              return;
            }
          }

          // Handle code block - exit on Enter when empty
          if (tagName === 'CODE' && blockElement.classList.contains('code-block')) {
            const text = blockElement.textContent?.trim() || '';
            if (text === '' || text === 'code') {
              e.preventDefault();

              const br = document.createElement('br');
              blockElement.parentNode?.insertBefore(br, blockElement.nextSibling);
              blockElement.remove();

              const textNode = document.createTextNode('\u200B');
              br.parentNode?.insertBefore(textNode, br.nextSibling);

              const newRange = document.createRange();
              newRange.setStart(textNode, 0);
              newRange.collapse(true);
              selection.removeAllRanges();
              selection.addRange(newRange);

              handleInput({} as any);
              return;
            }
          }

          blockElement = blockElement.parentElement;
        }

        // Check if we're in a list item
        let listItem = node.nodeType === Node.ELEMENT_NODE ? node as HTMLElement : node.parentElement;
        while (listItem && !listItem.classList.contains('bullet-item') && !listItem.classList.contains('numbered-item')) {
          listItem = listItem.parentElement;
        }

        // If we're in a list item
        if (listItem && (listItem.classList.contains('bullet-item') || listItem.classList.contains('numbered-item'))) {
          // Get text content, removing zero-width spaces
          const rawText = listItem.textContent || '';
          const cleanedText = rawText.replace(/[\u200B\u200C\u200D\uFEFF]/g, '').trim();

          // If list item is empty (or just has placeholder text), exit the list
          if (cleanedText === '' || cleanedText === 'List item') {
            e.preventDefault();

            // Remove the empty list item
            const parent = listItem.parentElement;
            const nextSibling = listItem.nextSibling;
            listItem.remove();

            // Create a text node for normal text
            if (parent && editorRef.current) {
              const textNode = document.createTextNode('\u200B');

              // Insert at the position where list item was
              if (nextSibling) {
                parent.insertBefore(textNode, nextSibling);
              } else {
                parent.appendChild(textNode);
              }

              // Move cursor to the text node
              const newRange = document.createRange();
              newRange.setStart(textNode, 1);
              newRange.collapse(true);
              selection.removeAllRanges();
              selection.addRange(newRange);

              handleInput({} as any);
            }
            return;
          }

          // List item has content - create a new bullet item on Enter
          e.preventDefault();

          const isBullet = listItem.classList.contains('bullet-item');
          const newListItem = document.createElement('li');
          newListItem.className = isBullet ? 'bullet-item' : 'numbered-item';

          // Add zero-width space for cursor positioning
          const textInNewItem = document.createTextNode('\u200B');
          newListItem.appendChild(textInNewItem);

          // Insert after current list item
          if (listItem.nextSibling) {
            listItem.parentNode?.insertBefore(newListItem, listItem.nextSibling);
          } else {
            listItem.parentNode?.appendChild(newListItem);
          }

          // Move cursor to new list item
          const newRange = document.createRange();
          newRange.setStart(textInNewItem, 1);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);

          handleInput({} as any);
          return;
        }
      }
    }

    if (showSlashMenu) {
       if (e.key === 'Escape') {
         e.preventDefault();
         setShowSlashMenu(false);
         // Restore cursor position
         if (editorRef.current && selectionRange) {
           editorRef.current.focus();
           const selection = window.getSelection();
           if (selection) {
             selection.removeAllRanges();
             selection.addRange(selectionRange);
           }
         }
         return;
       }
       // Backspace when search is empty - close menu and delete the slash
       if (e.key === 'Backspace' && slashSearch === '') {
         e.preventDefault();
         setShowSlashMenu(false);
         // Restore cursor and delete the '/'
         if (editorRef.current && selectionRange) {
           editorRef.current.focus();
           const selection = window.getSelection();
           if (selection) {
             selection.removeAllRanges();
             selection.addRange(selectionRange);
             // Delete the '/' character before cursor
             document.execCommand('delete', false);
             handleInput({} as any);
           }
         }
         return;
       }
       if (e.key === 'ArrowDown') {
         e.preventDefault();
         setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
         return;
       }
       if (e.key === 'ArrowUp') {
         e.preventDefault();
         setSelectedIndex(prev => Math.max(prev - 1, 0));
         return;
       }
       if (e.key === 'Enter') {
         e.preventDefault();
         const selected = filteredCommands[selectedIndex];
         if (selected) {
            handleSlashCommand(selected);
         }
         return;
       }
    }

    if (showLinkMenu) {
       if (e.key === 'Escape') {
         e.preventDefault();
         setShowLinkMenu(false);
         // Restore cursor position
         if (editorRef.current && selectionRange) {
           editorRef.current.focus();
           const selection = window.getSelection();
           if (selection) {
             selection.removeAllRanges();
             selection.addRange(selectionRange);
           }
         }
         return;
       }
       if (e.key === 'ArrowDown') {
         e.preventDefault();
         setSelectedIndex(prev => Math.min(prev + 1, linkMenuOptions.length - 1));
         return;
       }
       if (e.key === 'ArrowUp') {
         e.preventDefault();
         setSelectedIndex(prev => Math.max(prev - 1, 0));
         return;
       }
       if (e.key === 'Enter') {
         e.preventDefault();
         const selected = linkMenuOptions[selectedIndex];
         if (selected) {
            handleLinkSelect(selected.title);
         }
         return;
       }
    }

    if (showDateMenu) {
       if (e.key === 'Escape') {
         e.preventDefault();
         setShowDateMenu(false);
         // Restore cursor position
         if (editorRef.current && selectionRange) {
           editorRef.current.focus();
           const selection = window.getSelection();
           if (selection) {
             selection.removeAllRanges();
             selection.addRange(selectionRange);
           }
         }
         return;
       }
       if (e.key === 'ArrowDown') {
         e.preventDefault();
         setSelectedIndex(prev => Math.min(prev + 1, filteredDates.length - 1));
         return;
       }
       if (e.key === 'ArrowUp') {
         e.preventDefault();
         setSelectedIndex(prev => Math.max(prev - 1, 0));
         return;
       }
       if (e.key === 'Enter') {
         e.preventDefault();
         const selected = filteredDates[selectedIndex];
         if (selected) {
            handleDateSelect(selected);
         }
         return;
       }
    }
  };

  // Calculate drag handle positions based on block elements
  const [dragHandlePositions, setDragHandlePositions] = useState<{top: number, height: number, index: number}[]>([]);

  // Update drag handle positions when blocks change
  useEffect(() => {
    if (!editorRef.current) return;

    const updatePositions = () => {
      const editorRect = editorRef.current?.getBoundingClientRect();
      if (!editorRect) return;

      const positions: {top: number, height: number, index: number}[] = [];
      const children = Array.from(editorRef.current?.childNodes || []) as ChildNode[];

      children.forEach((node: ChildNode, index: number) => {
        // Handle element nodes (block elements like h1, li, etc.)
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement;
          const tagName = el.tagName;

          // Skip BR tags - they're just line breaks, not draggable content
          if (tagName === 'BR') return;

          const rect = el.getBoundingClientRect();
          // Only add if the element has some height (is visible)
          if (rect.height > 0) {
            positions.push({
              top: rect.top - editorRect.top + (editorRef.current?.scrollTop || 0),
              height: rect.height,
              index
            });
          }
        }
        // Handle text nodes (plain text paragraphs)
        else if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent?.replace(/[\u200B\u200C\u200D\uFEFF]/g, '').trim();
          if (text && text.length > 0) {
            // Create a range to get the bounding rect of the text node
            const range = document.createRange();
            range.selectNodeContents(node);
            const rect = range.getBoundingClientRect();
            if (rect.height > 0) {
              positions.push({
                top: rect.top - editorRect.top + (editorRef.current?.scrollTop || 0),
                height: rect.height,
                index
              });
            }
          }
        }
      });

      setDragHandlePositions(positions);
    };

    // Small delay to ensure DOM is rendered
    const timeoutId = setTimeout(updatePositions, 100);

    // Also update on scroll
    const editor = editorRef.current;
    editor?.addEventListener('scroll', updatePositions);

    return () => {
      clearTimeout(timeoutId);
      editor?.removeEventListener('scroll', updatePositions);
    };
  }, [blocks, initialContent]);

  // State for hovering near a block to show its drag handle
  const [hoveredBlockIndex, setHoveredBlockIndex] = useState<number | null>(null);

  // Handle mouse move to detect which block is being hovered
  const handleEditorMouseMove = useCallback((e: React.MouseEvent) => {
    if (!editorRef.current || dragHandlePositions.length === 0) return;

    const editorRect = editorRef.current.getBoundingClientRect();
    const mouseY = e.clientY - editorRect.top + editorRef.current.scrollTop;
    const mouseX = e.clientX - editorRect.left;

    // Only show drag handle when mouse is near the left edge (first 60px)
    if (mouseX > 60) {
      setHoveredBlockIndex(null);
      return;
    }

    // Find which block the mouse is over
    for (const pos of dragHandlePositions) {
      if (mouseY >= pos.top && mouseY <= pos.top + pos.height) {
        setHoveredBlockIndex(pos.index);
        return;
      }
    }
    setHoveredBlockIndex(null);
  }, [dragHandlePositions]);

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden" onMouseMove={handleEditorMouseMove} onMouseLeave={() => setHoveredBlockIndex(null)}>
      <div className="relative w-full h-full flex">
        {/* Drag handles column */}
        <div
          ref={dragHandleContainerRef}
          className="relative w-8 flex-shrink-0"
        >
          {dragHandlePositions.map(({ top, height, index }) => (
            <div
              key={index}
              className="absolute left-1"
              style={{
                top, // Position directly aligned with the block
                height,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <div
                draggable
                className={`drag-handle cursor-grab active:cursor-grabbing p-1 rounded transition-opacity ${
                  hoveredBlockIndex === index ? 'opacity-100' : 'opacity-0'
                }`}
                onDragStart={(e) => {
                  setDraggedBlockIndex(index);
                  e.dataTransfer.effectAllowed = 'move';
                  e.dataTransfer.setData('text/plain', String(index));

                  // Add dragging class to the element
                  if (editorRef.current) {
                    const children = Array.from(editorRef.current.childNodes) as ChildNode[];
                    const draggedEl = children[index] as HTMLElement;
                    if (draggedEl) {
                      draggedEl.classList.add('dragging');
                    }
                  }
                }}
                onDragEnd={() => {
                  // Remove dragging class from all elements
                  if (editorRef.current) {
                    editorRef.current.querySelectorAll('.dragging').forEach(el => {
                      el.classList.remove('dragging');
                    });
                  }
                  setDraggedBlockIndex(null);
                  setDragOverIndex(null);
                }}
              >
                <GripVertical className="w-4 h-4 text-slate-400 hover:text-slate-600" />
              </div>
            </div>
          ))}
        </div>

        {/* Editor content */}
        <div
          ref={editorRef}
          className="editor-content flex-1 h-full p-8 pl-4 outline-none text-lg leading-relaxed resize-none overflow-auto no-scrollbar"
          contentEditable
          onInput={handleInput}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
        onDragOver={(e) => {
          e.preventDefault();
          if (draggedBlockIndex === null || !editorRef.current) return;

          const editorRect = editorRef.current.getBoundingClientRect();
          const children = Array.from(editorRef.current.childNodes) as ChildNode[];

          // Find which block we're over
          for (let i = 0; i < children.length; i++) {
            const node = children[i];
            if ((node as ChildNode).nodeType === Node.ELEMENT_NODE) {
              const el = node as HTMLElement;
              const rect = el.getBoundingClientRect();
              if (e.clientY >= rect.top && e.clientY <= rect.bottom) {
                if (i !== draggedBlockIndex) {
                  setDragOverIndex(i);
                  // Add visual indicator
                  const midY = rect.top + rect.height / 2;
                  el.classList.remove('drag-over', 'drag-over-bottom');
                  if (e.clientY < midY) {
                    el.classList.add('drag-over');
                  } else {
                    el.classList.add('drag-over-bottom');
                  }
                }
                break;
              }
            }
          }
        }}
        onDragLeave={() => {
          // Remove all drag indicators
          if (editorRef.current) {
            editorRef.current.querySelectorAll('.drag-over, .drag-over-bottom').forEach(el => {
              el.classList.remove('drag-over', 'drag-over-bottom');
            });
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          if (draggedBlockIndex === null || dragOverIndex === null || !editorRef.current) return;
          if (draggedBlockIndex === dragOverIndex) return;

          const children = Array.from(editorRef.current.childNodes) as ChildNode[];
          const draggedNode = children[draggedBlockIndex];
          const targetNode = children[dragOverIndex];

          if (!draggedNode || !targetNode) return;

          const targetEl = targetNode as HTMLElement;
          const rect = targetEl.getBoundingClientRect();
          const midY = rect.top + rect.height / 2;
          const insertAfter = e.clientY >= midY;

          // Remove the dragged node first
          editorRef.current.removeChild(draggedNode);

          // Get updated children list
          const newChildren = Array.from(editorRef.current.childNodes) as ChildNode[];
          let newTargetIndex = dragOverIndex;
          if (draggedBlockIndex < dragOverIndex) {
            newTargetIndex = dragOverIndex - 1;
          }
          const newTargetNode = newChildren[newTargetIndex];

          if (newTargetNode) {
            if (insertAfter && newTargetNode.nextSibling) {
              editorRef.current.insertBefore(draggedNode, newTargetNode.nextSibling);
            } else if (insertAfter) {
              editorRef.current.appendChild(draggedNode);
            } else {
              editorRef.current.insertBefore(draggedNode, newTargetNode);
            }
          } else {
            editorRef.current.appendChild(draggedNode);
          }

          // Clean up
          editorRef.current.querySelectorAll('.drag-over, .drag-over-bottom').forEach(el => {
            el.classList.remove('drag-over', 'drag-over-bottom');
          });
          setDraggedBlockIndex(null);
          setDragOverIndex(null);

          // Save changes
          const html = editorRef.current.innerHTML;
          const markdown = htmlToMarkdown(html);
          lastEmittedMarkdown.current = markdown;
          onChange(markdown);
          updateBlocks();
        }}
        spellCheck={false}
        data-placeholder={placeholder}
        />
      </div>

      {/* Floating Link Menu */}
      {showLinkMenu && (
        <div 
          className="absolute z-50 bg-white shadow-xl border border-slate-200 rounded-lg w-72 overflow-hidden flex flex-col animate-in fade-in zoom-in duration-150"
          style={{ top: menuPos.top, left: menuPos.left }}
        >
          <div className="p-2 bg-slate-50 border-b border-slate-100">
            <input
              autoFocus
              type="text"
              placeholder="Search notes... (type @ for dates)"
              className="w-full bg-transparent outline-none text-sm text-slate-700 font-medium"
              value={linkSearch}
              onChange={(e) => {
                const value = e.target.value;
                // If user types @, switch to date menu
                if (value === '@' || value.endsWith('@')) {
                  setShowLinkMenu(false);
                  setShowDateMenu(true);
                  setDateSearch('');
                  setSelectedIndex(0);
                  // Focus back on editor and insert @@ there
                  if (editorRef.current && selectionRange) {
                    editorRef.current.focus();
                    const selection = window.getSelection();
                    if (selection) {
                      selection.removeAllRanges();
                      selection.addRange(selectionRange);
                      // The original @ is still in editor, so this triggers @@
                      document.execCommand('insertText', false, '@');
                    }
                  }
                  return;
                }
                setLinkSearch(value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown} // Pass keydown to parent handler
            />
          </div>
          <div className="max-h-60 overflow-y-auto py-1">
             {linkMenuOptions.map((option: any, idx) => (
               <button
                key={option.id}
                ref={idx === selectedIndex ? selectedItemRef : null}
                className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors
                  ${idx === selectedIndex ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-100'}
                `}
                onClick={() => handleLinkSelect(option.title)}
                onMouseEnter={() => setSelectedIndex(idx)}
               >
                 {option.isCreate ? (
                   <>
                    <FilePlus className="w-4 h-4 text-brand-500" />
                    <span className="font-medium">Create "{option.title}"</span>
                   </>
                 ) : (
                   <>
                    <Hash className="w-4 h-4 text-slate-400" />
                    <span>{option.title}</span>
                   </>
                 )}
               </button>
             ))}
             {linkMenuOptions.length === 0 && (
               <div className="px-4 py-3 text-xs text-slate-400 text-center">
                 No matches found
               </div>
             )}
          </div>
        </div>
      )}

      {/* Floating Slash Command Menu */}
      {showSlashMenu && (
        <div
          className="absolute z-50 bg-white shadow-xl border border-slate-200 rounded-lg w-80 overflow-hidden flex flex-col animate-in fade-in zoom-in duration-150"
          style={{ top: menuPos.top, left: menuPos.left }}
        >
          <div className="p-2 bg-slate-50 border-b border-slate-100">
            <input
              autoFocus
              type="text"
              placeholder="Search commands..."
              className="w-full bg-transparent outline-none text-sm text-slate-700 font-medium"
              value={slashSearch}
              onChange={(e) => {
                setSlashSearch(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
            />
          </div>
          <div className="max-h-72 overflow-y-auto py-1">
             {filteredCommands.map((command, idx) => {
               const Icon = command.icon;
               return (
                 <button
                  key={command.id}
                  ref={idx === selectedIndex ? selectedItemRef : null}
                  className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors
                    ${idx === selectedIndex ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-100'}
                  `}
                  onClick={() => handleSlashCommand(command)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                 >
                   <Icon className="w-4 h-4 flex-shrink-0 text-slate-400" />
                   <div className="flex flex-col min-w-0">
                     <span className="font-medium">{command.label}</span>
                     <span className="text-xs text-slate-500">{command.description}</span>
                   </div>
                 </button>
               );
             })}
             {filteredCommands.length === 0 && (
               <div className="px-4 py-3 text-xs text-slate-400 text-center">
                 No commands found
               </div>
             )}
          </div>
        </div>
      )}

      {/* Floating Date Menu */}
      {showDateMenu && (
        <div
          className="absolute z-50 bg-white shadow-xl border border-slate-200 rounded-lg w-80 overflow-hidden flex flex-col animate-in fade-in zoom-in duration-150"
          style={{ top: menuPos.top, left: menuPos.left }}
        >
          {/* Search/Filter */}
          <div className="p-2 bg-slate-50 border-b border-slate-100">
            <input
              autoFocus
              type="text"
              placeholder="Search or type date (DD.MM.YYYY)..."
              className="w-full bg-transparent outline-none text-sm text-slate-700 font-medium"
              value={dateSearch}
              onChange={(e) => {
                setDateSearch(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={(e) => {
                // Handle Enter to select typed date
                if (e.key === 'Enter' && dateSearch.trim()) {
                  const parsedDate = parseDate(dateSearch.trim());
                  if (parsedDate) {
                    e.preventDefault();
                    handleDateSelect({
                      id: 'custom',
                      label: getLabelForDate(parsedDate),
                      date: parsedDate,
                      formatted: formatDate(parsedDate)
                    });
                    return;
                  }
                }
                handleKeyDown(e);
              }}
            />
          </div>

          {/* Date & Time Picker */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/50 space-y-2">
            <div className="flex gap-2">
              {/* Date Picker */}
              <div className="flex-1">
                <label className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                  <Calendar className="w-3 h-3" />
                  Date
                </label>
                <input
                  type="date"
                  className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
                  onChange={(e) => {
                    const parsedDate = parseDate(e.target.value);
                    if (parsedDate) {
                      handleDateSelect({
                        id: 'custom-calendar',
                        label: getLabelForDate(parsedDate),
                        date: parsedDate,
                        formatted: formatDate(parsedDate)
                      });
                    }
                  }}
                />
              </div>
              {/* Time Picker */}
              <div className="w-24">
                <label className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                  <Clock className="w-3 h-3" />
                  Time
                </label>
                <input
                  type="time"
                  value={selectedTime}
                  className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
                  onChange={(e) => setSelectedTime(e.target.value)}
                />
              </div>
            </div>
            <div className="text-xs text-slate-400">
              Time applies to all date selections
            </div>
          </div>

          {/* Quick Options */}
          <div className="text-xs text-slate-400 px-3 pt-2 pb-1 font-medium uppercase tracking-wider">
            Quick select
          </div>
          <div className="max-h-52 overflow-y-auto py-1">
             {filteredDates.map((option, idx) => (
               <button
                key={option.id}
                ref={idx === selectedIndex ? selectedItemRef : null}
                className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 transition-colors
                  ${idx === selectedIndex ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-100'}
                `}
                onClick={() => handleDateSelect(option)}
                onMouseEnter={() => setSelectedIndex(idx)}
               >
                 <Calendar className="w-4 h-4 flex-shrink-0 text-slate-400" />
                 <div className="flex-1 flex items-center justify-between">
                   <span className="font-medium">{option.label}</span>
                   <span className="text-xs text-slate-400">{option.formatted}</span>
                 </div>
               </button>
             ))}
             {filteredDates.length === 0 && dateSearch && (
               <div className="px-4 py-3 text-xs text-slate-500 text-center">
                 {parseDate(dateSearch) ? (
                   <button
                     className="text-brand-600 hover:text-brand-700 font-medium"
                     onClick={() => {
                       const parsedDate = parseDate(dateSearch);
                       if (parsedDate) {
                         handleDateSelect({
                           id: 'custom-typed',
                           label: getLabelForDate(parsedDate),
                           date: parsedDate,
                           formatted: formatDate(parsedDate)
                         });
                       }
                     }}
                   >
                     Use "{dateSearch}" →
                   </button>
                 ) : (
                   <span>Type a date like "25.12.2025"</span>
                 )}
               </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RichEditor;
