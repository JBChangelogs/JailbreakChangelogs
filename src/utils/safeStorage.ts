/**
 * Safe localStorage utilities that handle SecurityError exceptions
 * that occur in private browsing mode or other restricted contexts
 */

export const safeLocalStorage = {
  /**
   * Safely get an item from localStorage
   * @param key - The key to retrieve
   * @returns The stored value or null if not available/accessible
   */
  getItem: (key: string): string | null => {
    try {
      if (typeof window === "undefined") return null;
      return localStorage.getItem(key);
    } catch (error) {
      console.warn(`Failed to get localStorage item "${key}":`, error);
      return null;
    }
  },

  /**
   * Safely set an item in localStorage
   * @param key - The key to store
   * @param value - The value to store
   * @returns true if successful, false otherwise
   */
  setItem: (key: string, value: string): boolean => {
    try {
      if (typeof window === "undefined") return false;
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn(`Failed to set localStorage item "${key}":`, error);
      return false;
    }
  },

  /**
   * Safely remove an item from localStorage
   * @param key - The key to remove
   * @returns true if successful, false otherwise
   */
  removeItem: (key: string): boolean => {
    try {
      if (typeof window === "undefined") return false;
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`Failed to remove localStorage item "${key}":`, error);
      return false;
    }
  },

  /**
   * Safely clear all localStorage
   * @returns true if successful, false otherwise
   */
  clear: (): boolean => {
    try {
      if (typeof window === "undefined") return false;
      localStorage.clear();
      return true;
    } catch (error) {
      console.warn("Failed to clear localStorage:", error);
      return false;
    }
  },

  /**
   * Check if localStorage is available
   * @returns true if localStorage is accessible, false otherwise
   */
  isAvailable: (): boolean => {
    try {
      if (typeof window === "undefined") return false;
      const testKey = "__localStorage_test__";
      localStorage.setItem(testKey, "test");
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  },
};

/**
 * Safely parse JSON from localStorage
 * @param key - The key to retrieve and parse
 * @param defaultValue - Default value if parsing fails
 * @returns Parsed object or default value
 */
export const safeGetJSON = <T>(
  key: string,
  defaultValue: T | null,
): T | null => {
  const item = safeLocalStorage.getItem(key);
  if (!item) return defaultValue;

  try {
    return JSON.parse(item) as T;
  } catch (error) {
    console.warn(
      `Failed to parse JSON from localStorage item "${key}":`,
      error,
    );
    return defaultValue;
  }
};

/**
 * Safely stringify and store JSON in localStorage
 * @param key - The key to store
 * @param value - The value to stringify and store
 * @returns true if successful, false otherwise
 */
export const safeSetJSON = (key: string, value: unknown): boolean => {
  try {
    const jsonString = JSON.stringify(value);
    return safeLocalStorage.setItem(key, jsonString);
  } catch (error) {
    console.warn(
      `Failed to stringify and store JSON in localStorage item "${key}":`,
      error,
    );
    return false;
  }
};
