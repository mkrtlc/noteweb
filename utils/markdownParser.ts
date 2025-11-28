/**
 * A lightweight parser to convert stored Markdown to editor HTML and vice versa.
 * Supports Links, Bold, Italic, Headings, Lists, Code, Quotes, and more.
 */

// Convert Markdown string to HTML string for contentEditable
export const markdownToHtml = (markdown: string): string => {
  if (!markdown) return '';

  // Helper to check if a string is a block element
  const isBlockHtml = (html: string): boolean => {
    return /^<(h[1-3]|li|blockquote|hr|code class="code-block")/.test(html);
  };

  // Process line by line for block-level elements
  const lines = markdown.split('\n');
  const processedLines = lines.map(line => {
    let processedLine = line
      // Escape HTML
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Block-level elements (must be at start of line)
    // Headings
    if (/^### (.+)/.test(processedLine)) {
      processedLine = processedLine.replace(/^### (.+)/, '<h3>$1</h3>');
    } else if (/^## (.+)/.test(processedLine)) {
      processedLine = processedLine.replace(/^## (.+)/, '<h2>$1</h2>');
    } else if (/^# (.+)/.test(processedLine)) {
      processedLine = processedLine.replace(/^# (.+)/, '<h1>$1</h1>');
    }
    // Horizontal rule
    else if (/^---+$/.test(processedLine)) {
      processedLine = '<hr>';
    }
    // Block quote
    else if (/^&gt; (.+)/.test(processedLine)) {
      processedLine = processedLine.replace(/^&gt; (.+)/, '<blockquote>$1</blockquote>');
    }
    // Bullet list
    else if (/^[\-\*] (.+)/.test(processedLine)) {
      processedLine = processedLine.replace(/^[\-\*] (.+)/, '<li class="bullet-item">$1</li>');
    }
    // Numbered list
    else if (/^\d+\. (.+)/.test(processedLine)) {
      processedLine = processedLine.replace(/^\d+\. (.+)/, '<li class="numbered-item">$1</li>');
    }

    // Inline elements
    // Date chips @@{ISO_DATE|LABEL|FORMATTED}@@
    processedLine = processedLine.replace(/@@\{(.*?)\|(.*?)\|(.*?)\}@@/g, (match, isoDate, label, formatted) => {
      return `<span class="date-chip" contenteditable="false" data-date="${isoDate}">📅 ${label} (${formatted})</span>`;
    });

    // Links [[Title]]
    processedLine = processedLine.replace(/\[\[(.*?)\]\]/g, (match, content) => {
      const [target, label] = content.split('|');
      const display = label || target;
      return `<span class="link-chip" contenteditable="false" data-link="${target}">${display}</span>`;
    });

    // Code blocks ```code```
    processedLine = processedLine.replace(/```(.*?)```/g, '<code class="code-block">$1</code>');

    // Inline code `code`
    processedLine = processedLine.replace(/`(.*?)`/g, '<code>$1</code>');

    // Bold **text**
    processedLine = processedLine.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');

    // Italic *text* (but not in list markers)
    processedLine = processedLine.replace(/(?<!\*)\*([^\*]+?)\*(?!\*)/g, '<i>$1</i>');

    return processedLine;
  });

  // Join lines, but don't add <br> between consecutive block elements
  let html = '';
  for (let i = 0; i < processedLines.length; i++) {
    const current = processedLines[i];
    const prev = i > 0 ? processedLines[i - 1] : null;

    // Add <br> before this line only if:
    // - It's not the first line
    // - AND it's not a block element following another block element
    if (prev !== null) {
      const prevIsBlock = isBlockHtml(prev);
      const currentIsBlock = isBlockHtml(current);

      // If both are blocks, no <br> needed between them
      // If previous is block and current is empty, add <br> for spacing
      // Otherwise add <br>
      if (prevIsBlock && currentIsBlock) {
        // No <br> between consecutive blocks
      } else {
        html += '<br>';
      }
    }

    html += current;
  }

  return html;
};

// Convert HTML contentEditable content back to Markdown for storage
export const htmlToMarkdown = (html: string): string => {
  if (!html) return '';

  // Create a temporary DOM element to traverse logic
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  // Helper to check if a node is a block element
  const isBlockElement = (node: Node): boolean => {
    if (node.nodeType !== Node.ELEMENT_NODE) return false;
    const el = node as HTMLElement;
    const tag = el.tagName;
    return ['H1', 'H2', 'H3', 'BLOCKQUOTE', 'HR', 'DIV'].includes(tag) ||
           el.classList.contains('bullet-item') ||
           el.classList.contains('numbered-item') ||
           (tag === 'CODE' && el.classList.contains('code-block'));
  };

  const walk = (node: Node, prevSibling: Node | null = null): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      // Remove zero-width spaces
      return text.replace(/[\u200B\u200C\u200D\uFEFF]/g, '');
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;

      // Block elements
      if (el.tagName === 'BR') return '\n';
      if (el.tagName === 'DIV') return '\n' + Array.from(el.childNodes).map((n, i, arr) => walk(n, i > 0 ? arr[i-1] : null)).join('');
      if (el.tagName === 'HR') return '\n---\n';

      // Headings - add newline before to ensure they're on their own line
      if (el.tagName === 'H1') return `\n# ${Array.from(el.childNodes).map((n, i, arr) => walk(n, i > 0 ? arr[i-1] : null)).join('')}`;
      if (el.tagName === 'H2') return `\n## ${Array.from(el.childNodes).map((n, i, arr) => walk(n, i > 0 ? arr[i-1] : null)).join('')}`;
      if (el.tagName === 'H3') return `\n### ${Array.from(el.childNodes).map((n, i, arr) => walk(n, i > 0 ? arr[i-1] : null)).join('')}`;

      // Block quote
      if (el.tagName === 'BLOCKQUOTE') return `\n> ${Array.from(el.childNodes).map((n, i, arr) => walk(n, i > 0 ? arr[i-1] : null)).join('')}`;

      // Lists - add newline before to ensure they're on their own line
      if (el.classList.contains('bullet-item')) {
        return `\n- ${Array.from(el.childNodes).map((n, i, arr) => walk(n, i > 0 ? arr[i-1] : null)).join('')}`;
      }
      if (el.classList.contains('numbered-item')) {
        return `\n1. ${Array.from(el.childNodes).map((n, i, arr) => walk(n, i > 0 ? arr[i-1] : null)).join('')}`;
      }

      // Code
      if (el.tagName === 'CODE') {
        const content = Array.from(el.childNodes).map((n, i, arr) => walk(n, i > 0 ? arr[i-1] : null)).join('');
        if (el.classList.contains('code-block')) {
          return '\n```' + content + '```';
        }
        return '`' + content + '`';
      }

      // Inline styles
      if (el.tagName === 'B' || el.style.fontWeight === 'bold') {
        return `**${Array.from(el.childNodes).map((n, i, arr) => walk(n, i > 0 ? arr[i-1] : null)).join('')}**`;
      }
      if (el.tagName === 'I' || el.style.fontStyle === 'italic') {
        return `*${Array.from(el.childNodes).map((n, i, arr) => walk(n, i > 0 ? arr[i-1] : null)).join('')}*`;
      }

      // Links
      if (el.classList.contains('link-chip')) {
         const target = el.getAttribute('data-link');
         const text = el.textContent;
         if (target === text) return `[[${target}]]`;
         return `[[${target}|${text}]]`;
      }

      // Date chips
      if (el.classList.contains('date-chip')) {
         const isoDate = el.getAttribute('data-date') || '';
         const text = el.textContent || '';
         // Parse the text to extract label and formatted date
         // Format: "📅 LABEL (FORMATTED)"
         const match = text.match(/📅\s*(.+?)\s*\((.+?)\)/);
         if (match) {
           const label = match[1];
           const formatted = match[2];
           return `@@{${isoDate}|${label}|${formatted}}@@`;
         }
         return `@@{${isoDate}|${text}|${text}}@@`;
      }

      return Array.from(el.childNodes).map((n, i, arr) => walk(n, i > 0 ? arr[i-1] : null)).join('');
    }
    return '';
  };

  let markdown = Array.from(tempDiv.childNodes).map((n, i, arr) => walk(n, i > 0 ? arr[i-1] : null)).join('');

  // Cleanup only leading/trailing newlines, preserve intentional empty lines
  markdown = markdown
    .replace(/^\n+/, '')           // Remove leading newlines
    .trim();

  return markdown;
};

export const extractLinks = (markdown: string): string[] => {
  const regex = /\[\[(.*?)\]\]/g;
  const links: string[] = [];
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    const [target] = match[1].split('|');
    links.push(target);
  }
  return links;
};

export interface ExtractedDate {
  isoDate: string;
  label: string;
  formatted: string;
  date: Date;
}

export const extractDates = (markdown: string): ExtractedDate[] => {
  const regex = /@@\{(.*?)\|(.*?)\|(.*?)\}@@/g;
  const dates: ExtractedDate[] = [];
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    dates.push({
      isoDate: match[1],
      label: match[2],
      formatted: match[3],
      date: new Date(match[1])
    });
  }
  return dates;
};
