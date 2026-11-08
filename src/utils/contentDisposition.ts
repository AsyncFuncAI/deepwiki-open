export function filenameFromContentDisposition(header: string | null, fallback: string): string {
  if (!header) {
    return fallback;
  }

  const encodedMatch = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (encodedMatch && encodedMatch[1]) {
    try {
      const decoded = decodeURIComponent(encodedMatch[1].trim());
      if (decoded) {
        return decoded;
      }
    } catch {
      // malformed percent-encoding, fall back to filename=
    }
  }

  const plainMatch = header.match(/filename="?([^";]+)"?/i);
  if (plainMatch && plainMatch[1]) {
    return plainMatch[1].trim();
  }

  return fallback;
}
