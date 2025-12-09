/**
 * Utility functions for validating wiki page content
 */

/**
 * Check if content is a placeholder or loading state
 */
export function isPlaceholderContent(content: string | undefined): boolean {
  if (!content) return true;
  
  const trimmed = content.trim();
  
  // Check for common placeholder patterns
  const placeholders = [
    'loading...',
    'generating...',
    'please wait...',
    'processing...',
  ];
  
  return placeholders.some(placeholder => 
    trimmed.toLowerCase() === placeholder
  );
}

/**
 * Check if content is an error message
 */
export function isErrorContent(content: string | undefined): boolean {
  if (!content) return false;
  
  const trimmed = content.trim().toLowerCase();
  
  // Check for common error patterns
  const errorPatterns = [
    /^error:/i,
    /^error generating/i,
    /^failed to/i,
    /^an error occurred/i,
    /^something went wrong/i,
    /^unable to/i,
    /^could not/i,
  ];
  
  return errorPatterns.some(pattern => pattern.test(trimmed));
}

/**
 * Check if content is too short to be valid
 * Valid content should have at least some meaningful text
 */
export function isTooShort(content: string | undefined, minLength: number = 50): boolean {
  if (!content) return true;
  
  const trimmed = content.trim();
  return trimmed.length < minLength;
}

/**
 * Check if content appears to be complete and valid
 * Returns true if content is valid, false otherwise
 */
export function isValidContent(content: string | undefined): boolean {
  if (!content) return false;
  
  // Check if it's a placeholder
  if (isPlaceholderContent(content)) {
    return false;
  }
  
  // Check if it's an error message
  if (isErrorContent(content)) {
    return false;
  }
  
  // Check if it's too short (less than 50 characters is likely incomplete)
  if (isTooShort(content, 50)) {
    return false;
  }
  
  // Content appears to be valid
  return true;
}

/**
 * Get a description of why content is invalid
 */
export function getInvalidReason(content: string | undefined): string {
  if (!content) {
    return 'Content is empty';
  }
  
  if (isPlaceholderContent(content)) {
    return 'Content is a placeholder';
  }
  
  if (isErrorContent(content)) {
    return 'Content is an error message';
  }
  
  if (isTooShort(content, 50)) {
    return `Content is too short (${content.trim().length} characters)`;
  }
  
  return 'Content is valid';
}

/**
 * Content validation result
 */
export interface ContentValidationResult {
  isValid: boolean;
  reason: string;
  content?: string;
}

/**
 * Validate content and return detailed result
 */
export function validateContent(content: string | undefined): ContentValidationResult {
  const isValid = isValidContent(content);
  const reason = getInvalidReason(content);
  
  return {
    isValid,
    reason,
    content,
  };
}

