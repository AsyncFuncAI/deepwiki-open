import { WikiPage } from "./wikipage";

/**
 * @fileoverview This file defines the structure of a wiki page and its sections.
 */
export interface WikiStructure {
    id: string;
    title: string;
    description: string;
    pages: WikiPage[];
}