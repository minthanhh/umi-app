/**
 * DependentFieldProvider - Context and Provider
 *
 * Provides the store to all child components via React Context.
 * Manages store lifecycle and synchronization.
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

import { DependentFieldStore } from './store';
import type {
  DependentFieldProviderProps,
  FieldValue,
  FieldValues,
  UseDependentFieldReturn,
} from './types';

// ============================================================================
// Context
// ============================================================================

const DependentFieldContext = createContext<DependentFieldStore | null>(null);

// ============================================================================
// Provider
// ============================================================================

export function DependentFieldProvider({
  configs,
  initialValues,
  value: controlledValue,
  onChange,
  adapter,
  children,
}: DependentFieldProviderProps) {
  // Create stable key from config names to detect config changes
  const configsKey = useMemo(
    () => configs.map((c) => c.name).join(','),
    [configs],
  );

  // Create store instance
  const store = useMemo(() => {
    return new DependentFieldStore(
      configs,
      controlledValue ?? initialValues,
      adapter,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configsKey]);

  // Subscribe to store changes and call onChange
  useEffect(() => {
    if (!onChange) return;

    const unsubscribe = store.subscribe(() => {
      onChange(store.getValues());
    });

    return unsubscribe;
  }, [store, onChange]);

  // Sync controlled value
  useEffect(() => {
    if (controlledValue !== undefined) {
      store.reset(controlledValue);
    }
  }, [controlledValue, store]);

  // Update adapter when it changes
  useEffect(() => {
    store.setAdapter(adapter);
  }, [store, adapter]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      store.destroy();
    };
  }, [store]);

  return (
    <DependentFieldContext.Provider value={store}>
      {children}
    </DependentFieldContext.Provider>
  );
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Get the raw store instance
 */
export function useDependentFieldStore(): DependentFieldStore {
  const store = useContext(DependentFieldContext);
  if (!store) {
    throw new Error(
      'useDependentFieldStore must be used within DependentFieldProvider',
    );
  }
  return store;
}

/**
 * Hook for a single dependent field
 *
 * @example
 * ```tsx
 * function CitySelect() {
 *   const { value, onSyncStore, dependencyValues, isDependencySatisfied } =
 *     useDependentField<string>('city');
 *
 *   return (
 *     <Select
 *       value={value}
 *       onChange={onSyncStore}
 *       disabled={!isDependencySatisfied}
 *     />
 *   );
 * }
 * ```
 */
export function useDependentField<T extends FieldValue = FieldValue>(
  fieldName: string,
): UseDependentFieldReturn<T> {
  const store = useDependentFieldStore();

  // Subscribe to field changes
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      // Subscribe to this field
      const unsubscribeField = store.subscribeToField(fieldName, onStoreChange);

      // Also subscribe to dependency fields
      const config = store.getConfig(fieldName);
      const deps = config?.dependsOn
        ? Array.isArray(config.dependsOn)
          ? config.dependsOn
          : [config.dependsOn]
        : [];

      const unsubscribeDeps = deps.map((dep) =>
        store.subscribeToField(dep, onStoreChange),
      );

      return () => {
        unsubscribeField();
        unsubscribeDeps.forEach((fn) => fn());
      };
    },
    [store, fieldName],
  );

  // Get value - must return stable reference
  const value = useSyncExternalStore(
    subscribe,
    () => store.getValue(fieldName),
    () => store.getValue(fieldName),
  ) as T | T[] | undefined;

  // Get dependency values - use ref to cache
  const dependencyValues = store.getDependencyValues(fieldName);

  // Stable setValue
  const setValue = useCallback(
    (newValue: T | T[] | undefined) => {
      store.setValue(fieldName, newValue);
    },
    [store, fieldName],
  );

  // onSyncStore is the same as setValue - it's the callback for onChange
  const onSyncStore = setValue;

  // Computed values
  const hasDependencies = store.hasDependencies(fieldName);
  const isDependencySatisfied = store.isDependencySatisfied(fieldName);

  return {
    value,
    setValue,
    onSyncStore,
    dependencyValues,
    hasDependencies,
    isDependencySatisfied,
  };
}

/**
 * Hook to get all field values
 * Note: This will re-render on any field change
 */
export function useDependentFieldValues(): FieldValues {
  const store = useDependentFieldStore();

  // Cache the snapshot reference
  const snapshotRef = useRef<FieldValues>({});

  const getSnapshot = useCallback(() => {
    const newValues = store.getValues();

    // Check if values actually changed
    const keys = Object.keys(newValues);
    const oldKeys = Object.keys(snapshotRef.current);

    if (keys.length !== oldKeys.length) {
      snapshotRef.current = newValues;
      return snapshotRef.current;
    }

    for (const key of keys) {
      if (snapshotRef.current[key] !== newValues[key]) {
        snapshotRef.current = newValues;
        return snapshotRef.current;
      }
    }

    return snapshotRef.current;
  }, [store]);

  return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
}