/**
 * useInfiniteSelect - Hook for Infinite Scroll Select
 *
 * Features:
 * - Infinite scroll with useInfiniteQuery
 * - Hydration for selected values with useQuery
 * - Auto-reset when parentValue changes
 * - Lazy/eager loading strategy
 * - Search with debounce
 *
 * NOTE: This hook depends on @tanstack/react-query.
 * Make sure to wrap your app with QueryClientProvider.
 */

import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useRef, useState } from 'react';

import type {
  BaseItem,
  FetchRequest,
  InfiniteOption,
  InfiniteConfig,
  SelectValue,
  UseInfiniteSelectResult,
} from '../types';

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_PAGE_SIZE = 10;
const SCROLL_THRESHOLD = 50;
const SEARCH_DEBOUNCE_MS = 300;

// ============================================================================
// HOOK OPTIONS
// ============================================================================

export interface UseInfiniteSelectOptions<T extends BaseItem = BaseItem>
  extends InfiniteConfig<T> {
  /** Parent value (for dependent field) */
  parentValue?: unknown;

  /** Controlled value */
  value?: SelectValue;

  /** Change handler */
  onChange?: (value: SelectValue) => void;

  /** Enable/disable query (default: true) */
  enabled?: boolean;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for managing infinite scroll select.
 *
 * @example Standalone usage
 * ```tsx
 * const {
 *   options,
 *   isLoading,
 *   hasNextPage,
 *   onScroll,
 *   onOpenChange,
 *   onChange,
 * } = useInfiniteSelect({
 *   queryKey: 'users',
 *   fetchList: async ({ current, pageSize, search }) => {
 *     const res = await fetch(`/api/users?page=${current}&size=${pageSize}&q=${search}`);
 *     const data = await res.json();
 *     return { data: data.items, total: data.total };
 *   },
 * });
 * ```
 */
export function useInfiniteSelect<T extends BaseItem = BaseItem>(
  options: UseInfiniteSelectOptions<T>,
): UseInfiniteSelectResult<T> {
  const {
    queryKey,
    fetchList,
    fetchByIds,
    pageSize = DEFAULT_PAGE_SIZE,
    fetchStrategy = 'lazy',
    staleTime,
    getItemId: customGetItemId,
    getItemLabel: customGetItemLabel,
    getItemParentValue: customGetItemParentValue,
    parentValue,
    value: controlledValue,
    onChange: controlledOnChange,
    enabled = true,
  } = options;

  // ============================================================================
  // STATE
  // ============================================================================

  const [internalValue, setInternalValue] = useState<SelectValue>(controlledValue);
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpenedOnce, setHasOpenedOnce] = useState(false);
  const [searchText, setSearchText] = useState('');

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ============================================================================
  // HELPERS
  // ============================================================================

  const getItemId = customGetItemId ?? ((item: T) => item.id);
  const getItemLabel =
    customGetItemLabel ??
    ((item: T) => String((item as Record<string, unknown>).name ?? item.id));

  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const handleChange = useCallback(
    (newValue: SelectValue) => {
      setInternalValue(newValue);
      controlledOnChange?.(newValue);
    },
    [controlledOnChange],
  );

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
  // FETCH ENABLED LOGIC
  // ============================================================================

  const isListFetchEnabled = useMemo(() => {
    if (!enabled) return false;
    if (fetchStrategy === 'eager') return true;
    return isOpen || hasOpenedOnce;
  }, [enabled, fetchStrategy, isOpen, hasOpenedOnce]);

  // ============================================================================
  // DROPDOWN HANDLERS
  // ============================================================================

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (open) {
      setHasOpenedOnce(true);
    }
  }, []);

  // ============================================================================
  // INFINITE QUERY FOR LIST
  // ============================================================================

  const listQuery = useInfiniteQuery({
    queryKey: [queryKey, 'list', parentValue, searchText],
    queryFn: async ({ pageParam = 1 }) => {
      const request: FetchRequest = {
        current: pageParam as number,
        pageSize,
        parentValue,
        search: searchText || undefined,
      };

      const response = await fetchList(request);
      console.log({response})
      const hasMore = response.hasMore ?? response.data.length >= pageSize;

      return {
        data: response.data,
        nextPage: hasMore ? (pageParam as number) + 1 : undefined,
        fetchedWithParentValue: parentValue,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
    placeholderData: keepPreviousData,
    enabled: isListFetchEnabled,
    staleTime,
    throwOnError(error, query) {
      console.log(error, query);
    },
  });

  console.log({
    [queryKey]: listQuery.isError,
    message: listQuery.error
  })

  const listDataWithParent = useMemo(() => {
    const pages = listQuery.data?.pages ?? [];
    const result: Array<{ item: T; parentValue: unknown }> = [];

    for (const page of pages) {
      for (const item of page.data) {
        result.push({
          item,
          parentValue: page.fetchedWithParentValue,
        });
      }
    }

    return result;
  }, [listQuery.data?.pages]);

  const listData = useMemo(() => {
    return listDataWithParent.map(({ item }) => item);
  }, [listDataWithParent]);

  // ============================================================================
  // HYDRATION QUERY
  // ============================================================================

  const idsToHydrate = useMemo(() => {
    const listIds = new Set(listData.map(getItemId));
    return selectedIds.filter((id) => !listIds.has(id));
  }, [selectedIds, listData, getItemId]);

  const hydrationQuery = useQuery({
    queryKey: [queryKey, 'hydrate', idsToHydrate, parentValue],
    queryFn: async () => {
      if (fetchByIds) {
        return fetchByIds(idsToHydrate, parentValue);
      }
      const response = await fetchList({
        current: 1,
        pageSize: idsToHydrate.length,
        parentValue,
        ids: idsToHydrate,
      });
      return response.data;
    },
    enabled: idsToHydrate.length > 0,
    staleTime: staleTime ?? Infinity,
  });

  // ============================================================================
  // MERGE DATA
  // ============================================================================

  const itemParentMap = useMemo(() => {
    const map = new Map<string | number, unknown>();
    for (const { item, parentValue: pv } of listDataWithParent) {
      map.set(getItemId(item), pv);
    }
    return map;
  }, [listDataWithParent, getItemId]);

  const items = useMemo(() => {
    const allItems = [...(hydrationQuery.data ?? []), ...listData];
    const uniqueMap = new Map<string | number, T>();

    allItems.forEach((item) => {
      uniqueMap.set(getItemId(item), item);
    });

    return Array.from(uniqueMap.values());
  }, [hydrationQuery.data, listData, getItemId]);

  const selectedItems = useMemo(() => {
    const idSet = new Set(selectedIds);
    return items.filter((item) => idSet.has(getItemId(item)));
  }, [items, selectedIds, getItemId]);

  const selectOptions = useMemo((): InfiniteOption<T>[] => {
    return items.map((item) => {
      const itemParentValue = customGetItemParentValue
        ? customGetItemParentValue(item)
        : itemParentMap.get(getItemId(item));

      return {
        value: getItemId(item),
        label: getItemLabel(item),
        item,
        parentValue: itemParentValue,
      };
    });
  }, [items, getItemId, getItemLabel, customGetItemParentValue, itemParentMap]);

  // ============================================================================
  // SCROLL HANDLER
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
    [listQuery],
  );

  // ============================================================================
  // SEARCH HANDLER
  // ============================================================================

  const handleSearch = useCallback((searchValue: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setSearchText(searchValue);
    }, SEARCH_DEBOUNCE_MS);
  }, []);

  // ============================================================================
  // RESET
  // ============================================================================

  const handleReset = useCallback(() => {
    setSearchText('');
    listQuery.refetch();
  }, [listQuery]);

  // ============================================================================
  // ERROR HANDLING & RETRY
  // ============================================================================

  const listError = listQuery.error as Error | null;
  const hydrationError = hydrationQuery.error as Error | null;
  const combinedError = listError ?? hydrationError;

  const isRetrying = listQuery.isRefetching || hydrationQuery.isRefetching;

  const handleRetry = useCallback(() => {
    if (listError) {
      listQuery.refetch();
    }
    if (hydrationError) {
      hydrationQuery.refetch();
    }
  }, [listError, hydrationError, listQuery, hydrationQuery]);

  const handleClearErrorAndRetry = useCallback(() => {
    // Reset search text to clear any stale state
    setSearchText('');
    // Refetch both queries
    listQuery.refetch();
    if (idsToHydrate.length > 0) {
      hydrationQuery.refetch();
    }
  }, [listQuery, hydrationQuery, idsToHydrate.length]);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    options: selectOptions,
    items,
    selectedItems,
    value,
    isLoading: listQuery.isLoading,
    isHydrating: hydrationQuery.isLoading,
    isFetchingMore: listQuery.isFetchingNextPage,
    hasNextPage: listQuery.hasNextPage ?? false,
    isOpen,
    error: combinedError,
    listError,
    hydrationError,
    isRetrying,
    onChange: handleChange,
    onOpenChange: handleOpenChange,
    onScroll: handleScroll,
    onSearch: handleSearch,
    fetchNextPage: listQuery.fetchNextPage,
    reset: handleReset,
    retry: handleRetry,
    clearErrorAndRetry: handleClearErrorAndRetry,
  };
}