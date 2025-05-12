export default interface WikiSection {
    id: string;
    title: string;
    pages: string[];
    subsections?: string[];
}