interface WikiSection {
  id: string;
  title: string;
  pages: string[];
  subsections?: string[];
}

interface WikiStructure {
  id: string;
  title: string;
  description: string;
  pages: { id: string }[];
  sections: WikiSection[];
  rootSections: string[];
}

export function flattenPageOrder(structure: WikiStructure): string[] {
  const order: string[] = [];
  const seen = new Set<string>();
  const visitedSections = new Set<string>();

  function walkSection(sectionId: string) {
    const section = structure.sections.find(s => s.id === sectionId);
    if (!section || visitedSections.has(sectionId)) return;
    visitedSections.add(sectionId);

    for (const pageId of section.pages) {
      if (!seen.has(pageId)) {
        seen.add(pageId);
        order.push(pageId);
      }
    }

    if (section.subsections) {
      for (const subId of section.subsections) {
        walkSection(subId);
      }
    }
  }

  if (structure.rootSections?.length > 0 && structure.sections?.length > 0) {
    for (const rootId of structure.rootSections) {
      walkSection(rootId);
    }
  } else {
    for (const page of structure.pages) {
      order.push(page.id);
    }
  }

  return order;
}
