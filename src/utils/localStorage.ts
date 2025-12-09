/**
 * Safe localStorage wrapper that handles Node.js v25 localStorage bug
 * https://github.com/nodejs/node/issues/60303
 * 
 * Node.js v25 creates localStorage as an empty proxy object on the server,
 * which causes localStorage.getItem to be undefined instead of a function.
 * This utility provides a safe interface for localStorage operations.
 */

// Workaround for Node.js v25 localStorage bug
// If localStorage exists but getItem is not a function, set it to undefined
if (typeof globalThis !== 'undefined' && globalThis.localStorage && typeof globalThis.localStorage.getItem !== 'function') {
  (globalThis as any).localStorage = undefined;
}

export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.getItem === 'function') {
      try {
        return window.localStorage.getItem(key);
      } catch (error) {
        console.error('Error accessing localStorage.getItem:', error);
        return null;
      }
    }
    return null;
  },

  setItem: (key: string, value: string): void => {
    if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.setItem === 'function') {
      try {
        window.localStorage.setItem(key, value);
      } catch (error) {
        console.error('Error accessing localStorage.setItem:', error);
      }
    }
  },

  removeItem: (key: string): void => {
    if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.removeItem === 'function') {
      try {
        window.localStorage.removeItem(key);
      } catch (error) {
        console.error('Error accessing localStorage.removeItem:', error);
      }
    }
  },

  clear: (): void => {
    if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.clear === 'function') {
      try {
        window.localStorage.clear();
      } catch (error) {
        console.error('Error accessing localStorage.clear:', error);
      }
    }
  }
};

