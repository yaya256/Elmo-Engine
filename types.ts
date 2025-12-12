export interface ProjectState {
  html: string;
  css: string;
  js: string;
}

export interface ProjectMetadata {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  lastModified: number;
  templateId?: string;
  version: number;
  isCloud?: boolean;
}

export interface SavedProject {
  metadata: ProjectMetadata;
  content: ProjectState;
  history: { timestamp: number; content: ProjectState; note?: string }[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  code: ProjectState;
}

export enum TabOption {
  HTML = 'HTML',
  CSS = 'CSS',
  JS = 'JS',
}
