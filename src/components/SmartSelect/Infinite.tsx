/**
 * Select.Infinite - Infinite scroll wrapper component
 *
 * Features:
 * - Infinite scroll with React Query
 * - Hydration for selected values
 * - Lazy/eager loading
 * - Render props for any UI library
 *
 * Does NOT know about dependencies - completely independent
 */

import { keepPreviousData } from '@tanstack/react-query';
import { useInfiniteQuery, useQuery } from '@umijs/max';
import { useCallback, useMemo, useState } from 'react';

import { useSmartSelectStoreOptional } from './context';
import type {
  BaseItem,
  FetchRequest,
  InfiniteProps,
  InfiniteRenderProps,
  SelectOption,
  SelectValue,
} from './types';

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_PAGE_SIZE = 20;
const SCROLL_THRESHOLD = 50;

// ============================================================================
// Component
// ============================================================================

export function Infinite<T extends BaseItem = BaseItem>({
  config: inlineConfig,
  configName,
  value: controlledValue,
  onChange: controlledOnChange,
  children,
}: InfiniteProps<T>) {
  // Try to get config from provider if configName provided
  const store = useSmartSelectStoreOptional();
  const providerConfig = configName
    ? store?.getInfiniteConfig<T>(configName)
    : undefined;

  // Merge configs: inline takes priority
  const config = inlineConfig ?? providerConfig;

  if (!config) {
    throw new Error(
      'Infinite: config is required. Provide via props or register in SmartSelectProvider',
    );
  }

  // State
  const [internalValue, setInternalValue] =
    useState<SelectValue>(controlledValue);
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpenedOnce, setHasOpenedOnce] = useState(false);

  // Value management
  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const handleChange = useCallback(
    (newValue: SelectValue) => {
      setInternalValue(newValue);
      controlledOnChange?.(newValue);
    },
    [controlledOnChange],
  );

  // Helpers
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

  // Fetch enabled logic
  const isListFetchEnabled = useMemo(() => {
    if (config.fetchStrategy === 'eager') return true;
    return isOpen || hasOpenedOnce;
  }, [config.fetchStrategy, isOpen, hasOpenedOnce]);

  // Dropdown handlers
  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (open) {
      setHasOpenedOnce(true);
    }
  }, []);

  // ============================================================================
  // Infinite Query
  // ============================================================================

  const listQuery = useInfiniteQuery({
    queryKey: [config.queryKey, 'list'],
    queryFn: async ({ pageParam = 1 }) => {
      const request: FetchRequest = {
        current: pageParam as number,
        pageSize,
      };

      const response = await config.fetchList(request);
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
  // Hydration Query
  // ============================================================================

  const idsToHydrate = useMemo(() => {
    const listIds = new Set(listData.map(getItemId));
    return selectedIds.filter((id) => !listIds.has(id));
  }, [selectedIds, listData, getItemId]);

  const hydrationQuery = useQuery({
    queryKey: [config.queryKey, 'hydrate', idsToHydrate],
    queryFn: async () => {
      if (config.fetchByIds) {
        return config.fetchByIds(idsToHydrate);
      }
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

  // ============================================================================
  // Merged Data
  // ============================================================================

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

  const options = useMemo((): SelectOption<T>[] => {
    return items.map((item) => ({
      value: getItemId(item),
      label: getItemLabel(item),
      item,
    }));
  }, [items, getItemId, getItemLabel]);

  // ============================================================================
  // Scroll Handler
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
  // Render Props
  // ============================================================================

  const renderProps: InfiniteRenderProps<T> = {
    options,
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
    fetchNextPage: listQuery.fetchNextPage,
  };

  return <>{children(renderProps)}</>;
}

export default Infinite;
