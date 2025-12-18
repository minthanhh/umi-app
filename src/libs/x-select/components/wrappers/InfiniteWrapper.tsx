/**
 * InfiniteWrapper - Infinite Scroll Select Wrapper
 *
 * Wrapper component for infinite scroll select.
 * Injects props into children (options, loading, onScroll, etc.).
 *
 * Features:
 * - Infinite scroll with React Query
 * - Hydration for selected values
 * - Auto-get parentValue from DependentWrapper if nested
 * - Supports render props and React.cloneElement
 *
 * @example Standalone usage
 * ```tsx
 * <InfiniteWrapper queryKey="users" fetchList={fetchUsers}>
 *   <Select placeholder="Select user" />
 * </InfiniteWrapper>
 * ```
 *
 * @example Nested with DependentWrapper
 * ```tsx
 * <DependentWrapper name="city">
 *   <InfiniteWrapper queryKey="cities" fetchList={fetchCities}>
 *     <Select placeholder="Select city" />
 *   </InfiniteWrapper>
 * </DependentWrapper>
 * ```
 */

import React, { isValidElement, useEffect, useMemo } from 'react';
import type { ReactElement, ReactNode } from 'react';

import { useXSelectStoreOptional } from '../../contexts';
import { useInfiniteSelect } from '../../hooks';
import type {
  BaseItem,
  FetchRequest,
  FetchResponse,
  InfiniteOption,
  SelectValue,
} from '../../types';
import { useDependentContext } from './DependentWrapper';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Props injected into children.
 */
export interface InfiniteInjectedProps<T extends BaseItem = BaseItem> {
  /** Current value */
  value: SelectValue;

  /** Change handler */
  onChange: (value: SelectValue) => void;

  /** Formatted options */
  options: Array<{ label: string; value: string | number }>;

  /** Raw options with item data */
  rawOptions: InfiniteOption<T>[];

  /** Raw items */
  items: T[];

  /** Selected items (full data) */
  selectedItems: T[];

  /** Initial loading */
  loading: boolean;

  /** Hydrating selected values */
  isHydrating: boolean;

  /** Fetching more */
  isFetchingMore: boolean;

  /** Has next page */
  hasNextPage: boolean;

  /** Dropdown open */
  isOpen: boolean;

  /** Combined error (list or hydration) */
  error: Error | null;

  /** List query error */
  listError: Error | null;

  /** Hydration query error */
  hydrationError: Error | null;

  /** Whether currently retrying */
  isRetrying: boolean;

  /** Open/close handler */
  onOpenChange: (open: boolean) => void;

  /** Scroll handler */
  onScroll: (e: React.UIEvent<HTMLElement>) => void;

  /** Search handler */
  onSearch: (value: string) => void;

  /** Fetch next page */
  fetchNextPage: () => void;

  /** Retry failed query */
  retry: () => void;

  /** Clear error and retry */
  clearErrorAndRetry: () => void;

  /** Disabled state */
  disabled?: boolean;

  /** Parent value */
  parentValue?: unknown;
}

/**
 * Props for InfiniteWrapper.
 */
export interface InfiniteWrapperProps<T extends BaseItem = BaseItem> {
  /** Unique query key */
  queryKey: string;

  /** Fetch list function */
  fetchList: (request: FetchRequest) => Promise<FetchResponse<T>>;

  /** Fetch by IDs (for hydration) */
  fetchByIds?: (
    ids: Array<string | number>,
    parentValue?: unknown,
  ) => Promise<T[]>;

  /** Items per page (default: 20) */
  pageSize?: number;

  /** Fetch strategy: 'eager' | 'lazy' (default: 'lazy') */
  fetchStrategy?: 'eager' | 'lazy';

  /** Stale time for React Query (ms) */
  staleTime?: number;

  /** Get ID from item */
  getItemId?: (item: T) => string | number;

  /** Get label from item */
  getItemLabel?: (item: T) => string;

  /** Get parent value from item (for cascade delete) */
  getItemParentValue?: (item: T) => unknown;

  /** Parent value (standalone usage) */
  parentValue?: unknown;

  /** Controlled value */
  value?: SelectValue;

  /** Change handler */
  onChange?: (value: SelectValue) => void;

  /** Disabled state */
  disabled?: boolean;

  /** Enable/disable query */
  enabled?: boolean;

  /** Children - ReactElement or render function */
  children: ReactElement | ((props: InfiniteInjectedProps<T>) => ReactNode);
}

// ============================================================================
// COMPONENT
// ============================================================================

export function InfiniteWrapper<T extends BaseItem = BaseItem>({
  queryKey,
  fetchList,
  fetchByIds,
  pageSize,
  fetchStrategy,
  staleTime,
  getItemId,
  getItemLabel,
  getItemParentValue,
  parentValue: parentValueProp,
  value: valueProp,
  onChange: onChangeProp,
  disabled: disabledProp,
  enabled = true,
  children,
}: InfiniteWrapperProps<T>) {
  const dependentContext = useDependentContext();
  const store = useXSelectStoreOptional();

  // Resolve values - props take priority, then context
  const parentValue = parentValueProp ?? dependentContext?.parentValue;
  const value = (valueProp ?? dependentContext?.value) as SelectValue;
  const isDisabledByParent = dependentContext?.isDisabledByParent ?? false;

  // Use onChangeProp if provided, otherwise use context onChange
  // Don't call both to avoid double updates
  const handleChange = (newValue: SelectValue) => {
    if (onChangeProp) {
      onChangeProp(newValue);
    } else {
      dependentContext?.onChange(newValue);
    }
  };

  const hasDependency = dependentContext?.hasDependency ?? false;

  const isQueryEnabled = useMemo(() => {
    if (!enabled) return false;
    if (hasDependency) {
      if (parentValue === undefined || parentValue === null) return false;
      if (Array.isArray(parentValue) && parentValue.length === 0) return false;
    }
    return true;
  }, [enabled, hasDependency, parentValue]);

  const fieldName = dependentContext?.name;

  const infiniteResult = useInfiniteSelect<T>({
    queryKey,
    fetchList,
    fetchByIds,
    pageSize,
    fetchStrategy,
    staleTime,
    getItemId,
    getItemLabel,
    getItemParentValue,
    parentValue,
    value,
    onChange: handleChange,
    enabled: isQueryEnabled,
  });

  // Sync options with store for cascade delete
  const storeOptions = useMemo(
    () =>
      infiniteResult.options.map((opt) => ({
        label: opt.label,
        value: opt.value,
        parentValue: opt.parentValue as string | number | (string | number)[] | undefined,
      })),
    [infiniteResult.options],
  );

  useEffect(() => {
    if (store && fieldName && storeOptions.length > 0) {
      store.setExternalOptions(fieldName, storeOptions);
    }
  }, [store, fieldName, storeOptions]);

  const formattedOptions = useMemo(
    () =>
      infiniteResult.options.map((opt) => ({
        label: opt.label,
        value: opt.value,
      })),
    [infiniteResult.options],
  );

  const isDisabled = disabledProp || isDisabledByParent;

  const injectedProps: InfiniteInjectedProps<T> = {
    value: infiniteResult.value,
    onChange: infiniteResult.onChange,
    options: formattedOptions,
    rawOptions: infiniteResult.options,
    items: infiniteResult.items,
    selectedItems: infiniteResult.selectedItems,
    loading: infiniteResult.isLoading,
    isHydrating: infiniteResult.isHydrating,
    isFetchingMore: infiniteResult.isFetchingMore,
    hasNextPage: infiniteResult.hasNextPage,
    isOpen: infiniteResult.isOpen,
    error: infiniteResult.error,
    listError: infiniteResult.listError,
    hydrationError: infiniteResult.hydrationError,
    isRetrying: infiniteResult.isRetrying,
    onOpenChange: infiniteResult.onOpenChange,
    onScroll: infiniteResult.onScroll,
    onSearch: infiniteResult.onSearch,
    fetchNextPage: infiniteResult.fetchNextPage,
    retry: infiniteResult.retry,
    clearErrorAndRetry: infiniteResult.clearErrorAndRetry,
    disabled: isDisabled,
    parentValue,
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
          onPopupScroll: injectedProps.onScroll,
          onDropdownVisibleChange: injectedProps.onOpenChange,
          showSearch: true,
          onSearch: injectedProps.onSearch,
          filterOption: false,
          allowClear: (children.props as any).allowClear ?? true,
        })}
      </>
    );
  }

  return <>{children}</>;
}

export default InfiniteWrapper;