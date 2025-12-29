/**
 * useInfiniteSelect - Hook for Infinite Scroll Select
 *
 * Composes smaller hooks:
 * - useInfiniteList: Handles infinite scroll list fetching
 * - useHydration: Handles hydrating selected values
 * - useSelectOptions: Handles merging and transforming to options
 *
 * Features:
 * - Infinite scroll with useInfiniteQuery
 * - Hydration for selected values with useQuery
 * - Auto-reset when parentValue changes
 * - Lazy/eager loading strategy
 * - Search with debounce
 * - Full React Query options support
 *
 * NOTE: This hook depends on @tanstack/react-query.
 */

import type {
  BaseItem,
  HydrationQueryConfig,
  InfiniteOption,
  ItemAccessors,
  ListQueryConfig,
  SelectValue,
} from '../types';

import { useHydration } from './useHydration';
import { useInfiniteList } from './useInfiniteList';
import { useSelectOptions } from './useSelectOptions';

// ============================================================================
// TYPES
// ============================================================================

export interface UseInfiniteSelectOptions<T extends BaseItem = BaseItem> {
  /** Unique query key for React Query caching */
  queryKey: string;

  /** List query configuration (useInfiniteQuery options) */
  listQuery: ListQueryConfig<T>;

  /** Hydration query configuration (useQuery options) */
  hydrationQuery?: HydrationQueryConfig<T>;

  /** Item accessor functions */
  itemAccessors?: ItemAccessors<T>;

  /** Parent value (for dependent field) */
  parentValue?: unknown;

  /** Controlled value */
  value?: SelectValue;

  /** Change handler */
  onChange?: (value: SelectValue) => void;

  /** Enable/disable query (default: true) */
  enabled?: boolean;
}

export interface UseInfiniteSelectResult<T extends BaseItem = BaseItem> {
  /** Select options (label, value, item, parentValue) */
  options: InfiniteOption<T>[];

  /** Raw items */
  items: T[];

  /** Current value */
  value?: SelectValue;

  /** Loading state */
  isLoading: boolean;

  /** Hydrating selected values */
  isHydrating: boolean;

  /** Fetching more pages */
  isFetchingMore: boolean;

  /** Has more pages */
  hasNextPage: boolean;

  /** Dropdown open state */
  isOpen: boolean;

  /** Handle dropdown open/close */
  onOpenChange: (open: boolean) => void;

  /** Handle search input (debounced) */
  onSearch: (value: string) => void;

  /** Fetch next page manually */
  fetchNextPage: () => void;

  /** Reset search and refetch */
  reset: () => void;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for managing infinite scroll select.
 *
 * NOTE: Scroll handling is NOT included. Use `fetchNextPage` to load more items.
 *
 * @example
 * ```tsx
 * const {
 *   options,
 *   isLoading,
 *   hasNextPage,
 *   fetchNextPage,
 *   onOpenChange,
 * } = useInfiniteSelect({
 *   queryKey: 'users',
 *   listQuery: {
 *     queryFn: async ({ pageParam = 1 }) => {
 *       const res = await fetch(`/api/users?page=${pageParam}`);
 *       const data = await res.json();
 *       return { data: data.items, nextPage: data.hasMore ? pageParam + 1 : undefined };
 *     },
 *     getNextPageParam: (lastPage) => lastPage.nextPage,
 *     initialPageParam: 1,
 *   },
 *   hydrationQuery: {
 *     queryFn: async (_, ids) => {
 *       const res = await fetch(`/api/users?ids=${ids.join(',')}`);
 *       return res.json();
 *     },
 *   },
 *   itemAccessors: {
 *     getId: (item) => item.id,
 *     getLabel: (item) => item.name,
 *   },
 * });
 * ```
 */
export function useInfiniteSelect<T extends BaseItem = BaseItem>(
  options: UseInfiniteSelectOptions<T>,
): UseInfiniteSelectResult<T> {
  const {
    queryKey,
    listQuery,
    hydrationQuery,
    itemAccessors,
    parentValue,
    value: controlledValue,
    enabled = true,
  } = options;

  // ============================================================================
  // 1. HYDRATION (runs first, independent, only once with initial value)
  // ============================================================================

  const hydrationResult = useHydration<T>({
    queryKey,
    hydrationQuery,
    initialValue: controlledValue,
  });

  // ============================================================================
  // 2. INFINITE LIST (independent from hydration)
  // ============================================================================

  const listResult = useInfiniteList<T>({
    queryKey,
    listQuery,
    parentValue,
    enabled,
  });

  // ============================================================================
  // 3. SELECT OPTIONS (merges both results)
  // ============================================================================

  const optionsResult = useSelectOptions<T>({
    listItemsWithParent: listResult.itemsWithParent,
    hydratedItems: hydrationResult.items,
    itemAccessors,
    currentParentValue: parentValue,
  });

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    options: optionsResult.options,
    items: optionsResult.items,
    value: controlledValue,
    isLoading: listResult.isLoading,
    isHydrating: hydrationResult.isLoading,
    isFetchingMore: listResult.isFetchingMore,
    hasNextPage: listResult.hasNextPage,
    isOpen: listResult.isOpen,
    onOpenChange: listResult.onOpenChange,
    onSearch: listResult.onSearch,
    fetchNextPage: listResult.fetchNextPage,
    reset: listResult.reset,
  };
}
