import { memo, useCallback, useMemo } from 'react';

import { SelectProvider } from './context';
import {
  useDataSource,
  useDropdownState,
  useMergedOptions,
  useNormalizedInput,
  useScrollHandler,
} from './hooks';
import type {
  BaseItem,
  SelectActions,
  SelectContext,
  SelectState,
  SelectWrapperProps,
} from './types';

// ============================================================================
// SelectWrapper Component
// Headless wrapper that provides all select logic via context/render props
// ============================================================================

function SelectWrapperInner<T extends BaseItem>({
  config,
  value,
  onChange,
  children,
}: SelectWrapperProps<T>) {
  console.log(value);
  // Get item ID helper
  const getItemId = config.getItemId ?? ((item: T) => item.id);

  // Normalize input value
  const { selectedIds, prefilledItems } = useNormalizedInput(value, getItemId);

  // Dropdown state management
  const { isOpen, isListFetchEnabled, handleOpenChange } = useDropdownState(
    config.fetchStrategy,
  );

  // Data fetching
  const dataSource = useDataSource({
    selectedIds,
    prefilledItems,
    isListFetchEnabled,
    config,
  });

  // Convert to options
  const options = useMergedOptions({ items: dataSource.items, config });

  // Get selected items with full data
  const selectedItems = useMemo(() => {
    const idSet = new Set(selectedIds);
    return dataSource.items.filter((item) => idSet.has(getItemId(item)));
  }, [dataSource.items, selectedIds, getItemId]);

  // Scroll handler for infinite loading
  const handleScroll = useScrollHandler({
    hasNextPage: dataSource.hasNextPage,
    isFetchingMore: dataSource.isFetchingMore,
    fetchNextPage: dataSource.fetchNextPage,
  });

  // Handle value change
  const handleChange = useCallback(
    (ids: Array<string | number>) => {
      onChange?.(ids);
    },
    [onChange],
  );

  // Refresh data
  const refresh = useCallback(() => {
    // Trigger refetch by invalidating queries
    // This is a simplified version - in production you might want to use queryClient.invalidateQueries
    dataSource.fetchNextPage();
  }, [dataSource]);

  // Build state object
  const state: SelectState<T> = useMemo(
    () => ({
      options,
      selectedIds,
      selectedItems,
      items: dataSource.items,
      isLoading: dataSource.isLoading,
      isHydrating: dataSource.isHydrating,
      isFetchingMore: dataSource.isFetchingMore,
      hasNextPage: dataSource.hasNextPage,
      isOpen,
      error: dataSource.error,
    }),
    [
      options,
      selectedIds,
      selectedItems,
      dataSource.items,
      dataSource.isLoading,
      dataSource.isHydrating,
      dataSource.isFetchingMore,
      dataSource.hasNextPage,
      dataSource.error,
      isOpen,
    ],
  );

  // Build actions object
  const actions: SelectActions = useMemo(
    () => ({
      onChange: handleChange,
      onOpenChange: handleOpenChange,
      onScroll: handleScroll,
      fetchNextPage: dataSource.fetchNextPage,
      refresh,
    }),
    [
      handleChange,
      handleOpenChange,
      handleScroll,
      dataSource.fetchNextPage,
      refresh,
    ],
  );

  // Build context value
  const contextValue: SelectContext<T> = useMemo(
    () => ({
      state,
      actions,
      config,
    }),
    [state, actions, config],
  );

  // Render children (support both render prop and regular children)
  const content =
    typeof children === 'function' ? children(contextValue) : children;

  return <SelectProvider value={contextValue}>{content}</SelectProvider>;
}

// Memoize the component
export const SelectWrapper = memo(
  SelectWrapperInner,
) as typeof SelectWrapperInner;
