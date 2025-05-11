/**
 * @fileoverview This file defines the structure of a wiki page and its sections.
 */
interface WikiStructure {
    id: string;
    title: string;
    description: string;
    pages: WikiPage[];
}