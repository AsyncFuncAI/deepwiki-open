import { WikiPage } from "./wikipage";
import WikiSection from "./wikisection";

/**
 * @fileoverview This file defines the structure of a wiki page and its sections.
 */
export interface WikiStructure {
    id: string;
    title: string;
    description: string;
    pages: WikiPage[];
    sections: WikiSection[];
    rootSections: string[];
  }