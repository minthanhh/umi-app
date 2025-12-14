/**
 * SmartSelect Context & Provider
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

import { SmartSelectStore } from './store';
import type {
  SelectValue,
  SmartSelectContextValue,
  SmartSelectProviderProps,
} from './types';

// ============================================================================
// Context
// ============================================================================

const SmartSelectContext = createContext<SmartSelectStore | null>(null);

// ============================================================================
// Provider
// ============================================================================

export function SmartSelectProvider({
  config,
  adapter,
  initialValues,
  values: controlledValues,
  onValuesChange,
  children,
}: SmartSelectProviderProps) {
  // Create stable key for config to detect changes
  const configKey = useMemo(() => {
    if (!config) return '';
    const infiniteKeys = Object.keys(config.infiniteConfigs ?? {}).join(',');
    const depKeys = Object.keys(config.dependencyConfigs ?? {}).join(',');
    return `${infiniteKeys}|${depKeys}`;
  }, [config]);

  // Create store
  const store = useMemo(() => {
    return new SmartSelectStore(
      config,
      controlledValues ?? initialValues,
      adapter,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configKey]);

  // Cleanup
  useEffect(() => {
    return () => {
      store.destroy();
    };
  }, [store]);

  // Sync controlled values
  useEffect(() => {
    if (controlledValues) {
      store.setValues(controlledValues);
    }
  }, [controlledValues, store]);

  // Update adapter
  useEffect(() => {
    store.setAdapter(adapter);
  }, [store, adapter]);

  // Subscribe to changes for onValuesChange
  useEffect(() => {
    if (!onValuesChange) return;

    return store.subscribe(() => {
      onValuesChange(store.getValues());
    });
  }, [store, onValuesChange]);

  return (
    <SmartSelectContext.Provider value={store}>
      {children}
    </SmartSelectContext.Provider>
  );
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Get the store instance
 */
export function useSmartSelectStore(): SmartSelectStore {
  const store = useContext(SmartSelectContext);
  if (!store) {
    throw new Error(
      'useSmartSelectStore must be used within SmartSelectProvider',
    );
  }
  return store;
}

/**
 * Get store if available (returns null if not in provider)
 */
export function useSmartSelectStoreOptional(): SmartSelectStore | null {
  return useContext(SmartSelectContext);
}

/**
 * Hook for field value with subscription
 */
export function useFieldValue(name: string): SelectValue {
  const store = useSmartSelectStore();

  const subscribe = useCallback(
    (callback: () => void) => store.subscribeToField(name, callback),
    [store, name],
  );

  const getSnapshot = useCallback(() => store.getValue(name), [store, name]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * Hook for multiple field values
 */
export function useFieldValues(names: string[]): Record<string, SelectValue> {
  const store = useSmartSelectStore();

  const subscribe = useCallback(
    (callback: () => void) => store.subscribeToFields(names, callback),
    [store, names],
  );

  const snapshotRef = useRef<Record<string, SelectValue>>({});

  const getSnapshot = useCallback(() => {
    const newValues: Record<string, SelectValue> = {};
    names.forEach((name) => {
      newValues[name] = store.getValue(name);
    });

    // Check if values changed
    const hasChanged = names.some(
      (name) => snapshotRef.current[name] !== newValues[name],
    );

    if (hasChanged) {
      snapshotRef.current = newValues;
    }

    return snapshotRef.current;
  }, [store, names]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * Hook to check if dependencies are satisfied
 */
export function useDependencySatisfied(fieldName: string): boolean {
  const store = useSmartSelectStore();

  // Get dependency names
  const config = store.getDependencyConfig(fieldName);
  const deps = config?.dependsOn
    ? Array.isArray(config.dependsOn)
      ? config.dependsOn
      : [config.dependsOn]
    : [];

  const subscribe = useCallback(
    (callback: () => void) => store.subscribeToFields(deps, callback),
    [store, deps],
  );

  const getSnapshot = useCallback(
    () => store.isDependencySatisfied(fieldName),
    [store, fieldName],
  );

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

// ============================================================================
// Context Value Hook (for advanced usage)
// ============================================================================

export function useSmartSelectContext(): SmartSelectContextValue {
  const store = useSmartSelectStore();

  return useMemo(
    (): SmartSelectContextValue => ({
      getValue: store.getValue,
      setValue: store.setValue,
      getValues: store.getValues,
      getInfiniteConfig: store.getInfiniteConfig,
      getDependencyConfig: store.getDependencyConfig,
      subscribeToField: store.subscribeToField,
      subscribeToFields: store.subscribeToFields,
    }),
    [store],
  );
}
