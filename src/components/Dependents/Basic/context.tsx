/**
 * DependentSelect - Context Provider (Optimized with Class Store)
 *
 * Architecture:
 * - Form library is SOURCE OF TRUTH for values
 * - Store provides: options, loading states, cascade logic
 * - Adapter pattern syncs Store → Form
 *
 * Uses class-based store with useSyncExternalStore for optimal performance.
 * Each field only re-renders when its own value or parent's value changes.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from 'react';

import { DependentSelectStore, type FieldSnapshot } from './store';
import type {
  DependentSelectProviderProps,
  DependentSelectValues,
} from './types';

// ============================================================================
// Context
// ============================================================================

const DependentSelectContext = createContext<DependentSelectStore | null>(null);

// ============================================================================
// Provider
// ============================================================================

export function DependentSelectProvider({
  configs,
  adapter,
  initialValues,
  value: controlledValue,
  children,
}: DependentSelectProviderProps) {
  // Store reference key for configs - recreate store when configs change
  const configsKey = useMemo(
    () => configs.map((c) => c.name).join(','),
    [configs],
  );

  // Create store with proper lifecycle management
  const store = useMemo(() => {
    return new DependentSelectStore(
      configs,
      controlledValue ?? initialValues ?? {},
      adapter,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configsKey]); // Only recreate when configs structure changes

  // Cleanup when store changes or unmount
  useEffect(() => {
    return () => {
      store.destroy();
    };
  }, [store]);

  // Sync controlled value
  useEffect(() => {
    if (controlledValue !== undefined) {
      store.syncControlledValue(controlledValue);
    }
  }, [controlledValue, store]);

  // Update adapter when it changes
  useEffect(() => {
    store.setAdapter(adapter);
  }, [store, adapter]);

  return (
    <DependentSelectContext.Provider value={store}>
      {children}
    </DependentSelectContext.Provider>
  );
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Get the store (for advanced usage)
 */
export function useDependentSelectStore(): DependentSelectStore {
  const store = useContext(DependentSelectContext);
  if (!store) {
    throw new Error(
      'useDependentSelectStore must be used within DependentSelectProvider',
    );
  }
  return store;
}

/**
 * Hook for a specific field - OPTIMIZED
 * Only re-renders when this field's value or its parent's value changes
 */
export function useDependentField(fieldName: string) {
  const store = useDependentSelectStore();

  // Cache for snapshot comparison
  const snapshotCache = useRef<FieldSnapshot | null>(null);

  // Subscribe to this specific field
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      return store.subscribeToField(fieldName, onStoreChange);
    },
    [store, fieldName],
  );

  // Snapshot for this field - returns same reference if values haven't changed
  const getSnapshot = useCallback((): FieldSnapshot => {
    const newSnapshot = store.getFieldSnapshot(fieldName);

    // Return cached snapshot if values are the same
    if (
      snapshotCache.current &&
      snapshotCache.current.value === newSnapshot.value &&
      snapshotCache.current.parentValue === newSnapshot.parentValue &&
      snapshotCache.current.isLoading === newSnapshot.isLoading
    ) {
      return snapshotCache.current;
    }

    // Cache new snapshot
    snapshotCache.current = newSnapshot;
    return newSnapshot;
  }, [store, fieldName]);

  // Use useSyncExternalStore for optimal re-render control
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  // Get static config (doesn't change)
  const config = useMemo(() => store.getConfig(fieldName), [store, fieldName]);

  // Get filtered options (derived from snapshot)
  const options = useMemo(
    () => store.getFilteredOptions(fieldName),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store, fieldName, snapshot.parentValue],
  );

  // Check if disabled by parent
  const isDisabledByParent = useMemo(() => {
    if (!config?.dependsOn) return false;
    const parentValue = snapshot.parentValue;
    return (
      parentValue === undefined ||
      parentValue === null ||
      (Array.isArray(parentValue) && parentValue.length === 0)
    );
  }, [config, snapshot.parentValue]);

  // Stable onChange handler - updates store which notifies adapter
  const handleChange = useCallback(
    (newValue: any) => {
      store.setValue(fieldName, newValue);
    },
    [store, fieldName],
  );

  return {
    config,
    options,
    value: snapshot.value,
    isLoading: snapshot.isLoading,
    isDisabledByParent,
    onChange: handleChange,
  };
}

/**
 * Hook to get all values (will re-render on any change)
 * Use sparingly - prefer useDependentField for individual fields
 */
export function useDependentSelectValues(): DependentSelectValues {
  const store = useDependentSelectStore();

  return useSyncExternalStore(
    store.subscribe,
    store.getValues,
    store.getValues,
  );
}

// Legacy export for backwards compatibility
export const useDependentSelect = useDependentSelectStore;

// Re-export store class for external usage
export { DependentSelectStore } from './store';