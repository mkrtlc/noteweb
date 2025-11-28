export interface Note {
  id: string;
  title: string;
  content: string; // Stored as Markdown
  tags: string[];
  folderId: string | null; // null means no folder (root level)
  order: number; // For manual ordering within folders/root
  updatedAt: number;
  createdAt: number;
}

export interface Folder {
  id: string;
  name: string;
  color?: string;
  createdAt: number;
}

export interface LinkSuggestion {
  id: string;
  title: string;
  similarity?: number; // For AI ranking
}

export interface GraphNode {
  id: string;
  title: string;
  group?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  value?: number;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}
