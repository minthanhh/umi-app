/**
 * StaticWrapper - Static Select Wrapper
 *
 * Wrapper component for static select (non-infinite scroll).
 * Best for small datasets with metadata/rich options.
 *
 * Features:
 * - Static options (no pagination)
 * - Support metadata on options (icon, description, color, etc.)
 * - Optional async loading (one-time fetch)
 * - Auto-get parentValue from DependentWrapper if nested
 * - Client-side search/filter
 * - Supports render props and React.cloneElement
 *
 * @example Basic usage with static options
 * ```tsx
 * const statusOptions = [
 *   { label: 'Active', value: 'active', color: 'green', icon: <CheckIcon /> },
 *   { label: 'Inactive', value: 'inactive', color: 'red', icon: <XIcon /> },
 * ];
 *
 * <StaticWrapper options={statusOptions}>
 *   <Select placeholder="Select status" />
 * </StaticWrapper>
 * ```
 *
 * @example With async fetch
 * ```tsx
 * <StaticWrapper
 *   queryKey="categories"
 *   fetchOptions={async () => {
 *     const res = await fetch('/api/categories');
 *     return res.json();
 *   }}
 * >
 *   <Select placeholder="Select category" />
 * </StaticWrapper>
 * ```
 *
 * @example Nested with DependentWrapper
 * ```tsx
 * <DependentWrapper name="status">
 *   <StaticWrapper options={statusOptions}>
 *     <Select placeholder="Select status" />
 *   </StaticWrapper>
 * </DependentWrapper>
 * ```
 */

import React, { isValidElement, useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { useQuery } from '@umijs/max';

import { useXSelectStoreOptional } from '../../contexts';
import type { XSelectOption, SelectValue } from '../../types';
import { useDependentContext } from './DependentWrapper';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Extended option with metadata support.
 */
export interface StaticOption<TMeta = unknown> extends XSelectOption {
  /** Custom metadata */
  meta?: TMeta;

  /** Icon element */
  icon?: ReactNode;

  /** Description text */
  description?: string;

  /** Color (for tags, badges, etc.) */
  color?: string;

  /** Group name for grouping options */
  group?: string;
}

/**
 * Props injected into children.
 */
export interface StaticInjectedProps<TMeta = unknown> {
  /** Current value */
  value: SelectValue;

  /** Change handler */
  onChange: (value: SelectValue) => void;

  /** Formatted options for UI */
  options: Array<{ label: string; value: string | number; disabled?: boolean }>;

  /** Raw options with metadata */
  rawOptions: StaticOption<TMeta>[];

  /** Selected option(s) with full data */
  selectedOptions: StaticOption<TMeta>[];

  /** Loading state */
  loading: boolean;

  /** Error if any */
  error: Error | null;

  /** Search value */
  searchValue: string;

  /** Search handler */
  onSearch: (value: string) => void;

  /** Disabled state */
  disabled?: boolean;

  /** Parent value */
  parentValue?: unknown;

  /** Get option by value */
  getOption: (value: string | number) => StaticOption<TMeta> | undefined;

  /** Grouped options (if groupBy is used) */
  groupedOptions?: Record<string, StaticOption<TMeta>[]>;
}

/**
 * Props for StaticWrapper.
 */
export interface StaticWrapperProps<TMeta = unknown> {
  /** Static options array */
  options?: StaticOption<TMeta>[];

  /** Query key for async fetch (optional) */
  queryKey?: string;

  /** Fetch function for async options */
  fetchOptions?: (parentValue?: unknown) => Promise<StaticOption<TMeta>[]>;

  /** Stale time for React Query (ms) - default: 5 minutes */
  staleTime?: number;

  /** Filter options by parent value (custom logic) */
  filterByParent?: (
    options: StaticOption<TMeta>[],
    parentValue: unknown,
  ) => StaticOption<TMeta>[];

  /** Enable client-side search - default: true */
  searchable?: boolean;

  /** Custom search filter function */
  filterOption?: (
    option: StaticOption<TMeta>,
    searchValue: string,
  ) => boolean;

  /** Group options by field */
  groupBy?: keyof StaticOption<TMeta> | ((option: StaticOption<TMeta>) => string);

  /** Parent value (standalone usage) */
  parentValue?: unknown;

  /** Controlled value */
  value?: SelectValue;

  /** Change handler */
  onChange?: (value: SelectValue) => void;

  /** Disabled state */
  disabled?: boolean;

  /** Children - ReactElement or render function */
  children: ReactElement | ((props: StaticInjectedProps<TMeta>) => ReactNode);
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Default search filter - case-insensitive label match.
 */
function defaultFilterOption<TMeta>(
  option: StaticOption<TMeta>,
  searchValue: string,
): boolean {
  if (!searchValue) return true;
  const search = searchValue.toLowerCase();
  return (
    option.label.toLowerCase().includes(search) ||
    (option.description?.toLowerCase().includes(search) ?? false)
  );
}

/**
 * Default parent value filter.
 */
function defaultFilterByParent<TMeta>(
  options: StaticOption<TMeta>[],
  parentValue: unknown,
): StaticOption<TMeta>[] {
  if (parentValue === undefined || parentValue === null) {
    return [];
  }

  const parentSet = Array.isArray(parentValue)
    ? new Set(parentValue)
    : new Set([parentValue]);

  if (parentSet.size === 0) return [];

  return options.filter((option) => {
    if (option.parentValue === undefined) return true; // No parent constraint

    if (Array.isArray(option.parentValue)) {
      return option.parentValue.some((pv) => parentSet.has(pv));
    }

    return parentSet.has(option.parentValue);
  });
}

/**
 * Group options by key.
 */
function groupOptions<TMeta>(
  options: StaticOption<TMeta>[],
  groupBy: keyof StaticOption<TMeta> | ((option: StaticOption<TMeta>) => string),
): Record<string, StaticOption<TMeta>[]> {
  const groups: Record<string, StaticOption<TMeta>[]> = {};

  for (const option of options) {
    const key =
      typeof groupBy === 'function'
        ? groupBy(option)
        : String(option[groupBy] ?? 'Other');

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(option);
  }

  return groups;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function StaticWrapper<TMeta = unknown>({
  options: staticOptions,
  queryKey,
  fetchOptions,
  staleTime = 5 * 60 * 1000, // 5 minutes default
  filterByParent = defaultFilterByParent,
  searchable = true,
  filterOption = defaultFilterOption,
  groupBy,
  parentValue: parentValueProp,
  value: valueProp,
  onChange: onChangeProp,
  disabled: disabledProp,
  children,
}: StaticWrapperProps<TMeta>) {
  const dependentContext = useDependentContext();
  const store = useXSelectStoreOptional();

  // State
  const [searchValue, setSearchValue] = useState('');

  // Resolve values - props take priority, then context
  const parentValue = parentValueProp ?? dependentContext?.parentValue;
  const value = (valueProp ?? dependentContext?.value) as SelectValue;
  const isDisabledByParent = dependentContext?.isDisabledByParent ?? false;
  const hasDependency = dependentContext?.hasDependency ?? false;
  const fieldName = dependentContext?.name;

  // Change handler
  const handleChange = useCallback(
    (newValue: SelectValue) => {
      if (onChangeProp) {
        onChangeProp(newValue);
      } else {
        dependentContext?.onChange(newValue);
      }
    },
    [onChangeProp, dependentContext],
  );

  // Query enabled logic
  const isQueryEnabled = useMemo(() => {
    if (!fetchOptions) return false;
    if (hasDependency) {
      if (parentValue === undefined || parentValue === null) return false;
      if (Array.isArray(parentValue) && parentValue.length === 0) return false;
    }
    return true;
  }, [fetchOptions, hasDependency, parentValue]);

  // Async fetch (optional)
  const {
    data: asyncOptions,
    isLoading,
    error,
  } = useQuery<StaticOption<TMeta>[], Error>({
    queryKey: queryKey ? [queryKey, parentValue] : ['static-options'],
    queryFn: () => fetchOptions!(parentValue),
    enabled: isQueryEnabled,
    staleTime,
  });

  // Resolve options source
  const baseOptions = useMemo<StaticOption<TMeta>[]>(() => {
    if (staticOptions) return staticOptions;
    if (asyncOptions) return asyncOptions;
    return [];
  }, [staticOptions, asyncOptions]);

  // Filter by parent value (if has dependency)
  const parentFilteredOptions = useMemo<StaticOption<TMeta>[]>(() => {
    if (!hasDependency) return baseOptions;
    return filterByParent(baseOptions, parentValue);
  }, [baseOptions, hasDependency, parentValue, filterByParent]);

  // Apply search filter
  const filteredOptions = useMemo<StaticOption<TMeta>[]>(() => {
    if (!searchable || !searchValue) return parentFilteredOptions;
    return parentFilteredOptions.filter((opt) => filterOption(opt, searchValue));
  }, [parentFilteredOptions, searchable, searchValue, filterOption]);

  // Build options lookup
  const optionsLookup = useMemo(() => {
    const map = new Map<string | number, StaticOption<TMeta>>();
    for (const opt of baseOptions) {
      map.set(opt.value, opt);
    }
    return map;
  }, [baseOptions]);

  // Get option by value
  const getOption = useCallback(
    (val: string | number) => optionsLookup.get(val),
    [optionsLookup],
  );

  // Get selected options
  const selectedOptions = useMemo<StaticOption<TMeta>[]>(() => {
    if (value === undefined || value === null) return [];
    const values = Array.isArray(value) ? value : [value];
    return values
      .map((v) => optionsLookup.get(v))
      .filter((opt): opt is StaticOption<TMeta> => opt !== undefined);
  }, [value, optionsLookup]);

  // Format options for UI
  const formattedOptions = useMemo(
    () =>
      filteredOptions.map((opt) => ({
        label: opt.label,
        value: opt.value,
        disabled: opt.disabled,
      })),
    [filteredOptions],
  );

  // Group options (if groupBy specified)
  const groupedOptions = useMemo(() => {
    if (!groupBy) return undefined;
    return groupOptions(filteredOptions, groupBy);
  }, [filteredOptions, groupBy]);

  // Sync options with store for cascade delete
  const storeOptions = useMemo(
    () =>
      baseOptions.map((opt) => ({
        label: opt.label,
        value: opt.value,
        parentValue: opt.parentValue,
        disabled: opt.disabled,
      })),
    [baseOptions],
  );

  useEffect(() => {
    if (store && fieldName && storeOptions.length > 0) {
      store.setExternalOptions(fieldName, storeOptions);
    }
  }, [store, fieldName, storeOptions]);

  // Search handler
  const handleSearch = useCallback((val: string) => {
    setSearchValue(val);
  }, []);

  // Reset search when dropdown closes
  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setSearchValue('');
    }
  }, []);

  const isDisabled = disabledProp || isDisabledByParent;
  const isLoadingState = fetchOptions ? isLoading : false;

  const injectedProps: StaticInjectedProps<TMeta> = {
    value,
    onChange: handleChange,
    options: formattedOptions,
    rawOptions: filteredOptions,
    selectedOptions,
    loading: isLoadingState,
    error: error ?? null,
    searchValue,
    onSearch: handleSearch,
    disabled: isDisabled,
    parentValue,
    getOption,
    groupedOptions,
  };

  if (typeof children === 'function') {
    return <>{children(injectedProps)}</>;
  }

  if (isValidElement(children)) {
    return (
      <>
        {React.cloneElement(children as React.ReactElement<any>, {
          value: injectedProps.value,
          onChange: injectedProps.onChange,
          options: injectedProps.options,
          loading: injectedProps.loading,
          disabled: (children.props as any).disabled ?? injectedProps.disabled,
          showSearch: searchable,
          onSearch: searchable ? injectedProps.onSearch : undefined,
          filterOption: searchable ? false : undefined, // We handle filtering
          onDropdownVisibleChange: handleOpenChange,
          allowClear: (children.props as any).allowClear ?? true,
        })}
      </>
    );
  }

  return <>{children}</>;
}

export default StaticWrapper;
