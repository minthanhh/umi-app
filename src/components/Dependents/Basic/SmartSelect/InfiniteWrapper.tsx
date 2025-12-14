/**
 * SmartSelect.Infinite - Infinite Scroll Wrapper
 *
 * Wrapper component cho infinite scroll select.
 * Inject props cần thiết vào children (options, loading, onScroll, etc.).
 *
 * Features:
 * - Infinite scroll với React Query
 * - Hydration cho selected values
 * - Tự động lấy parentValue từ DependentWrapper nếu nested
 * - Hỗ trợ cả render props và React.cloneElement
 *
 * @example Standalone usage
 * ```tsx
 * <SmartSelect.Infinite queryKey="users" fetchList={fetchUsers}>
 *   <Select placeholder="Select user" />
 * </SmartSelect.Infinite>
 * ```
 *
 * @example With render props
 * ```tsx
 * <SmartSelect.Infinite queryKey="users" fetchList={fetchUsers}>
 *   {({ options, loading, onScroll, onOpenChange }) => (
 *     <Select
 *       options={options}
 *       loading={loading}
 *       onPopupScroll={onScroll}
 *       onDropdownVisibleChange={onOpenChange}
 *     />
 *   )}
 * </SmartSelect.Infinite>
 * ```
 *
 * @example Nested with DependentWrapper
 * ```tsx
 * <SmartSelect.Dependent name="city">
 *   <SmartSelect.Infinite queryKey="cities" fetchList={fetchCities}>
 *     <Select placeholder="Select city" />
 *   </SmartSelect.Infinite>
 * </SmartSelect.Dependent>
 * ```
 */

import React, { isValidElement, useEffect, useMemo } from 'react';

import { useDependentStoreOptional } from '../context';
import { useInfiniteSelect } from '../InfiniteSelect/useInfiniteSelect';
import { useDependentContext } from './DependentWrapper';
import type {
  BaseItem,
  InfiniteInjectedProps,
  InfiniteWrapperProps,
  SelectValue,
} from './types';

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
  // Get context from parent DependentWrapper (if nested)
  const dependentContext = useDependentContext();

  // Get store (may be null if not inside DependentSelectProvider)
  const store = useDependentStoreOptional();

  // Resolve values - props take priority, then context
  const parentValue = parentValueProp ?? dependentContext?.parentValue;
  const value = (valueProp ?? dependentContext?.value) as SelectValue;
  const isDisabledByParent = dependentContext?.isDisabledByParent ?? false;

  // Handle onChange - update both prop callback and context
  const handleChange = (newValue: SelectValue) => {
    onChangeProp?.(newValue);
    dependentContext?.onChange(newValue);
  };

  // Check if this field has a parent dependency
  const hasDependency = dependentContext?.hasDependency ?? false;

  // Determine if query should be enabled
  // Disabled when:
  // 1. enabled prop is false
  // 2. Has parentValue dependency (hasDependency=true) but parent has no value
  const isQueryEnabled = useMemo(() => {
    if (!enabled) return false;
    // Only check parentValue if this field has a dependency (dependsOn config)
    if (hasDependency) {
      // Check for empty/undefined parent value
      if (parentValue === undefined || parentValue === null) return false;
      if (Array.isArray(parentValue) && parentValue.length === 0) return false;
    }
    return true;
  }, [enabled, hasDependency, parentValue]);

  // Get field name from context (if nested inside DependentWrapper)
  const fieldName = dependentContext?.name;

  // Use the infinite select hook
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

  // Sync options with store for cascade delete support
  // Convert InfiniteSelectOption to SelectOption format
  const storeOptions = useMemo(
    () =>
      infiniteResult.options.map((opt) => ({
        label: opt.label,
        value: opt.value,
        // Cast parentValue to the correct type for SelectOption
        parentValue: opt.parentValue as string | number | (string | number)[] | undefined,
      })),
    [infiniteResult.options],
  );

  // Sync options with store when they change
  useEffect(() => {
    if (store && fieldName && storeOptions.length > 0) {
      store.setExternalOptions(fieldName, storeOptions);
    }
  }, [store, fieldName, storeOptions]);

  // Format options for Select (simplified)
  const formattedOptions = useMemo(
    () =>
      infiniteResult.options.map((opt) => ({
        label: opt.label,
        value: opt.value,
      })),
    [infiniteResult.options],
  );

  // Resolve disabled state
  const isDisabled = disabledProp || isDisabledByParent;

  // Build props to inject
  const injectedProps: InfiniteInjectedProps<T> = {
    // Value & onChange
    value: infiniteResult.value,
    onChange: infiniteResult.onChange,

    // Options
    options: formattedOptions,
    rawOptions: infiniteResult.options,
    items: infiniteResult.items,
    selectedItems: infiniteResult.selectedItems,

    // Loading states
    loading: infiniteResult.isLoading,
    isHydrating: infiniteResult.isHydrating,
    isFetchingMore: infiniteResult.isFetchingMore,

    // Pagination
    hasNextPage: infiniteResult.hasNextPage,

    // Dropdown
    isOpen: infiniteResult.isOpen,

    // Error
    error: infiniteResult.error,

    // Handlers
    onOpenChange: infiniteResult.onOpenChange,
    onScroll: infiniteResult.onScroll,
    onSearch: infiniteResult.onSearch,
    fetchNextPage: infiniteResult.fetchNextPage,

    // From parent
    disabled: isDisabled,
    parentValue,
  };

  // Render
  if (typeof children === 'function') {
    return <>{children(injectedProps)}</>;
  }

  if (isValidElement(children)) {
    return (
      <>
        {React.cloneElement(children as React.ReactElement<any>, {
          // Value & onChange
          value: injectedProps.value,
          onChange: injectedProps.onChange,

          // Options & loading
          options: injectedProps.options,
          loading: injectedProps.loading,

          // State
          disabled: (children.props as any).disabled ?? injectedProps.disabled,

          // Infinite scroll handlers for Ant Design Select
          onPopupScroll: injectedProps.onScroll,
          onDropdownVisibleChange: injectedProps.onOpenChange,

          // Search
          showSearch: true,
          onSearch: injectedProps.onSearch,
          filterOption: false, // Server-side filtering

          // Default behaviors
          allowClear: (children.props as any).allowClear ?? true,
        })}
      </>
    );
  }

  return <>{children}</>;
}

export default InfiniteWrapper;