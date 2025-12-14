/**
 * useInfiniteDependentField - Hook for dependent fields with infinite scroll
 *
 * Combines:
 * - Dependency tracking from DependentFieldStore
 * - Infinite scroll with React Query
 * - Hydration for initial values
 */

import { keepPreviousData } from '@tanstack/react-query';
import { useInfiniteQuery, useQuery } from '@umijs/max';
import { useCallback, useMemo, useState } from 'react';

import { useDependentField, useDependentFieldStore } from '../context';
import type { FieldValue } from '../types';

// ============================================================================
// Types
// ============================================================================

export interface BaseItem {
  id: string | number;
  [key: string]: unknown;
}

export interface FetchRequest {
  current: number;
  pageSize: number;
  /** Parent value for server-side filtering */
  parentValue?: any;
  /** Search keyword */
  search?: string;
  /** Specific IDs to fetch (for hydration) */
  ids?: Array<string | number>;
}

export interface FetchResponse<T> {
  data: T[];
  total?: number;
  hasMore?: boolean;
}

export interface SelectOption<T extends BaseItem = BaseItem> {
  label: string;
  value: string | number;
  item: T;
  disabled?: boolean;
}

export interface InfiniteFieldConfig<T extends BaseItem = BaseItem> {
  /** Unique query key for caching */
  queryKey: string;

  /** Fetch list of options - receives parentValue for dependent fields */
  fetchList: (request: FetchRequest) => Promise<FetchResponse<T>>;

  /** Optional: fetch specific items by IDs (for hydration) */
  fetchByIds?: (ids: Array<string | number>, parentValue?: any) => Promise<T[]>;

  /** Items per page */
  pageSize?: number;

  /** Fetch strategy: 'eager' = fetch immediately, 'lazy' = fetch on dropdown open */
  fetchStrategy?: 'eager' | 'lazy';

  /** Stale time for queries (ms) */
  staleTime?: number;

  /** Get unique ID from item */
  getItemId?: (item: T) => string | number;

  /** Get display label from item */
  getItemLabel?: (item: T) => string;
}

export interface UseInfiniteDependentFieldResult<
  T extends BaseItem = BaseItem,
> {
  // From useDependentField
  value: FieldValue | FieldValue[] | undefined;
  setValue: (value: FieldValue | FieldValue[] | undefined) => void;
  dependencyValues: Record<string, FieldValue | FieldValue[]>;
  hasDependencies: boolean;
  isDependencySatisfied: boolean;

  // Infinite scroll specific
  options: SelectOption<T>[];
  items: T[];
  selectedItems: T[];
  isLoading: boolean;
  isHydrating: boolean;
  isFetchingMore: boolean;
  hasNextPage: boolean;
  error: Error | null;

  // Actions
  onOpenChange: (open: boolean) => void;
  onScroll: (e: React.UIEvent<HTMLElement>) => void;
  fetchNextPage: () => void;
  isOpen: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_PAGE_SIZE = 20;
const SCROLL_THRESHOLD = 50;

// ============================================================================
// Hook Implementation
// ============================================================================

export function useInfiniteDependentField<T extends BaseItem = BaseItem>(
  fieldName: string,
  config: InfiniteFieldConfig<T>,
): UseInfiniteDependentFieldResult<T> {
  const store = useDependentFieldStore();
  const storeConfig = store.getConfig(fieldName);

  // Get dependency state from store
  const {
    value,
    setValue,
    dependencyValues,
    hasDependencies,
    isDependencySatisfied,
  } = useDependentField(fieldName);

  // Get parent value from dependencies
  const parentValue = useMemo(() => {
    if (!storeConfig?.dependsOn) return undefined;

    const deps = Array.isArray(storeConfig.dependsOn)
      ? storeConfig.dependsOn
      : [storeConfig.dependsOn];

    // If single dependency, return its value directly
    if (deps.length === 1) {
      return dependencyValues[deps[0]];
    }

    // If multiple dependencies, return all values
    return dependencyValues;
  }, [storeConfig?.dependsOn, dependencyValues]);

  // Dropdown state
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpenedOnce, setHasOpenedOnce] = useState(false);

  const isListFetchEnabled = useMemo(() => {
    // Don't fetch if dependencies not satisfied
    if (hasDependencies && !isDependencySatisfied) return false;

    // Apply fetch strategy
    if (config.fetchStrategy === 'eager') return true;
    return isOpen || hasOpenedOnce;
  }, [
    hasDependencies,
    isDependencySatisfied,
    config.fetchStrategy,
    isOpen,
    hasOpenedOnce,
  ]);

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (open) {
      setHasOpenedOnce(true);
    }
  }, []);

  // Helper functions
  const getItemId = config.getItemId ?? ((item: T) => item.id);
  const getItemLabel =
    config.getItemLabel ?? ((item: T) => String((item as any).name ?? item.id));
  const pageSize = config.pageSize ?? DEFAULT_PAGE_SIZE;

  // Normalize selected IDs
  const selectedIds = useMemo((): Array<string | number> => {
    if (value === undefined || value === null) return [];
    if (Array.isArray(value)) {
      return value.filter((v) => v !== null && v !== undefined) as Array<
        string | number
      >;
    }
    return [value as string | number];
  }, [value]);

  // ============================================================================
  // Infinite Query for list
  // ============================================================================

  const listQuery = useInfiniteQuery({
    queryKey: [config.queryKey, 'list', parentValue],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await config.fetchList({
        current: pageParam as number,
        pageSize,
        parentValue,
      });

      const hasMore = response.hasMore ?? response.data.length >= pageSize;

      return {
        data: response.data,
        nextPage: hasMore ? (pageParam as number) + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
    placeholderData: keepPreviousData,
    enabled: isListFetchEnabled,
    staleTime: config.staleTime,
  });

  const listData = useMemo(() => {
    return listQuery.data?.pages.flatMap((p) => p.data) ?? [];
  }, [listQuery.data?.pages]);

  // ============================================================================
  // Hydration Query for selected items
  // ============================================================================

  // IDs that need hydration (not in list data)
  const idsToHydrate = useMemo(() => {
    const listIds = new Set(listData.map(getItemId));
    return selectedIds.filter((id) => !listIds.has(id));
  }, [selectedIds, listData, getItemId]);

  const hydrationQuery = useQuery({
    queryKey: [config.queryKey, 'hydrate', idsToHydrate, parentValue],
    queryFn: async () => {
      if (config.fetchByIds) {
        return config.fetchByIds(idsToHydrate, parentValue);
      }
      // Fallback: use fetchList with ids filter
      const response = await config.fetchList({
        current: 1,
        pageSize: idsToHydrate.length,
        parentValue,
        ids: idsToHydrate,
      });
      return response.data;
    },
    enabled: idsToHydrate.length > 0,
    staleTime: config.staleTime ?? Infinity,
  });

  // ============================================================================
  // Merge all data sources
  // ============================================================================

  const items = useMemo(() => {
    const allItems = [...(hydrationQuery.data ?? []), ...listData];
    const uniqueMap = new Map<string | number, T>();

    allItems.forEach((item) => {
      uniqueMap.set(getItemId(item), item);
    });

    return Array.from(uniqueMap.values());
  }, [hydrationQuery.data, listData, getItemId]);

  // Selected items with full data
  const selectedItems = useMemo(() => {
    const idSet = new Set(selectedIds);
    return items.filter((item) => idSet.has(getItemId(item)));
  }, [items, selectedIds, getItemId]);

  // Convert to options
  const options = useMemo((): SelectOption<T>[] => {
    return items.map((item) => ({
      value: getItemId(item),
      label: getItemLabel(item),
      item,
    }));
  }, [items, getItemId, getItemLabel]);

  // ============================================================================
  // Scroll handler
  // ============================================================================

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLElement>) => {
      const target = e.target as HTMLElement;
      const isNearBottom =
        target.scrollTop + target.offsetHeight >=
        target.scrollHeight - SCROLL_THRESHOLD;

      if (
        isNearBottom &&
        listQuery.hasNextPage &&
        !listQuery.isFetchingNextPage
      ) {
        listQuery.fetchNextPage();
      }
    },
    [
      listQuery.hasNextPage,
      listQuery.isFetchingNextPage,
      listQuery.fetchNextPage,
    ],
  );

  return {
    // From useDependentField
    value,
    setValue,
    dependencyValues,
    hasDependencies,
    isDependencySatisfied,

    // Infinite scroll specific
    options,
    items,
    selectedItems,
    isLoading: listQuery.isLoading,
    isHydrating: hydrationQuery.isLoading,
    isFetchingMore: listQuery.isFetchingNextPage,
    hasNextPage: listQuery.hasNextPage ?? false,
    error: (listQuery.error ?? hydrationQuery.error) as Error | null,

    // Actions
    onOpenChange: handleOpenChange,
    onScroll: handleScroll,
    fetchNextPage: listQuery.fetchNextPage,
    isOpen,
  };
}
