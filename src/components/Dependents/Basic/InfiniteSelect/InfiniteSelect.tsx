/**
 * InfiniteSelect - Standalone Infinite Scroll Select Component
 *
 * Component Select với infinite scroll sử dụng React Query.
 * Có thể sử dụng độc lập, không cần DependentSelectProvider.
 *
 * Features:
 * - Infinite scroll với useInfiniteQuery
 * - Hydration cho selected values
 * - Search với debounce
 * - Lazy/eager loading
 * - Loading states (initial, fetching more, hydrating)
 */

import { Select, Spin } from 'antd';
import React, { useMemo } from 'react';

import type { BaseItem, InfiniteSelectProps } from './types';
import { useInfiniteSelect } from './useInfiniteSelect';

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Standalone infinite scroll select component.
 *
 * @example Basic usage
 * ```tsx
 * <InfiniteSelect
 *   queryKey="users"
 *   fetchList={async ({ current, pageSize, search }) => {
 *     const res = await fetch(`/api/users?page=${current}&size=${pageSize}&q=${search}`);
 *     return res.json();
 *   }}
 *   placeholder="Select a user"
 * />
 * ```
 *
 * @example With parent value (for dependent select)
 * ```tsx
 * <InfiniteSelect
 *   queryKey="cities"
 *   fetchList={async ({ current, pageSize, parentValue }) => {
 *     const res = await fetch(`/api/cities?province=${parentValue}&page=${current}`);
 *     return res.json();
 *   }}
 *   parentValue={selectedProvince}
 *   disabled={!selectedProvince}
 *   placeholder="Select a city"
 * />
 * ```
 *
 * @example Multiple select
 * ```tsx
 * <InfiniteSelect
 *   queryKey="tags"
 *   fetchList={fetchTags}
 *   mode="multiple"
 *   value={selectedTags}
 *   onChange={setSelectedTags}
 * />
 * ```
 */
export function InfiniteSelect<T extends BaseItem = BaseItem>({
  // Config props
  queryKey,
  fetchList,
  fetchByIds,
  pageSize,
  fetchStrategy,
  staleTime,
  getItemId,
  getItemLabel,
  parentValue,

  // Value props
  value,
  onChange,

  // Component props
  disabled,
  showLoadingMore = true,
  loadingMoreRender,
  onError,

  // Pass through to Select
  ...selectProps
}: InfiniteSelectProps<T>) {
  // Use the hook
  const {
    options,
    isLoading,
    isHydrating,
    isFetchingMore,
    hasNextPage,
    error,
    onChange: handleChange,
    onOpenChange,
    onScroll,
    onSearch,
  } = useInfiniteSelect<T>({
    queryKey,
    fetchList,
    fetchByIds,
    pageSize,
    fetchStrategy,
    staleTime,
    getItemId,
    getItemLabel,
    parentValue,
    value,
    onChange,
  });

  // Report error if callback provided
  React.useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  // Format options for Ant Design Select
  const formattedOptions = useMemo(() => {
    const opts = options.map((opt) => ({
      label: opt.label,
      value: opt.value,
    }));

    // Add loading more option at the end
    if (showLoadingMore && isFetchingMore && hasNextPage) {
      opts.push({
        label: loadingMoreRender ?? (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <Spin size="small" />
          </div>
        ),
        value: '__loading_more__',
        disabled: true,
      } as any);
    }

    return opts;
  }, [options, showLoadingMore, isFetchingMore, hasNextPage, loadingMoreRender]);

  // Determine loading state
  const isLoadingState = isLoading || isHydrating;

  return (
    <Select
      // Value & Change handler
      value={value}
      onChange={handleChange}
      // Options
      options={formattedOptions}
      // State
      disabled={disabled}
      loading={isLoadingState}
      // Infinite scroll handlers
      onPopupScroll={onScroll}
      onDropdownVisibleChange={onOpenChange}
      // Search
      showSearch
      onSearch={onSearch}
      filterOption={false} // Server-side filtering
      // Default behaviors
      allowClear
      optionFilterProp="label"
      // Loading indicator
      notFoundContent={
        isLoadingState ? (
          <div style={{ textAlign: 'center', padding: '12px' }}>
            <Spin size="small" />
          </div>
        ) : undefined
      }
      // Styling
      style={{ minWidth: 200, ...selectProps.style }}
      // Pass through other props
      {...selectProps}
    />
  );
}

export default InfiniteSelect;