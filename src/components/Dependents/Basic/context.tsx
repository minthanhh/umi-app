/**
 * DependentSelect - React Context & Hooks
 *
 * Provides React integration via Context and useSyncExternalStore.
 *
 * Key exports:
 * - DependentSelectProvider: Wrap your dependent selects with this
 * - useDependentField: Subscribe to a single field (optimized - only re-renders when field changes)
 * - useDependentStore: Get store instance for advanced operations
 * - useDependentValues: Get all values (re-renders on any field change)
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

import { DependentSelectStore } from './store';
import type {
  DependentFieldConfig,
  DependentFieldSnapshot,
  DependentFieldValues,
  DependentSelectProviderProps,
  SelectOption,
} from './types';

// Re-export SelectOption for use with useRef type
export type { SelectOption } from './types';

// ============================================================================
// CONTEXT
// ============================================================================

/**
 * Context for sharing the store instance across components.
 * null when used outside of provider.
 */
const DependentStoreContext = createContext<DependentSelectStore | null>(null);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

/**
 * Provider component that creates and manages the DependentSelectStore.
 *
 * Responsibilities:
 * - Create store instance when configs change
 * - Cleanup store on unmount
 * - Sync controlled values
 * - Update adapter when it changes
 *
 * @example Basic usage
 * ```tsx
 * const configs = [
 *   { name: 'country', options: countries },
 *   { name: 'province', dependsOn: 'country', options: provinces },
 * ];
 *
 * <DependentSelectProvider configs={configs} adapter={formAdapter}>
 *   <CountrySelect />
 *   <ProvinceSelect />
 * </DependentSelectProvider>
 * ```
 *
 * @example With controlled values
 * ```tsx
 * const [values, setValues] = useState({ country: 'VN' });
 *
 * <DependentSelectProvider configs={configs} value={values}>
 *   ...
 * </DependentSelectProvider>
 * ```
 */
export function DependentSelectProvider({
  configs,
  adapter,
  initialValues,
  value: controlledValue,
  children,
}: DependentSelectProviderProps) {
  // Create stable key from config names (for store recreation on config structure change)
  const configsKey = useMemo(
    () => configs.map((config) => config.name).join(','),
    [configs],
  );

  // Create store instance (recreate only when configs structure changes)
  const store = useMemo(
    () =>
      new DependentSelectStore(
        configs,
        controlledValue ?? initialValues ?? {},
        adapter,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [configsKey], // Only recreate when config names change
  );

  // Cleanup store on unmount or when store changes
  useEffect(() => {
    return () => store.destroy();
  }, [store]);

  // Sync controlled value when it changes (controlled mode)
  useEffect(() => {
    if (controlledValue !== undefined) {
      store.syncControlledValue(controlledValue);
    }
  }, [controlledValue, store]);

  // Update adapter when it changes
  useEffect(() => {
    store.setAdapter(adapter);
  }, [adapter, store]);

  return (
    <DependentStoreContext.Provider value={store}>
      {children}
    </DependentStoreContext.Provider>
  );
}

// ============================================================================
// HOOKS - Store Access
// ============================================================================

/**
 * Get the store instance directly.
 * Use this for advanced operations like setValue, setExternalOptions.
 *
 * @throws Error if used outside of DependentSelectProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const store = useDependentStore();
 *
 *   const handleReset = () => {
 *     store.setValue('country', undefined);
 *   };
 *
 *   return <button onClick={handleReset}>Reset</button>;
 * }
 * ```
 */
export function useDependentStore(): DependentSelectStore {
  const store = useContext(DependentStoreContext);

  if (!store) {
    throw new Error(
      '[DependentSelect] useDependentStore must be used within DependentSelectProvider',
    );
  }

  return store;
}

/**
 * Get the store instance if available (returns null if not inside provider).
 * Use this when you need optional store access without throwing.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const store = useDependentStoreOptional();
 *
 *   // Safe to use without provider
 *   if (store) {
 *     store.setExternalOptions('field', options);
 *   }
 * }
 * ```
 */
export function useDependentStoreOptional(): DependentSelectStore | null {
  return useContext(DependentStoreContext);
}

// ============================================================================
// HOOKS - Field Subscription
// ============================================================================

/**
 * Options for useDependentField hook.
 */
export interface UseDependentFieldOptions {
  /** External options (overrides config.options) */
  options?: SelectOption[];
}

/**
 * Return type for useDependentField hook.
 */
export interface UseDependentFieldResult {
  /** Field configuration from provider */
  config: DependentFieldConfig | undefined;

  /** Filtered options for this field (based on parent value) */
  options: SelectOption[];

  /** Current value from store */
  value: unknown;

  /** Parent field's value (for dependent fields) */
  parentValue: unknown;

  /** Whether async options are loading */
  isLoading: boolean;

  /** Whether field is disabled because parent has no value */
  isDisabledByParent: boolean;

  /** Change handler - updates store and triggers cascade */
  onChange: (value: unknown) => void;
}

/**
 * Hook for subscribing to a specific field.
 *
 * Optimized: only re-renders when THIS field's snapshot changes.
 * Uses useSyncExternalStore for concurrent mode compatibility.
 *
 * @param fieldName - Name of the field to subscribe to
 * @param hookOptions - Optional configuration (external options)
 * @returns Field state and handlers
 *
 * @example Basic usage
 * ```tsx
 * function CountrySelect() {
 *   const { options, value, onChange, isLoading } = useDependentField('country');
 *
 *   return (
 *     <Select
 *       value={value}
 *       onChange={onChange}
 *       options={options}
 *       loading={isLoading}
 *     />
 *   );
 * }
 * ```
 *
 * @example With external options (React Query)
 * ```tsx
 * function ProvinceSelect() {
 *   const { parentValue } = useDependentField('province');
 *   const { data: provinces } = useQuery(['provinces', parentValue], ...);
 *
 *   const { options, value, onChange } = useDependentField('province', {
 *     options: provinces,
 *   });
 *
 *   return <Select value={value} onChange={onChange} options={options} />;
 * }
 * ```
 */
export function useDependentField(
  fieldName: string,
  hookOptions?: UseDependentFieldOptions,
): UseDependentFieldResult {
  const store = useDependentStore();
  const externalOptions = hookOptions?.options;

  // Subscribe function for useSyncExternalStore
  const subscribeToField = useCallback(
    (onStoreChange: () => void) => store.subscribe(fieldName, onStoreChange),
    [store, fieldName],
  );

  // Snapshot getter for useSyncExternalStore
  const getFieldSnapshot = useCallback(
    (): DependentFieldSnapshot => store.getFieldSnapshot(fieldName),
    [store, fieldName],
  );

  // Subscribe to field changes with useSyncExternalStore
  const fieldSnapshot = useSyncExternalStore(
    subscribeToField,
    getFieldSnapshot,
    getFieldSnapshot, // Server snapshot (same as client for this use case)
  );

  // Get config (stable reference from store)
  const fieldConfig = useMemo(
    () => store.getConfig(fieldName),
    [store, fieldName],
  );

  // Get filtered options (recalculate when parent value or external options change)
  const filteredOptions = useMemo(
    () => store.getOptions(fieldName, externalOptions),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store, fieldName, fieldSnapshot.parentValue, externalOptions],
  );

  // Check if disabled because parent has no value
  const isDisabledByParent = useMemo(() => {
    // Not disabled if no parent dependency
    if (!fieldConfig?.dependsOn) return false;

    const parentVal = fieldSnapshot.parentValue;

    // Disabled if parent is undefined, null, or empty array
    return (
      parentVal === undefined ||
      parentVal === null ||
      (Array.isArray(parentVal) && parentVal.length === 0)
    );
  }, [fieldConfig?.dependsOn, fieldSnapshot.parentValue]);

  // Change handler (stable reference)
  const handleChange = useCallback(
    (newValue: unknown) => store.setValue(fieldName, newValue),
    [store, fieldName],
  );

  // Sync external options to store SYNCHRONOUSLY during render
  // This avoids extra render cycle from useEffect
  // Use ref to track previous options and only sync when changed
  const previousOptionsRef = useRef<SelectOption[] | undefined>(undefined);
  if (externalOptions !== previousOptionsRef.current) {
    previousOptionsRef.current = externalOptions;
    if (externalOptions) {
      // Sync immediately during render (before commit phase)
      // This is safe because setExternalOptions only updates a Map
      // and doesn't trigger React state updates or side effects
      store.setExternalOptions(fieldName, externalOptions);
    }
  }

  return {
    config: fieldConfig,
    options: filteredOptions,
    value: fieldSnapshot.value,
    parentValue: fieldSnapshot.parentValue,
    isLoading: fieldSnapshot.isLoading,
    isDisabledByParent,
    onChange: handleChange,
  };
}

// ============================================================================
// HOOKS - All Values
// ============================================================================

/**
 * Hook to get all field values.
 *
 * WARNING: This will re-render on ANY field change.
 * Prefer useDependentField for individual fields to avoid unnecessary re-renders.
 *
 * @returns Object containing all field values
 *
 * @example
 * ```tsx
 * function DebugPanel() {
 *   const values = useDependentValues();
 *   return <pre>{JSON.stringify(values, null, 2)}</pre>;
 * }
 * ```
 */
export function useDependentValues(): DependentFieldValues {
  const store = useDependentStore();

  // Subscribe to ALL fields
  const subscribeToAllFields = useCallback(
    (onStoreChange: () => void) => {
      const configs = store.getConfigs();

      // Subscribe to each field
      const unsubscribeFunctions = configs.map((config) =>
        store.subscribe(config.name, onStoreChange),
      );

      // Return cleanup function
      return () => {
        unsubscribeFunctions.forEach((unsubscribe) => unsubscribe());
      };
    },
    [store],
  );

  return useSyncExternalStore(
    subscribeToAllFields,
    store.getValues,
    store.getValues, // Server snapshot
  );
}

// ============================================================================
// BACKWARD COMPATIBILITY ALIASES
// ============================================================================

/**
 * @deprecated Use UseDependentFieldResult instead
 */
export type UseDependentFieldReturn = UseDependentFieldResult;