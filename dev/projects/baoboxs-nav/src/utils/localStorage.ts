// 通用的localStorage工具函数
export const localStorageUtils = {
  getItem: <T>(key: string, fallback: T): T => {
    try {
      if (typeof window === 'undefined') return fallback;
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return fallback;
    }
  },

  setItem: <T>(key: string, value: T): boolean => {
    try {
      if (typeof window === 'undefined') return false;
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
      return false;
    }
  },

  removeItem: (key: string): boolean => {
    try {
      if (typeof window === 'undefined') return false;
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
      return false;
    }
  },

  clear: (): boolean => {
    try {
      if (typeof window === 'undefined') return false;
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  }
};

