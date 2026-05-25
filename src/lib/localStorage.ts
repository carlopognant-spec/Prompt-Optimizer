/**
 * Robust localStorage wrapper with try/catch protection
 * Prevents runtime crashes from quota exceeded, storage unavailable, or parse errors
 */

export const safeLocalStorage = {
  /**
   * Safely retrieves and parses JSON from localStorage
   * @param key Storage key
   * @param defaultValue Fallback value if retrieval or parsing fails
   * @returns Parsed value or defaultValue on error
   */
  getItem<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return defaultValue;
      }
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`Failed to retrieve/parse localStorage key "${key}":`, error);
      return defaultValue;
    }
  },

  /**
   * Safely stores JSON in localStorage
   * Silently fails if storage is unavailable or quota exceeded
   * @param key Storage key
   * @param value Value to store (will be JSON stringified)
   */
  setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to save to localStorage key "${key}":`, error);
      // Silently fail - do not throw to prevent app crashes
    }
  },

  /**
   * Safely removes an item from localStorage
   * @param key Storage key
   */
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove localStorage key "${key}":`, error);
    }
  },

  /**
   * Safely clears all storage
   */
  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error("Failed to clear localStorage:", error);
    }
  },
};
