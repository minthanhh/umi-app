/**
 * DependentSelect - React Context & Hooks (Optimized)
 *
 * Context Optimization techniques applied:
 * 1. Context Splitting - Separate contexts for store, actions, and config
 *    - Prevents unnecessary re-renders when only one part changes
 *    - Components can subscribe to only what they need
 *
 * 2. Stable Reference Pattern - useMemo/useCallback for context values
 *    - Actions context never changes reference (stable callbacks)
 *    - Config context only changes when configs change
 *
 * 3. Selective Subscription via useSyncExternalStore
 *    - useDependentField only re-renders when specific field changes
 *    - Fine-grained subscriptions at field level
 *
 * Key exports:
 * - DependentSelectProvider: Wrap your dependent selects with this
 * - useDependentField: Subscribe to a single field (optimized)
 * - useDependentStore: Get store instance for advanced operations
 * - useDependentActions: Get stable action functions (never re-renders)
 * - useDependentConfig: Get config for a field
 * - useDependentValues: Get all values (re-renders on any field change)
 */

import {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from 'react';
import type { ReactNode } from 'react';

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
// CONTEXT SPLITTING - Separate contexts for different concerns
// ============================================================================

/**
 * Store Context - provides access to the store instance.
 * Changes when: store is recreated (config structure changes)
 */
const StoreContext = createContext<DependentSelectStore | null>(null);

/**
 * Actions Context - provides stable action functions.
 * Changes when: NEVER (actions are bound to store on creation)
 * This allows components to call actions without re-rendering.
 */
interface ActionsContextValue {
  /** Set value for a field */
  setValue: (fieldName: string, value: unknown) => void;
  /** Set multiple values at once */
  setValues: (values: Partial<DependentFieldValues>) => void;
  /** Set external options for a field */
  setExternalOptions: (fieldName: string, options: SelectOption[]) => void;
  /** Get current value of a field (non-reactive) */
  getValue: (fieldName: string) => unknown;
  /** Get all values (non-reactive) */
  getValues: () => DependentFieldValues;
}

const ActionsContext = createContext<ActionsContextValue | null>(null);

/**
 * Config Context - provides field configurations.
 * Changes when: configs prop changes
 */
interface ConfigContextValue {
  /** Get config for a specific field */
  getConfig: (fieldName: string) => DependentFieldConfig | undefined;
  /** Get all configs */
  getConfigs: () => ReadonlyArray<DependentFieldConfig>;
  /** Check if a field exists */
  hasField: (fieldName: string) => boolean;
}

const ConfigContext = createContext<ConfigContextValue | null>(null);

// ============================================================================
// EMPTY CONSTANTS - Avoid creating new objects on each render
// ============================================================================

const EMPTY_OPTIONS: SelectOption[] = [];

// ============================================================================
// PROVIDER COMPONENT (Optimized with Context Splitting)
// ============================================================================

/**
 * Internal provider that sets up all contexts.
 * Memoized to prevent unnecessary re-renders of children.
 */
interface InternalProviderProps {
  store: DependentSelectStore;
  children: ReactNode;
}

const InternalProvider = memo(function InternalProvider({
  store,
  children,
}: InternalProviderProps) {
  // Create stable actions value (never changes reference)
  const actionsValue = useMemo<ActionsContextValue>(
    () => ({
      setValue: store.setValue,
      setValues: store.setValues,
      setExternalOptions: store.setExternalOptions,
      getValue: (fieldName: string) => store.getFieldSnapshot(fieldName).value,
      getValues: store.getValues,
    }),
    [store],
  );

  // Create stable config value
  const configValue = useMemo<ConfigContextValue>(
    () => ({
      getConfig: store.getConfig,
      getConfigs: store.getConfigs,
      hasField: (fieldName: string) => store.getConfig(fieldName) !== undefined,
    }),
    [store],
  );

  return (
    <StoreContext.Provider value={store}>
      <ActionsContext.Provider value={actionsValue}>
        <ConfigContext.Provider value={configValue}>
          {children}
        </ConfigContext.Provider>
      </ActionsContext.Provider>
    </StoreContext.Provider>
  );
});

/**
 * Provider component that creates and manages the DependentSelectStore.
 *
 * Optimizations:
 * - Context splitting: store, actions, config are separate contexts
 * - Stable references: actions never change, reducing re-renders
 * - Memoized internal provider prevents children re-renders
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

  return <InternalProvider store={store}>{children}</InternalProvider>;
}

// ============================================================================
// HOOKS - Context Access (Optimized)
// ============================================================================

/**
 * Get the store instance directly.
 * Use this for advanced operations or when you need low-level access.
 *
 * @throws Error if used outside of DependentSelectProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const store = useDependentStore();
 *   // Direct store access for advanced use cases
 * }
 * ```
 */
export function useDependentStore(): DependentSelectStore {
  const store = useContext(StoreContext);

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
 */
export function useDependentStoreOptional(): DependentSelectStore | null {
  return useContext(StoreContext);
}

/**
 * Get stable action functions.
 * These functions NEVER change reference, so components using only actions
 * will never re-render due to context changes.
 *
 * @throws Error if used outside of DependentSelectProvider
 *
 * @example
 * ```tsx
 * function ResetButton() {
 *   // This component will NEVER re-render due to context changes
 *   const { setValue } = useDependentActions();
 *
 *   return (
 *     <button onClick={() => setValue('country', undefined)}>
 *       Reset Country
 *     </button>
 *   );
 * }
 * ```
 */
export function useDependentActions(): ActionsContextValue {
  const actions = useContext(ActionsContext);

  if (!actions) {
    throw new Error(
      '[DependentSelect] useDependentActions must be used within DependentSelectProvider',
    );
  }

  return actions;
}

/**
 * Get config access functions.
 * Changes only when configs prop changes.
 *
 * @throws Error if used outside of DependentSelectProvider
 *
 * @example
 * ```tsx
 * function FieldLabel({ fieldName }: { fieldName: string }) {
 *   const { getConfig } = useDependentConfig();
 *   const config = getConfig(fieldName);
 *   return <label>{config?.label}</label>;
 * }
 * ```
 */
export function useDependentConfig(): ConfigContextValue {
  const config = useContext(ConfigContext);

  if (!config) {
    throw new Error(
      '[DependentSelect] useDependentConfig must be used within DependentSelectProvider',
    );
  }

  return config;
}

// ============================================================================
// HOOKS - Field Subscription (Selective Subscription Pattern)
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

  /**
   * Parent field's value (for dependent fields).
   * - Single dependency: value of that parent field
   * - Multiple dependencies: object { [fieldName]: value }
   */
  parentValue: unknown;

  /**
   * Object containing all parent values.
   * Only populated when dependsOn is an array.
   */
  parentValues?: Record<string, unknown>;

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
 * Optimizations:
 * - Selective subscription: only re-renders when THIS field changes
 * - useSyncExternalStore for concurrent mode compatibility
 * - Stable onChange callback (memoized)
 * - External options sync during render (no extra effect)
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

  // Subscribe function for useSyncExternalStore (stable reference)
  const subscribeToField = useCallback(
    (onStoreChange: () => void) => store.subscribe(fieldName, onStoreChange),
    [store, fieldName],
  );

  // Snapshot getter for useSyncExternalStore (stable reference)
  const getFieldSnapshot = useCallback(
    (): DependentFieldSnapshot => store.getFieldSnapshot(fieldName),
    [store, fieldName],
  );

  // Subscribe to field changes with useSyncExternalStore
  // This provides selective subscription - only re-renders when this field changes
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
  const filteredOptions = useMemo(() => {
    const options = store.getOptions(fieldName, externalOptions);
    return options.length > 0 ? options : EMPTY_OPTIONS;
  }, [store, fieldName, fieldSnapshot.parentValue, externalOptions]);

  // Check if disabled because parent has no value
  // For multiple parents (dependsOn is array): disabled if ANY parent has no value
  const isDisabledByParent = useMemo(() => {
    // Not disabled if no parent dependency
    if (!fieldConfig?.dependsOn) return false;

    const parentVal = fieldSnapshot.parentValue;

    // For multiple parents, parentValue is an object { [fieldName]: value }
    if (
      typeof parentVal === 'object' &&
      parentVal !== null &&
      !Array.isArray(parentVal)
    ) {
      // Check if ANY parent value is empty
      const values = Object.values(parentVal as Record<string, unknown>);
      return values.some(
        (v) =>
          v === undefined ||
          v === null ||
          (Array.isArray(v) && v.length === 0),
      );
    }

    // Single parent: disabled if parent is undefined, null, or empty array
    return (
      parentVal === undefined ||
      parentVal === null ||
      (Array.isArray(parentVal) && parentVal.length === 0)
    );
  }, [fieldConfig?.dependsOn, fieldSnapshot.parentValue]);

  // Change handler (stable reference via useCallback)
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
    parentValues: fieldSnapshot.parentValues,
    isLoading: fieldSnapshot.isLoading,
    isDisabledByParent,
    onChange: handleChange,
  };
}

// ============================================================================
// HOOKS - Selective Field Subscriptions
// ============================================================================

/**
 * Subscribe to only the value of a field.
 * More granular than useDependentField - doesn't include options.
 *
 * @example
 * ```tsx
 * function ValueDisplay({ fieldName }: { fieldName: string }) {
 *   const value = useDependentValue(fieldName);
 *   return <span>{String(value)}</span>;
 * }
 * ```
 */
export function useDependentValue(fieldName: string): unknown {
  const store = useDependentStore();

  const subscribe = useCallback(
    (onStoreChange: () => void) => store.subscribe(fieldName, onStoreChange),
    [store, fieldName],
  );

  const getSnapshot = useCallback(
    () => store.getFieldSnapshot(fieldName).value,
    [store, fieldName],
  );

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * Subscribe to only the loading state of a field.
 *
 * @example
 * ```tsx
 * function LoadingIndicator({ fieldName }: { fieldName: string }) {
 *   const isLoading = useDependentLoading(fieldName);
 *   return isLoading ? <Spinner /> : null;
 * }
 * ```
 */
export function useDependentLoading(fieldName: string): boolean {
  const store = useDependentStore();

  const subscribe = useCallback(
    (onStoreChange: () => void) => store.subscribe(fieldName, onStoreChange),
    [store, fieldName],
  );

  const getSnapshot = useCallback(
    () => store.getFieldSnapshot(fieldName).isLoading,
    [store, fieldName],
  );

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * Subscribe to only the parent value of a field.
 * Useful when you need to react to parent changes without full field state.
 *
 * @example
 * ```tsx
 * function ParentValueWatcher({ fieldName }: { fieldName: string }) {
 *   const parentValue = useDependentParentValue(fieldName);
 *   // Fetch options based on parent value
 *   const { data } = useQuery(['options', parentValue], ...);
 * }
 * ```
 */
export function useDependentParentValue(fieldName: string): unknown {
  const store = useDependentStore();

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const config = store.getConfig(fieldName);
      if (!config?.dependsOn) {
        // No parent - subscribe to self (will never trigger for parent changes)
        return store.subscribe(fieldName, onStoreChange);
      }

      // Subscribe to parent field(s)
      const parentNames = Array.isArray(config.dependsOn)
        ? config.dependsOn
        : [config.dependsOn];

      // Subscribe to all parent fields
      const unsubscribes = parentNames.map((name) =>
        store.subscribe(name, onStoreChange),
      );

      // Return cleanup function that unsubscribes from all
      return () => {
        unsubscribes.forEach((unsubscribe) => unsubscribe());
      };
    },
    [store, fieldName],
  );

  const getSnapshot = useCallback(
    () => store.getFieldSnapshot(fieldName).parentValue,
    [store, fieldName],
  );

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

// ============================================================================
// HOOKS - All Values (Use sparingly)
// ============================================================================

/**
 * Hook to get all field values.
 *
 * WARNING: This will re-render on ANY field change.
 * Prefer useDependentField or useDependentValue for individual fields.
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

// Legacy context export for backward compatibility
export const DependentStoreContext = StoreContext;