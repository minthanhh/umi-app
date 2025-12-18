/**
 * XSelect - React Context & Hooks
 *
 * Context optimization techniques:
 * 1. Context Splitting - Separate contexts for store, actions, and config
 * 2. Stable Reference Pattern - useMemo/useCallback for context values
 * 3. Selective Subscription via useSyncExternalStore
 *
 * Key exports:
 * - XSelectProvider: Provider component
 * - useXSelectField: Subscribe to a single field (optimized)
 * - useXSelectStore: Get store instance
 * - useXSelectActions: Get stable action functions
 * - useXSelectConfig: Get config for a field
 * - useXSelectValues: Get all values
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

import { XSelectStore } from '../store';
import type {
  FieldConfig,
  FieldSnapshot,
  FieldValues,
  FormAdapter,
  XSelectOption,
} from '../types';

// ============================================================================
// CONTEXT DEFINITIONS
// ============================================================================

/**
 * Store Context
 */
const StoreContext = createContext<XSelectStore | null>(null);

/**
 * Actions Context - stable action functions
 */
interface ActionsContextValue {
  setValue: (fieldName: string, value: unknown) => void;
  setValues: (values: Partial<FieldValues>) => void;
  setExternalOptions: (fieldName: string, options: XSelectOption[]) => void;
  getValue: (fieldName: string) => unknown;
  getValues: () => FieldValues;
}

const ActionsContext = createContext<ActionsContextValue | null>(null);

/**
 * Config Context
 */
interface ConfigContextValue {
  getConfig: (fieldName: string) => FieldConfig | undefined;
  getConfigs: () => ReadonlyArray<FieldConfig>;
  hasField: (fieldName: string) => boolean;
}

const ConfigContext = createContext<ConfigContextValue | null>(null);

// ============================================================================
// CONSTANTS
// ============================================================================

const EMPTY_OPTIONS: XSelectOption[] = [];

// ============================================================================
// PROVIDER PROPS
// ============================================================================

export interface XSelectProviderProps {
  /** Field configurations */
  configs: FieldConfig[];

  /** Form adapter */
  adapter?: FormAdapter;

  /** Initial values (uncontrolled) */
  initialValues?: FieldValues;

  /** Controlled values */
  value?: FieldValues;

  /** React children */
  children: ReactNode;
}

// ============================================================================
// INTERNAL PROVIDER
// ============================================================================

interface InternalProviderProps {
  store: XSelectStore;
  children: ReactNode;
}

const InternalProvider = memo(function InternalProvider({
  store,
  children,
}: InternalProviderProps) {
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

// ============================================================================
// MAIN PROVIDER
// ============================================================================

/**
 * XSelectProvider - Provider component for cascading selects.
 *
 * @example
 * ```tsx
 * const configs = [
 *   { name: 'country', options: countries },
 *   { name: 'province', dependsOn: 'country', options: provinces },
 * ];
 *
 * <XSelectProvider configs={configs} adapter={formAdapter}>
 *   <CountrySelect />
 *   <ProvinceSelect />
 * </XSelectProvider>
 * ```
 */
export function XSelectProvider({
  configs,
  adapter,
  initialValues,
  value: controlledValue,
  children,
}: XSelectProviderProps) {
  // Create stable key from config names
  const configsKey = useMemo(
    () => configs.map((config) => config.name).join(','),
    [configs],
  );

  // Create store instance
  const store = useMemo(
    () =>
      new XSelectStore(
        configs,
        controlledValue ?? initialValues ?? {},
        adapter,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [configsKey],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => store.destroy();
  }, [store]);

  // Sync controlled value
  useEffect(() => {
    if (controlledValue !== undefined) {
      store.syncControlledValue(controlledValue);
    }
  }, [controlledValue, store]);

  // Update adapter
  useEffect(() => {
    store.setAdapter(adapter);
  }, [adapter, store]);

  return <InternalProvider store={store}>{children}</InternalProvider>;
}

// ============================================================================
// HOOKS - Context Access
// ============================================================================

/**
 * Get the store instance.
 */
export function useXSelectStore(): XSelectStore {
  const store = useContext(StoreContext);

  if (!store) {
    throw new Error('[XSelect] useXSelectStore must be used within XSelectProvider');
  }

  return store;
}

/**
 * Get store instance if available (optional).
 */
export function useXSelectStoreOptional(): XSelectStore | null {
  return useContext(StoreContext);
}

/**
 * Get stable action functions.
 * These never change reference.
 */
export function useXSelectActions(): ActionsContextValue {
  const actions = useContext(ActionsContext);

  if (!actions) {
    throw new Error('[XSelect] useXSelectActions must be used within XSelectProvider');
  }

  return actions;
}

/**
 * Get config access functions.
 */
export function useXSelectConfig(): ConfigContextValue {
  const config = useContext(ConfigContext);

  if (!config) {
    throw new Error('[XSelect] useXSelectConfig must be used within XSelectProvider');
  }

  return config;
}

// ============================================================================
// HOOKS - Field Subscription
// ============================================================================

export interface UseXSelectFieldOptions {
  /** External options (overrides config.options) */
  options?: XSelectOption[];
}

export interface UseXSelectFieldResult {
  /** Field config */
  config: FieldConfig | undefined;

  /** Filtered options */
  options: XSelectOption[];

  /** Current value */
  value: unknown;

  /** Parent value */
  parentValue: unknown;

  /** All parent values (when dependsOn is array) */
  parentValues?: Record<string, unknown>;

  /** Loading state */
  isLoading: boolean;

  /** Disabled by parent */
  isDisabledByParent: boolean;

  /** Change handler */
  onChange: (value: unknown) => void;
}

/**
 * Hook for subscribing to a specific field.
 *
 * @example
 * ```tsx
 * function CountrySelect() {
 *   const { options, value, onChange, isLoading } = useXSelectField('country');
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
 */
export function useXSelectField(
  fieldName: string,
  hookOptions?: UseXSelectFieldOptions,
): UseXSelectFieldResult {
  const store = useXSelectStore();
  const externalOptions = hookOptions?.options;

  // Subscribe function
  const subscribeToField = useCallback(
    (onStoreChange: () => void) => store.subscribe(fieldName, onStoreChange),
    [store, fieldName],
  );

  // Snapshot getter
  const getFieldSnapshot = useCallback(
    (): FieldSnapshot => store.getFieldSnapshot(fieldName),
    [store, fieldName],
  );

  // Subscribe to changes
  const fieldSnapshot = useSyncExternalStore(
    subscribeToField,
    getFieldSnapshot,
    getFieldSnapshot,
  );

  // Get config
  const fieldConfig = useMemo(
    () => store.getConfig(fieldName),
    [store, fieldName],
  );

  // Get filtered options
  const filteredOptions = useMemo(() => {
    const options = store.getOptions(fieldName, externalOptions);
    return options.length > 0 ? options : EMPTY_OPTIONS;
  }, [store, fieldName, fieldSnapshot.parentValue, externalOptions]);

  // Check if disabled by parent
  const isDisabledByParent = useMemo(() => {
    if (!fieldConfig?.dependsOn) return false;

    const parentVal = fieldSnapshot.parentValue;

    // Multiple parents
    if (
      typeof parentVal === 'object' &&
      parentVal !== null &&
      !Array.isArray(parentVal)
    ) {
      const values = Object.values(parentVal as Record<string, unknown>);
      return values.some(
        (v) =>
          v === undefined ||
          v === null ||
          (Array.isArray(v) && v.length === 0),
      );
    }

    // Single parent
    return (
      parentVal === undefined ||
      parentVal === null ||
      (Array.isArray(parentVal) && parentVal.length === 0)
    );
  }, [fieldConfig?.dependsOn, fieldSnapshot.parentValue]);

  // Change handler
  const handleChange = useCallback(
    (newValue: unknown) => store.setValue(fieldName, newValue),
    [store, fieldName],
  );

  // Sync external options
  const previousOptionsRef = useRef<XSelectOption[] | undefined>(undefined);
  if (externalOptions !== previousOptionsRef.current) {
    previousOptionsRef.current = externalOptions;
    if (externalOptions) {
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
// HOOKS - Selective Subscriptions
// ============================================================================

/**
 * Subscribe to only the value of a field.
 */
export function useXSelectValue(fieldName: string): unknown {
  const store = useXSelectStore();

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
 * Subscribe to only the loading state.
 */
export function useXSelectLoading(fieldName: string): boolean {
  const store = useXSelectStore();

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
 * Subscribe to only the parent value.
 */
export function useXSelectParentValue(fieldName: string): unknown {
  const store = useXSelectStore();

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const config = store.getConfig(fieldName);
      if (!config?.dependsOn) {
        return store.subscribe(fieldName, onStoreChange);
      }

      const parentNames = Array.isArray(config.dependsOn)
        ? config.dependsOn
        : [config.dependsOn];

      const unsubscribes = parentNames.map((name) =>
        store.subscribe(name, onStoreChange),
      );

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
// HOOKS - All Values
// ============================================================================

/**
 * Get all field values.
 * WARNING: Re-renders on ANY field change.
 */
export function useXSelectValues(): FieldValues {
  const store = useXSelectStore();

  const subscribeToAllFields = useCallback(
    (onStoreChange: () => void) => {
      const configs = store.getConfigs();

      const unsubscribeFunctions = configs.map((config) =>
        store.subscribe(config.name, onStoreChange),
      );

      return () => {
        unsubscribeFunctions.forEach((unsubscribe) => unsubscribe());
      };
    },
    [store],
  );

  return useSyncExternalStore(
    subscribeToAllFields,
    store.getValues,
    store.getValues,
  );
}

// ============================================================================
// CONTEXT EXPORTS (for advanced usage)
// ============================================================================

export { StoreContext as XSelectStoreContext };