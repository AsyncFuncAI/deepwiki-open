// Wiki Interfaces
export interface WikiPage {
  id: string;
  title: string;
  content: string;
  filePaths: string[];
  importance: 'high' | 'medium' | 'low';
  relatedPages: string[];
  // New fields for hierarchy
  parentId?: string;
  isSection?: boolean;
  children?: string[]; // IDs of child pages
}