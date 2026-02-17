import GithubSlugger from 'github-slugger';

export interface Heading {
  id: string;
  text: string;
  level: number;
}

export function extractHeadings(markdown: string): Heading[] {
  const slugger = new GithubSlugger();
  const headings: Heading[] = [];
  const lines = markdown.split('\n');

  for (const line of lines) {
    const match = line.match(/^(#{1,3})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].replace(/[`*_~\[\]]/g, '').trim();
      const id = slugger.slug(text);
      headings.push({ id, text, level });
    }
  }

  return headings;
}
