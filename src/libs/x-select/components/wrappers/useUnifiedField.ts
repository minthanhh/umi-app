/**
 * useUnifiedField - Unified field hook for X-Select wrappers
 *
 * Provides consistent API for wrappers to access field state from Store.
 * Store is single source of truth, Adapter syncs to Form.
 *
 * Must be used within XSelectProvider.
 */

import { useCallback, useSyncExternalStore } from 'react';

import { EMPTY_SNAPSHOT, isEmpty } from '../../constants';
import { useXSelectStore } from '../../contexts';
import type { FieldConfig, FieldSnapshot, XSelectOption } from '../../types';

// ============================================================================
// TYPES
// ============================================================================

export interface UseUnifiedFieldOptions {
  /** External options (overrides config.options) */
  options?: XSelectOption[];
}

export interface UseUnifiedFieldResult {
  config: FieldConfig | undefined;
  options: XSelectOption[];
  value: unknown;
  parentValue: unknown;
  parentValues?: Record<string, unknown>;
  isLoading: boolean;
  isDisabledByParent: boolean;
  isRegistered: boolean;
  onChange: (value: unknown) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const EMPTY_OPTIONS: XSelectOption[] = [];

// ============================================================================
// HELPERS
// ============================================================================

/** Check if field should be disabled based on parent value */
function checkDisabledByParent(
  parentValue: unknown,
  hasDependency: boolean,
): boolean {
  if (!hasDependency) return false;

  // Multiple parents: { parentA: value, parentB: value }
  const isMultipleParents =
    typeof parentValue === 'object' &&
    parentValue !== null &&
    !Array.isArray(parentValue);

  if (isMultipleParents) {
    const values = Object.values(parentValue as Record<string, unknown>);
    return values.some(isEmpty);
  }

  // Single parent
  return isEmpty(parentValue);
}

// ============================================================================
// HOOK
// ============================================================================

export function useUnifiedField(
  fieldName: string,
  options?: UseUnifiedFieldOptions,
): UseUnifiedFieldResult {
  const externalOptions = options?.options;
  const store = useXSelectStore();

  const subscribe = useCallback(
    (onStoreChange: () => void) => store.subscribe(fieldName, onStoreChange),
    [store, fieldName],
  );

  const getSnapshot = useCallback((): FieldSnapshot => {
    if (!store.hasField(fieldName)) return EMPTY_SNAPSHOT;
    return store.getFieldSnapshot(fieldName);
  }, [store, fieldName]);

  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const fieldConfig = store.getConfig(fieldName);
  const isRegistered = fieldConfig !== undefined;

  const filteredOptions = isRegistered
    ? store.getOptions(fieldName, externalOptions) || EMPTY_OPTIONS
    : EMPTY_OPTIONS;

  const hasDependency = !!fieldConfig?.dependsOn;
  const isDisabledByParent = checkDisabledByParent(
    snapshot.parentValue,
    hasDependency,
  );

  const onChange = useCallback(
    (newValue: unknown) => store.setValue(fieldName, newValue),
    [store, fieldName],
  );

  return {
    config: fieldConfig,
    options: filteredOptions,
    value: snapshot.value,
    parentValue: snapshot.parentValue,
    parentValues: snapshot.parentValues,
    isLoading: snapshot.isLoading,
    isDisabledByParent,
    isRegistered,
    onChange,
  };
}

export default useUnifiedField;
