import { Avatar, type AvatarProps } from 'antd';
import { memo, useSyncExternalStore } from 'react';

interface CachedAvatarProps extends Omit<AvatarProps, 'src'> {
  src?: string;
}

// ============================================================================
// Image Cache Store (Singleton)
// ============================================================================

type CacheStatus = 'idle' | 'loading' | 'loaded' | 'error';

interface CacheEntry {
  status: CacheStatus;
  blobUrl?: string;
}

class ImageCacheStore {
  private cache = new Map<string, CacheEntry>();
  private listeners = new Set<() => void>();

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = () => this.cache;

  getEntry(url: string): CacheEntry | undefined {
    return this.cache.get(url);
  }

  getBlobUrl(url: string): string | undefined {
    return this.cache.get(url)?.blobUrl;
  }

  isLoaded(url: string): boolean {
    return this.cache.get(url)?.status === 'loaded';
  }

  async load(url: string): Promise<string> {
    const existing = this.cache.get(url);

    // Already loaded, return blob URL
    if (existing?.status === 'loaded' && existing.blobUrl) {
      return existing.blobUrl;
    }

    // Already loading, wait for it
    if (existing?.status === 'loading') {
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          const entry = this.cache.get(url);
          if (entry?.status === 'loaded' && entry.blobUrl) {
            clearInterval(checkInterval);
            resolve(entry.blobUrl);
          } else if (entry?.status === 'error') {
            clearInterval(checkInterval);
            resolve(url); // Fallback to original
          }
        }, 50);
      });
    }

    // Start loading
    this.cache.set(url, { status: 'loading' });
    this.notify();

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Fetch failed');

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      this.cache.set(url, { status: 'loaded', blobUrl });
      this.notify();

      return blobUrl;
    } catch {
      this.cache.set(url, { status: 'error' });
      this.notify();
      return url; // Fallback to original URL
    }
  }

  preload(urls: string[]): void {
    urls.forEach((url) => {
      if (!this.cache.has(url)) {
        this.load(url);
      }
    });
  }

  clear(): void {
    this.cache.forEach((entry) => {
      if (entry.blobUrl) {
        URL.revokeObjectURL(entry.blobUrl);
      }
    });
    this.cache.clear();
    this.notify();
  }
}

// Singleton instance
const imageCacheStore = new ImageCacheStore();

// ============================================================================
// CachedAvatar Component
// ============================================================================

const CachedAvatar = memo<CachedAvatarProps>(({ src, ...props }) => {
  // Subscribe to cache changes
  const cache = useSyncExternalStore(
    imageCacheStore.subscribe,
    imageCacheStore.getSnapshot,
  );

  // Get current state for this src
  const entry = src ? cache.get(src) : undefined;
  const displaySrc = entry?.blobUrl ?? src;

  // Trigger load if not cached
  if (src && !entry) {
    imageCacheStore.load(src);
  }

  return <Avatar {...props} src={displaySrc} />;
});

CachedAvatar.displayName = 'CachedAvatar';

export default CachedAvatar;

// ============================================================================
// Exports
// ============================================================================

export const preloadAvatars = (urls: (string | undefined)[]): void => {
  const validUrls = urls.filter((url): url is string => !!url);
  imageCacheStore.preload(validUrls);
};

export const clearAvatarCache = (): void => {
  imageCacheStore.clear();
};
