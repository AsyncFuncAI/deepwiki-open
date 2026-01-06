export function extractUrlDomain(input: string): string | null {
    try {
        const normalizedInput = input.startsWith('http') ? input : `https://${input}`;
        const url = new URL(normalizedInput);
        return `${url.protocol}//${url.hostname}${url.port ? ':' + url.port : ''}`; // Inclut le protocole et le domaine
    } catch {
        return null; // Not a valid URL
    }
}

export function extractUrlPath(input: string): string | null {
    try {
        const normalizedInput = input.startsWith('http') ? input : `https://${input}`;
        const url = new URL(normalizedInput);
        return url.pathname.replace(/^\/|\/$/g, ''); // Remove leading and trailing slashes
    } catch {
        return null; // Not a valid URL
    }
}