/**
 * XSelect - Infinite Select Types
 *
 * Types for infinite scroll/pagination select with React Query.
 * Can be used standalone or combined with cascading select.
 */

import type {
  InfiniteData,
  QueryFunction,
  QueryKey,
  UseInfiniteQueryOptions,
  UseQueryOptions,
} from '@tanstack/react-query';

import type { XSelectOption } from './core';

// ============================================================================
// BASE TYPES
// ============================================================================

/**
 * Base item type - items must have an id.
 */
export interface BaseItem {
  id: string | number;
  [key: string]: unknown;
}

/**
 * Option with full item data.
 */
export interface InfiniteOption<T extends BaseItem = BaseItem> {
  label: string;
  value: string | number;
  item: T;
  disabled?: boolean;
  /** Parent value(s) for cascade delete */
  parentValue?: unknown;
}

// ============================================================================
// FETCH TYPES
// ============================================================================

/**
 * Request params for fetch function.
 */
export interface FetchRequest {
  /** Current page (starts from 1) */
  current: number;

  /** Items per page */
  pageSize: number;

  /** Parent value (for dependent field) */
  parentValue?: unknown;

  /** Search keyword */
  search?: string;

  /** Specific IDs to fetch (for hydration) */
  ids?: Array<string | number>;
}

/**
 * Response from fetch function.
 */
export interface FetchResponse<T> {
  data: T[];
  total?: number;
  hasMore?: boolean;
}

// ============================================================================
// CONFIG TYPES (GROUPED PROPS)
// ============================================================================

/**
 * Internal page data structure for infinite query.
 */
export interface InfinitePageData<T> {
  data: T[];
  nextPage: number | undefined;
  fetchedWithParentValue: unknown;
}

/**
 * Base UseInfiniteQueryOptions with correct generics for XSelect.
 *
 * React Query v5 UseInfiniteQueryOptions generic parameters:
 * - TQueryFnData: What queryFn returns per page (InfinitePageData<T>)
 * - TError: Error type (Error)
 * - TData: Transformed/selected data type (InfiniteData<InfinitePageData<T>>)
 * - TQueryKey: Query key type (ListQueryKey)
 * - TPageParam: Page parameter type (number)
 */
type BaseInfiniteQueryOptions<T extends BaseItem = BaseItem> = UseInfiniteQueryOptions<
  InfinitePageData<T>,               // TQueryFnData - what queryFn returns per page
  Error,                              // TError
  InfiniteData<InfinitePageData<T>>, // TData - full infinite data structure
  readonly unknown[],                       // TQueryKey
  number                              // TPageParam - page number type
>;

/**
 * List Query configuration - extends UseInfiniteQueryOptions.
 * Omits fields that are managed internally by the hook.
 *
 * @example
 * ```tsx
 * const listQuery: ListQueryConfig<User> = {
 *   queryFn: async ({ pageParam, queryKey }) => {
 *     const [, , parentValue, search] = queryKey;
 *     const res = await fetch(`/api/users?page=${pageParam}&search=${search}`);
 *     const data = await res.json();
 *     return {
 *       data: data.items,
 *       nextPage: data.hasMore ? pageParam + 1 : undefined,
 *       fetchedWithParentValue: parentValue,
 *     };
 *   },
 *   initialPageParam: 1,
 *   getNextPageParam: (lastPage) => lastPage.nextPage,
 *   staleTime: 5 * 60 * 1000,
 *   gcTime: 10 * 60 * 1000,
 * };
 * ```
 */
export interface ListQueryConfig<T extends BaseItem = BaseItem>
  extends Omit<
    BaseInfiniteQueryOptions<T>,
    // Managed internally by useInfiniteList
    | 'queryKey'
    | 'enabled'
  > {
  /**
   * Fetch strategy:
   * - 'eager': fetch immediately when parentValue changes (after debounce)
   * - 'lazy': fetch only when dropdown opens (default)
   */
  fetchStrategy?: 'eager' | 'lazy';
}

/**
 * Extended QueryFunction that includes ids parameter for hydration.
 * Extends React Query's QueryFunction signature.
 */
export type HydrationQueryFunction<T extends BaseItem = BaseItem> = (
  ...args: [...Parameters<QueryFunction<T[]>>, ids: Array<string | number>]
) => ReturnType<QueryFunction<T[]>>;

/**
 * Hydration Query configuration - extends UseQueryOptions.
 * Omits fields that are managed internally by the hook.
 */
export interface HydrationQueryConfig<T extends BaseItem = BaseItem>
  extends Omit<
    UseQueryOptions<T[], Error, T[], readonly unknown[]>,
    // Managed internally
    | 'queryKey'
    | 'enabled'
    | 'queryFn'
  > {
    queryFn: HydrationQueryFunction<T>
  }

/**
 * Item accessor functions.
 */
export interface ItemAccessors<T extends BaseItem = BaseItem> {
  /** Get ID from item (default: item.id) */
  getId?: (item: T) => string | number;

  /** Get label from item (default: item.name or item.id) */
  getLabel?: (item: T) => string;

  /**
   * Get parent value from item (for accurate cascade delete).
   *
   * @example
   * ```ts
   * getParentValue: (project) => project.members?.map(m => m.userId)
   * ```
   */
  getParentValue?: (item: T) => unknown;
}

// ============================================================================
// HOOK RESULT TYPE
// ============================================================================

/**
 * Result from useInfiniteSelect hook.
 */
export interface UseInfiniteSelectResult<T extends BaseItem = BaseItem> {
  /** Formatted options */
  options: InfiniteOption<T>[];

  /** Raw items */
  items: T[];

  /** Selected items (full data) */
  selectedItems: T[];

  /** Current value */
  value: string | number | Array<string | number> | undefined | null;

  /** Initial loading */
  isLoading: boolean;

  /** Hydrating selected values */
  isHydrating: boolean;

  /** Fetching more (infinite scroll) */
  isFetchingMore: boolean;

  /** Has next page */
  hasNextPage: boolean;

  /** Dropdown is open */
  isOpen: boolean;

  /** Combined error (list or hydration) */
  error: Error | null;

  /** List query error */
  listError: Error | null;

  /** Hydration query error */
  hydrationError: Error | null;

  /** Whether currently retrying */
  isRetrying: boolean;

  /** Value change handler */
  onChange: (value: string | number | Array<string | number> | undefined | null) => void;

  /** Dropdown open/close handler */
  onOpenChange: (open: boolean) => void;

  /** Scroll handler (trigger load more) */
  onScroll: (e: React.UIEvent<HTMLElement>) => void;

  /** Search handler (debounced) */
  onSearch: (value: string) => void;

  /** Manual fetch next page */
  fetchNextPage: () => void;

  /** Reset and refetch */
  reset: () => void;

  /** Retry failed query */
  retry: () => void;

  /** Clear error and retry */
  clearErrorAndRetry: () => void;
}

// ============================================================================
// WRAPPER TYPES
// ============================================================================

/**
 * Injected props from Dependent wrapper.
 */
export interface DependentInjectedProps {
  /** Current value */
  value: unknown;

  /** Change handler */
  onChange: (value: unknown) => void;

  /** Disabled by parent */
  disabled?: boolean;

  /** Parent value(s) */
  parentValue?: unknown;

  /** Filtered options */
  options?: XSelectOption[];

  /** Loading state */
  loading?: boolean;
}

/**
 * Injected props from Infinite wrapper.
 */
export interface InfiniteInjectedProps<T extends BaseItem = BaseItem> {
  /** Current value */
  value: string | number | Array<string | number> | undefined | null;

  /** Change handler */
  onChange: (value: string | number | Array<string | number> | undefined | null) => void;

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

  /** Search handler (debounced) */
  onSearch: (value: string) => void;

  /** Fetch next page manually */
  fetchNextPage: () => void;

  /** Retry failed query */
  retry: () => void;

  /** Clear error and retry */
  clearErrorAndRetry: () => void;

  /** Disabled state */
  disabled?: boolean;

  /** Parent value (from DependentWrapper if nested) */
  parentValue?: unknown;
}

// ============================================================================
// CONTEXT TYPE
// ============================================================================

/**
 * Context value from DependentWrapper to InfiniteWrapper.
 */
export interface DependentContextValue {
  /** Field name */
  name: string;

  /** Field value */
  value: unknown;

  /**
   * Parent value.
   * - Single dependency: direct value
   * - Multiple dependencies: object { [fieldName]: value }
   */
  parentValue: unknown;

  /** All parent values (when dependsOn is array) */
  parentValues?: Record<string, unknown>;

  /** Change handler */
  onChange: (value: unknown) => void;

  /** Disabled by parent */
  isDisabledByParent: boolean;

  /** Loading state */
  isLoading: boolean;

  /** Has parent dependency */
  hasDependency: boolean;
}