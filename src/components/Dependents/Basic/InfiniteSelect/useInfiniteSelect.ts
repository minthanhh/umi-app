/**
 * useInfiniteSelect - Hook for Infinite Scroll Select with React Query
 *
 * Features:
 * - Infinite scroll với useInfiniteQuery
 * - Hydration cho selected values với useQuery
 * - Auto-reset khi parentValue thay đổi
 * - Lazy/eager loading strategy
 * - Search với debounce
 * - Optimized với keepPreviousData
 */

import { keepPreviousData } from '@tanstack/react-query';
import { useInfiniteQuery, useQuery } from '@umijs/max';
import { useCallback, useMemo, useRef, useState } from 'react';

import type {
  BaseItem,
  FetchRequest,
  InfiniteSelectOption,
  SelectValue,
  UseInfiniteSelectOptions,
  UseInfiniteSelectResult,
} from './types';

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_PAGE_SIZE = 10;
const SCROLL_THRESHOLD = 50;
const SEARCH_DEBOUNCE_MS = 300;

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook quản lý infinite scroll select với React Query.
 *
 * @param options - Cấu hình hook
 * @returns State và handlers cho infinite select
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
 *
 * return (
 *   <Select
 *     options={options}
 *     loading={isLoading}
 *     onPopupScroll={onScroll}
 *     onDropdownVisibleChange={onOpenChange}
 *     onChange={onChange}
 *   />
 * );
 * ```
 *
 * @example With DependentField
 * ```tsx
 * const { parentValue } = useDependentField('province');
 *
 * const infiniteSelect = useInfiniteSelect({
 *   queryKey: 'cities',
 *   fetchList: async ({ current, pageSize, parentValue }) => {
 *     const res = await fetch(`/api/cities?province=${parentValue}&page=${current}`);
 *     return res.json();
 *   },
 *   parentValue,
 *   enabled: !!parentValue, // Chỉ fetch khi có parent value
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

  // Debounce ref for search
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ============================================================================
  // HELPERS
  // ============================================================================

  const getItemId = customGetItemId ?? ((item: T) => item.id);
  const getItemLabel =
    customGetItemLabel ??
    ((item: T) => String((item as Record<string, unknown>).name ?? item.id));

  // Value management (controlled/uncontrolled)
  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const handleChange = useCallback(
    (newValue: SelectValue) => {
      setInternalValue(newValue);
      controlledOnChange?.(newValue);
    },
    [controlledOnChange],
  );

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
  // FETCH ENABLED LOGIC
  // ============================================================================

  const isListFetchEnabled = useMemo(() => {
    // Không fetch nếu disabled
    if (!enabled) return false;

    // Apply fetch strategy
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
      const hasMore = response.hasMore ?? response.data.length >= pageSize;

      return {
        data: response.data,
        nextPage: hasMore ? (pageParam as number) + 1 : undefined,
        // Store the parentValue at the time of fetch for cascade delete
        fetchedWithParentValue: parentValue,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
    placeholderData: keepPreviousData,
    enabled: isListFetchEnabled,
    staleTime,
  });

  // Flatten list data with parentValue tracking
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

  // Flatten list data (for backward compatibility)
  const listData = useMemo(() => {
    return listDataWithParent.map(({ item }) => item);
  }, [listDataWithParent]);

  // ============================================================================
  // HYDRATION QUERY FOR SELECTED ITEMS
  // ============================================================================

  // IDs cần hydrate (không có trong list data)
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
      // Fallback: dùng fetchList với ids filter
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
  // MERGE ALL DATA
  // ============================================================================

  // Build a map of item ID -> parentValue from list data
  const itemParentMap = useMemo(() => {
    const map = new Map<string | number, unknown>();
    for (const { item, parentValue: pv } of listDataWithParent) {
      map.set(getItemId(item), pv);
    }
    return map;
  }, [listDataWithParent, getItemId]);

  // Merge hydration data với list data (unique by id)
  const items = useMemo(() => {
    const allItems = [...(hydrationQuery.data ?? []), ...listData];
    const uniqueMap = new Map<string | number, T>();

    allItems.forEach((item) => {
      uniqueMap.set(getItemId(item), item);
    });

    return Array.from(uniqueMap.values());
  }, [hydrationQuery.data, listData, getItemId]);

  // Selected items với đầy đủ data
  const selectedItems = useMemo(() => {
    const idSet = new Set(selectedIds);
    return items.filter((item) => idSet.has(getItemId(item)));
  }, [items, selectedIds, getItemId]);

  // Convert to options with parentValue for cascade delete
  const selectOptions = useMemo((): InfiniteSelectOption<T>[] => {
    return items.map((item) => {
      // Priority: getItemParentValue (from item) > itemParentMap (from fetch request)
      // Using getItemParentValue allows accurate tracking when items belong to multiple parents
      const itemParentValue = customGetItemParentValue
        ? customGetItemParentValue(item)
        : itemParentMap.get(getItemId(item));

      return {
        value: getItemId(item),
        label: getItemLabel(item),
        item,
        // Include parentValue for cascade delete support
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
  // SEARCH HANDLER (DEBOUNCED)
  // ============================================================================

  const handleSearch = useCallback((value: string) => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      setSearchText(value);
    }, SEARCH_DEBOUNCE_MS);
  }, []);

  // ============================================================================
  // RESET HANDLER
  // ============================================================================

  const handleReset = useCallback(() => {
    setSearchText('');
    listQuery.refetch();
  }, [listQuery]);

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
    error: (listQuery.error ?? hydrationQuery.error) as Error | null,
    onChange: handleChange,
    onOpenChange: handleOpenChange,
    onScroll: handleScroll,
    onSearch: handleSearch,
    fetchNextPage: listQuery.fetchNextPage,
    reset: handleReset,
  };
}