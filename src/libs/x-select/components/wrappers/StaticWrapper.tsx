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

import React, { isValidElement, memo, useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useXSelectStoreOptional } from '../../contexts';
import { useAutoRegistration, useStableChildren, type RenderableChildren } from '../../hooks';
import type { XSelectOption, SelectValue, FormattedOption } from '../../types';
import { buildMetadataFromOptions, isMetadataEmpty } from '../../utils/metadata';
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
  options: FormattedOption[];

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

  /** Dropdown open/close handler */
  onOpenChange: (open: boolean) => void;

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

  /**
   * Field name (for auto-registration in standalone dynamic mode).
   * When used inside DependentWrapper, this is optional as the name comes from DependentContext.
   * When used standalone in DynamicXSelectProvider, this enables auto-registration.
   */
  name?: string;

  /**
   * Parent field dependency (for auto-registration in standalone dynamic mode).
   * When used inside DependentWrapper, this comes from DependentContext.
   */
  dependsOn?: string | string[];

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

  /** Selection mode (for auto-registration, matches Ant Design Select modes) */
  mode?: 'multiple' | 'tags';

  /** Children - ReactElement or render function */
  children: RenderableChildren<StaticInjectedProps<TMeta>>;
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

/** Props that can be passed to children select element. */
interface ChildSelectProps {
  value?: SelectValue;
  onChange?: (value: SelectValue) => void;
  options?: FormattedOption[];
  loading?: boolean;
  disabled?: boolean;
  showSearch?: boolean;
  onSearch?: (value: string) => void;
  filterOption?: boolean;
  onDropdownVisibleChange?: (open: boolean) => void;
  allowClear?: boolean;
}

/** Clone element with merged props for Select component. */
function cloneSelectWithProps<TMeta>(
  element: ReactElement<ChildSelectProps>,
  injectedProps: StaticInjectedProps<TMeta>,
  searchable: boolean,
): ReactElement<ChildSelectProps> {
  const childProps = element.props;

  return React.cloneElement(element, {
    value: injectedProps.value,
    onChange: injectedProps.onChange,
    options: injectedProps.options,
    loading: injectedProps.loading,
    disabled: childProps.disabled ?? injectedProps.disabled,
    showSearch: searchable,
    onSearch: searchable ? injectedProps.onSearch : undefined,
    filterOption: searchable ? false : undefined, // We handle filtering
    onDropdownVisibleChange: injectedProps.onOpenChange,
    allowClear: childProps.allowClear ?? true,
  });
}

// ============================================================================
// COMPONENT
// ============================================================================

function StaticWrapperInner<TMeta = unknown>({
  options: staticOptions,
  name: nameProp,
  dependsOn,
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
  mode,
  children,
  ...restProps
}: StaticWrapperProps<TMeta>) {
  const stableChildren = useStableChildren(children);
  const dependentContext = useDependentContext();
  const store = useXSelectStoreOptional();

  // Field name: from prop (standalone) or from DependentContext (nested)
  const fieldName = nameProp ?? dependentContext?.name;

  // Auto-register if field not pre-configured (dynamic mode)
  // Skip if already wrapped by DependentWrapper (which handles registration)
  useAutoRegistration({
    name: fieldName ?? '',
    dependsOn,
    options: staticOptions as XSelectOption[] | undefined,
    mode,
    // Skip if no name or already wrapped by DependentWrapper
    skip: !fieldName || !!dependentContext,
  });

  // State
  const [searchValue, setSearchValue] = useState('');

  // Resolve values - props take priority, then context
  const parentValue = parentValueProp ?? dependentContext?.parentValue;
  const value = (valueProp ?? dependentContext?.value) as SelectValue;
  const isDisabledByParent = dependentContext?.isDisabledByParent ?? false;
  const hasDependency = dependentContext?.hasDependency ?? false;

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

  // Enhanced change handler that syncs metadata BEFORE notifying form
  const handleChange = useCallback(
    (newValue: SelectValue) => {
      // Sync metadata IMMEDIATELY when value changes
      // This ensures metadata is available before any cascade delete
      if (store && fieldName) {
        const newMetadata = buildMetadataFromOptions(newValue, baseOptions);
        if (!isMetadataEmpty(newMetadata)) {
          store.setValueMetadata(fieldName, newMetadata);
        }
      }

      // Then notify the form
      if (onChangeProp) {
        onChangeProp(newValue);
      } else {
        dependentContext?.onChange(newValue);
      }
    },
    [store, fieldName, baseOptions, onChangeProp, dependentContext],
  );

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
  const formattedOptions = useMemo<FormattedOption[]>(
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

  // Build metadata map for selected values (for hydration sync)
  const selectedValuesMetadata = useMemo(
    () => buildMetadataFromOptions(value, baseOptions),
    [value, baseOptions],
  );

  // Sync metadata to store ONLY for initial load / async fetch case
  // When user selects from list, handleChange already syncs metadata
  // This effect only runs when async options are loaded (not from user selection)
  useEffect(() => {
    // Only sync after loading completes (for async options)
    // For static options, this runs once on mount
    if (store && fieldName && !isLoading && !isMetadataEmpty(selectedValuesMetadata)) {
      store.setValueMetadata(fieldName, selectedValuesMetadata);
    }
  }, [store, fieldName, isLoading, selectedValuesMetadata]);

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

  // Build injected props
  const injectedProps: StaticInjectedProps<TMeta> = {
    ...restProps,
    value,
    onChange: handleChange,
    options: formattedOptions,
    rawOptions: filteredOptions,
    selectedOptions,
    loading: isLoadingState,
    error: error ?? null,
    searchValue,
    onSearch: handleSearch,
    onOpenChange: handleOpenChange,
    disabled: isDisabled,
    parentValue,
    getOption,
    groupedOptions,
  };

  // Render content
  return typeof stableChildren === 'function'
    ? stableChildren(injectedProps)
    : isValidElement<ChildSelectProps>(stableChildren)
      ? cloneSelectWithProps(stableChildren, injectedProps, searchable)
      : stableChildren;
}

export const StaticWrapper = memo(StaticWrapperInner) as typeof StaticWrapperInner;
export default StaticWrapper;
