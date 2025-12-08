import { useState, useEffect, useCallback } from 'react';

export interface CacheInfo {
  name: string;
  count: number;
  size?: string;
}

export interface SWStatus {
  isSupported: boolean;
  isRegistered: boolean;
  isActive: boolean;
  isWaiting: boolean;
  isInstalling: boolean;
  registration: ServiceWorkerRegistration | null;
  controller: ServiceWorker | null;
  error: string | null;
}

export interface UseServiceWorkerReturn {
  status: SWStatus;
  caches: CacheInfo[];
  isLoading: boolean;
  update: () => Promise<void>;
  unregister: () => Promise<boolean>;
  skipWaiting: () => void;
  clearCache: (cacheName?: string) => Promise<void>;
  refreshCaches: () => Promise<void>;
}

const initialStatus: SWStatus = {
  isSupported: false,
  isRegistered: false,
  isActive: false,
  isWaiting: false,
  isInstalling: false,
  registration: null,
  controller: null,
  error: null,
};

export function useServiceWorker(): UseServiceWorkerReturn {
  const [status, setStatus] = useState<SWStatus>(initialStatus);
  const [caches, setCaches] = useState<CacheInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const updateStatus = useCallback(async () => {
    if (!('serviceWorker' in navigator)) {
      setStatus({ ...initialStatus, isSupported: false });
      setIsLoading(false);
      return;
    }

    try {
      const registration = await navigator.serviceWorker.getRegistration();

      setStatus({
        isSupported: true,
        isRegistered: !!registration,
        isActive: !!registration?.active,
        isWaiting: !!registration?.waiting,
        isInstalling: !!registration?.installing,
        registration: registration || null,
        controller: navigator.serviceWorker.controller,
        error: null,
      });
    } catch (err) {
      setStatus({
        ...initialStatus,
        isSupported: true,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshCaches = useCallback(async () => {
    if (!('caches' in window)) {
      setCaches([]);
      return;
    }

    try {
      const cacheNames = await window.caches.keys();
      const cacheInfos: CacheInfo[] = await Promise.all(
        cacheNames.map(async (name) => {
          const cache = await window.caches.open(name);
          const keys = await cache.keys();
          console.log({ cache, name, keys });
          return {
            name,
            count: keys.length,
          };
        }),
      );
      setCaches(cacheInfos);
    } catch (err) {
      console.error('Failed to get cache info:', err);
      setCaches([]);
    }
  }, []);

  const update = useCallback(async () => {
    if (!status.registration) return;

    try {
      await status.registration.update();
      await updateStatus();
    } catch (err) {
      console.error('Failed to update SW:', err);
    }
  }, [status.registration, updateStatus]);

  const unregister = useCallback(async (): Promise<boolean> => {
    if (!status.registration) return false;

    try {
      const result = await status.registration.unregister();
      if (result) {
        await updateStatus();
        await refreshCaches();
      }
      return result;
    } catch (err) {
      console.error('Failed to unregister SW:', err);
      return false;
    }
  }, [status.registration, updateStatus, refreshCaches]);

  const skipWaiting = useCallback(() => {
    if (!status.registration?.waiting) return;

    status.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }, [status.registration]);

  const clearCache = useCallback(
    async (cacheName?: string) => {
      if (!('caches' in window)) return;

      try {
        if (cacheName) {
          await window.caches.delete(cacheName);
        } else {
          const names = await window.caches.keys();
          await Promise.all(names.map((name) => window.caches.delete(name)));
        }
        await refreshCaches();
      } catch (err) {
        console.error('Failed to clear cache:', err);
      }
    },
    [refreshCaches],
  );

  useEffect(() => {
    updateStatus();
    refreshCaches();

    if ('serviceWorker' in navigator) {
      const handleControllerChange = () => {
        updateStatus();
      };

      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

      return () => {
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      };
    }
  }, [updateStatus, refreshCaches]);

  useEffect(() => {
    if (!status.registration) return;

    const handleStateChange = () => {
      updateStatus();
    };

    status.registration.addEventListener('updatefound', handleStateChange);

    if (status.registration.installing) {
      status.registration.installing.addEventListener('statechange', handleStateChange);
    }
    if (status.registration.waiting) {
      status.registration.waiting.addEventListener('statechange', handleStateChange);
    }
    if (status.registration.active) {
      status.registration.active.addEventListener('statechange', handleStateChange);
    }

    return () => {
      status.registration?.removeEventListener('updatefound', handleStateChange);
    };
  }, [status.registration, updateStatus]);

  return {
    status,
    caches,
    isLoading,
    update,
    unregister,
    skipWaiting,
    clearCache,
    refreshCaches,
  };
}
