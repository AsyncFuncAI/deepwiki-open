// Wiki Interfaces
export interface WikiPage {
  id: string;
  title: string;
  content: string;
  filePaths: string[];
  importance: 'high' | 'medium' | 'low';
  relatedPages: string[];
}

export interface WikiStructure {
  id: string;
  title: string;
  description: string;
  pages: WikiPage[];
}

export type RepoInfo = {
  owner: string;
  repo: string;
  type: string;
  localPath: string | undefined;
}
