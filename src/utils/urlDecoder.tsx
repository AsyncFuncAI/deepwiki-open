export function extractUrlDomain(input: string): string | null {
    try {
        const normalizedInput = input.startsWith('http') ? input : `https://${input}`;
        const url = new URL(normalizedInput);
        let result = `${url.protocol}//${url.hostname}`;
        // Exclude default ports (80 for http, 443 for https)
        // and include the port only if it's not the default
        // to avoid cluttering the URL
        // e.g., http://example.com should be http://example.com
        // e.g., http://example.com:80 should be http://example.com
        // e.g., http://example.com:443 should be http://example.com
        // e.g., http://example.com:8080 should be http://example.com:8080
        if (![null, "", "80", "443"].includes(url.port)) result += `:${url.port}`;
        return result;
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