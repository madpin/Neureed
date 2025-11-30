/**
 * Offline Cache Service
 * Manages localStorage caching for saved searches and their results
 * with automatic sync when connection is restored
 */

const CACHE_VERSION = '1.0';
const CACHE_PREFIX = 'neureed_offline';

interface CacheMetadata {
  version: string;
  lastSync: number;
  isOnline: boolean;
}

interface CachedData<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export class OfflineCacheService {
  private static readonly CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours
  private static readonly METADATA_KEY = `${CACHE_PREFIX}_metadata`;

  /**
   * Check if browser supports localStorage
   */
  static isSupported(): boolean {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Get cache metadata
   */
  static getMetadata(): CacheMetadata {
    if (!this.isSupported()) {
      return {
        version: CACHE_VERSION,
        lastSync: Date.now(),
        isOnline: navigator.onLine
      };
    }

    const stored = localStorage.getItem(this.METADATA_KEY);
    if (!stored) {
      return {
        version: CACHE_VERSION,
        lastSync: Date.now(),
        isOnline: navigator.onLine
      };
    }

    try {
      return JSON.parse(stored);
    } catch {
      return {
        version: CACHE_VERSION,
        lastSync: Date.now(),
        isOnline: navigator.onLine
      };
    }
  }

  /**
   * Update cache metadata
   */
  static updateMetadata(updates: Partial<CacheMetadata>): void {
    if (!this.isSupported()) return;

    const current = this.getMetadata();
    const updated = { ...current, ...updates };
    localStorage.setItem(this.METADATA_KEY, JSON.stringify(updated));
  }

  /**
   * Set cached data with TTL
   */
  static set<T>(key: string, data: T, ttl: number = this.CACHE_DURATION): void {
    if (!this.isSupported()) return;

    const cached: CachedData<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl
    };

    try {
      localStorage.setItem(`${CACHE_PREFIX}_${key}`, JSON.stringify(cached));
    } catch (e) {
      // Handle quota exceeded error
      console.warn('localStorage quota exceeded, clearing old cache');
      this.clearExpired();
      try {
        localStorage.setItem(`${CACHE_PREFIX}_${key}`, JSON.stringify(cached));
      } catch {
        // Still failed, ignore
      }
    }
  }

  /**
   * Get cached data if not expired
   */
  static get<T>(key: string): T | null {
    if (!this.isSupported()) return null;

    const stored = localStorage.getItem(`${CACHE_PREFIX}_${key}`);
    if (!stored) return null;

    try {
      const cached: CachedData<T> = JSON.parse(stored);

      // Check if expired
      if (Date.now() > cached.expiresAt) {
        this.remove(key);
        return null;
      }

      return cached.data;
    } catch {
      this.remove(key);
      return null;
    }
  }

  /**
   * Remove cached data
   */
  static remove(key: string): void {
    if (!this.isSupported()) return;
    localStorage.removeItem(`${CACHE_PREFIX}_${key}`);
  }

  /**
   * Clear all expired cache entries
   */
  static clearExpired(): void {
    if (!this.isSupported()) return;

    const keys = Object.keys(localStorage);
    const now = Date.now();

    for (const key of keys) {
      if (!key.startsWith(CACHE_PREFIX)) continue;
      if (key === this.METADATA_KEY) continue;

      const stored = localStorage.getItem(key);
      if (!stored) continue;

      try {
        const cached: CachedData<unknown> = JSON.parse(stored);
        if (now > cached.expiresAt) {
          localStorage.removeItem(key);
        }
      } catch {
        // Invalid data, remove it
        localStorage.removeItem(key);
      }
    }
  }

  /**
   * Clear all cache data
   */
  static clearAll(): void {
    if (!this.isSupported()) return;

    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    }
  }

  /**
   * Get cache size in bytes (approximate)
   */
  static getCacheSize(): number {
    if (!this.isSupported()) return 0;

    let size = 0;
    const keys = Object.keys(localStorage);

    for (const key of keys) {
      if (key.startsWith(CACHE_PREFIX)) {
        const value = localStorage.getItem(key);
        if (value) {
          size += key.length + value.length;
        }
      }
    }

    return size;
  }

  /**
   * Check if online
   */
  static isOnline(): boolean {
    return navigator.onLine;
  }

  /**
   * Setup online/offline event listeners
   */
  static setupConnectionListener(
    onOnline?: () => void,
    onOffline?: () => void
  ): () => void {
    const handleOnline = () => {
      this.updateMetadata({ isOnline: true, lastSync: Date.now() });
      onOnline?.();
    };

    const handleOffline = () => {
      this.updateMetadata({ isOnline: false });
      onOffline?.();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Return cleanup function
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }
}

// Saved Searches specific cache keys
export const CACHE_KEYS = {
  SAVED_SEARCHES: 'saved_searches',
  SEARCH_RESULTS: (searchId: string) => `search_results_${searchId}`,
  SEARCH_PREVIEW: (query: string) => `preview_${query}`,
} as const;
