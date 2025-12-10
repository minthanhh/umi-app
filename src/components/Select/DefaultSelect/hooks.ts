import { keepPreviousData } from '@tanstack/react-query';
import { useInfiniteQuery, useQuery } from '@umijs/max';
import { isEmpty } from 'lodash';
import { useCallback, useMemo, useState } from 'react';

import type {
  BaseItem,
  DataSourceResult,
  DropdownState,
  FetchStrategy,
  NormalizedInput,
  PaginatedResponse,
  SelectOption,
  SelectValue,
  SelectWrapperConfig,
} from './types';

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_PAGE_SIZE = 10;
const SCROLL_THRESHOLD = 10;

// ============================================================================
// useNormalizedInput Hook
// Normalizes value prop into selectedIds and prefilledItems
// ============================================================================

export function useNormalizedInput<T extends BaseItem>(
  value: SelectValue<T>,
  getItemId: (item: T) => string | number = (item) => item.id,
): NormalizedInput<T> {
  return useMemo(() => {
    if (isEmpty(value) || value === null || value === undefined) {
      return { selectedIds: [], prefilledItems: [] };
    }

    const valuesArray = Array.isArray(value) ? value : [value];
    const ids: Array<string | number> = [];
    const items: T[] = [];

    valuesArray.forEach((v) => {
      if (typeof v === 'object' && v !== null && 'id' in v) {
        const item = v as T;
        items.push(item);
        ids.push(getItemId(item));
      } else if (typeof v === 'string' || typeof v === 'number') {
        ids.push(v);
      }
    });

    return { selectedIds: ids, prefilledItems: items };
  }, [value, getItemId]);
}

// ============================================================================
// useDropdownState Hook
// Manages dropdown open/close state and lazy loading trigger
// ============================================================================

export function useDropdownState(
  fetchStrategy: FetchStrategy = 'lazy',
): DropdownState {
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpenedOnce, setHasOpenedOnce] = useState(false);

  const isListFetchEnabled =
    fetchStrategy === 'eager' ? true : isOpen || hasOpenedOnce;

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (open) {
      setHasOpenedOnce(true);
    }
  }, []);

  return { isOpen, isListFetchEnabled, handleOpenChange };
}

// ============================================================================
// useHydration Hook
// Fetches full data for IDs that don't have prefilled data
// ============================================================================

interface UseHydrationOptions<T extends BaseItem> {
  selectedIds: Array<string | number>;
  prefilledItems: T[];
  config: SelectWrapperConfig<T>;
}

interface UseHydrationResult<T extends BaseItem> {
  hydratedData: T[];
  isHydrating: boolean;
  error: Error | null;
}

export function useHydration<T extends BaseItem>({
  selectedIds,
  prefilledItems,
  config,
}: UseHydrationOptions<T>): UseHydrationResult<T> {
  const getItemId = config.getItemId ?? ((item: T) => item.id);

  // Calculate IDs to hydrate (IDs not in prefilled items)
  const [idsToHydrate] = useState<Array<string | number>>(() => {
    const knownIds = new Set(prefilledItems.map(getItemId));
    return selectedIds.filter((id) => !knownIds.has(id));
  });

  const { data, isLoading, error } = useQuery({
    queryKey: [config.queryKey, 'hydrate', idsToHydrate],
    queryFn: async () => {
      if (config.fetchByIds) {
        return config.fetchByIds(idsToHydrate);
      }
      // Fallback: use fetchList with ids filter
      const response = await config.fetchList({
        current: 1,
        pageSize: idsToHydrate.length,
        ids: idsToHydrate,
      });
      return response.data;
    },
    enabled: idsToHydrate.length > 0,
    staleTime: config.staleTime ?? Infinity,
  });

  return {
    hydratedData: data ?? [],
    isHydrating: isLoading,
    error: error as Error | null,
  };
}

// ============================================================================
// useList Hook
// Fetches paginated list with infinite scroll support
// ============================================================================

interface UseListOptions<T extends BaseItem> {
  enabled: boolean;
  config: SelectWrapperConfig<T>;
}

interface UseListResult<T extends BaseItem> {
  listData: T[];
  isLoading: boolean;
  isFetchingMore: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  error: Error | null;
  refetch: () => void;
}

export function useList<T extends BaseItem>({
  enabled,
  config,
}: UseListOptions<T>): UseListResult<T> {
  const pageSize = config.pageSize ?? DEFAULT_PAGE_SIZE;

  const query = useInfiniteQuery({
    queryKey: [config.queryKey, 'list'],
    queryFn: async ({ pageParam = 1 }): Promise<PaginatedResponse<T>> => {
      const response = await config.fetchList({
        current: pageParam as number,
        pageSize,
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
    enabled,
    staleTime: config.staleTime,
  });

  const listData = useMemo(() => {
    return query.data?.pages.flatMap((p) => p.data) ?? [];
  }, [query.data?.pages]);

  return {
    listData,
    isLoading: query.isLoading,
    isFetchingMore: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage ?? false,
    fetchNextPage: query.fetchNextPage,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
}

// ============================================================================
// useDataSource Hook (Facade)
// Combines hydration and list data into unified data source
// ============================================================================

interface UseDataSourceOptions<T extends BaseItem> {
  selectedIds: Array<string | number>;
  prefilledItems: T[];
  isListFetchEnabled: boolean;
  config: SelectWrapperConfig<T>;
}

export function useDataSource<T extends BaseItem>({
  selectedIds,
  prefilledItems,
  isListFetchEnabled,
  config,
}: UseDataSourceOptions<T>): DataSourceResult<T> {
  const hydration = useHydration({ selectedIds, prefilledItems, config });
  const list = useList({ enabled: isListFetchEnabled, config });

  // Merge all data sources, deduplicated by ID
  const items = useMemo(() => {
    const getItemId = config.getItemId ?? ((item: T) => item.id);
    const allItems = [
      ...prefilledItems,
      ...hydration.hydratedData,
      ...list.listData,
    ];
    const uniqueMap = new Map<string | number, T>();

    allItems.forEach((item) => {
      uniqueMap.set(getItemId(item), item);
    });

    return Array.from(uniqueMap.values());
  }, [prefilledItems, hydration.hydratedData, list.listData, config.getItemId]);

  return {
    items,
    listData: list.listData,
    hydratedData: hydration.hydratedData,
    isLoading: list.isLoading,
    isHydrating: hydration.isHydrating,
    isFetchingMore: list.isFetchingMore,
    hasNextPage: list.hasNextPage,
    fetchNextPage: list.fetchNextPage,
    error: hydration.error || list.error,
  };
}

// ============================================================================
// useMergedOptions Hook
// Converts items to select options format
// ============================================================================

interface UseMergedOptionsOptions<T extends BaseItem> {
  items: T[];
  config: SelectWrapperConfig<T>;
}

export function useMergedOptions<T extends BaseItem>({
  items,
  config,
}: UseMergedOptionsOptions<T>): SelectOption<T>[] {
  const getItemId = config.getItemId ?? ((item: T) => item.id);
  const getItemLabel = config.getItemLabel ?? ((item: T) => String(item.id));

  return useMemo(() => {
    return items.map((item) => ({
      value: getItemId(item),
      label: getItemLabel(item),
      item,
    }));
  }, [items, getItemId, getItemLabel]);
}

// ============================================================================
// useScrollHandler Hook
// Handles infinite scroll logic
// ============================================================================

interface UseScrollHandlerOptions {
  hasNextPage: boolean;
  isFetchingMore: boolean;
  fetchNextPage: () => void;
  threshold?: number;
}

export function useScrollHandler({
  hasNextPage,
  isFetchingMore,
  fetchNextPage,
  threshold = SCROLL_THRESHOLD,
}: UseScrollHandlerOptions) {
  return useCallback(
    (e: React.UIEvent<HTMLElement>) => {
      const target = e.target as HTMLElement;
      const isNearBottom =
        target.scrollTop + target.offsetHeight >=
        target.scrollHeight - threshold;

      if (isNearBottom && hasNextPage && !isFetchingMore) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingMore, fetchNextPage, threshold],
  );
}
