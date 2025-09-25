import repositoryConfig from '../config/repository-providers.json';

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

export function extractUrlHostname(input: string): string | null {
    try {
        const normalizedInput = input.startsWith('http') ? input : `https://${input}`;
        const url = new URL(normalizedInput);
        return url.hostname;
    } catch {
        return null;
    }
}

/**
 * Detect repository type from URL using simple pattern matching
 * @param url Repository URL
 * @returns Repository type (github/gitlab/bitbucket/web)
 */
export function detectRepositoryType(url: string): string {
    const hostname = extractUrlHostname(url);
    if (!hostname) return 'web';
    
    const config = repositoryConfig as { providers: Array<{ type: string; patterns: string[] }>; fallback: string };
    
    // Simple pattern matching - check if hostname contains any pattern
    for (const provider of config.providers) {
        for (const pattern of provider.patterns) {
            if (pattern.includes('*')) {
                // Handle wildcards by converting to simple contains/starts/ends checks
                const cleanPattern = pattern.replace(/\*/g, '');
                if (pattern.startsWith('*') && pattern.endsWith('*')) {
                    // *pattern* - contains
                    if (hostname.includes(cleanPattern)) return provider.type;
                } else if (pattern.startsWith('*')) {
                    // *pattern - ends with
                    if (hostname.endsWith(cleanPattern)) return provider.type;
                } else if (pattern.endsWith('*')) {
                    // pattern* - starts with
                    if (hostname.startsWith(cleanPattern)) return provider.type;
                }
            } else {
                // Exact match
                if (hostname === pattern) return provider.type;
            }
        }
    }
    
    return config.fallback;
}