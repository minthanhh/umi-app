/**
 * XSelect - Infinite Select Types
 *
 * Types for infinite scroll/pagination select with React Query.
 * Can be used standalone or combined with cascading select.
 */

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
// CONFIG TYPES
// ============================================================================

/**
 * Configuration for Infinite Select.
 */
export interface InfiniteConfig<T extends BaseItem = BaseItem> {
  /** Unique query key for React Query caching */
  queryKey: string;

  /** Fetch list function */
  fetchList: (request: FetchRequest) => Promise<FetchResponse<T>>;

  /** Optional: fetch by IDs (for hydration) */
  fetchByIds?: (
    ids: Array<string | number>,
    parentValue?: unknown,
  ) => Promise<T[]>;

  /** Items per page (default: 20) */
  pageSize?: number;

  /**
   * Fetch strategy:
   * - 'eager': fetch on mount
   * - 'lazy': fetch when dropdown opens (default)
   */
  fetchStrategy?: 'eager' | 'lazy';

  /** Stale time for React Query (ms) */
  staleTime?: number;

  /** Get ID from item (default: item.id) */
  getItemId?: (item: T) => string | number;

  /** Get label from item (default: item.name or item.id) */
  getItemLabel?: (item: T) => string;

  /**
   * Get parent value from item (for accurate cascade delete).
   *
   * @example
   * ```ts
   * getItemParentValue: (project) => project.members?.map(m => m.userId)
   * ```
   */
  getItemParentValue?: (item: T) => unknown;
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

  /** Scroll handler */
  onScroll: (e: React.UIEvent<HTMLElement>) => void;

  /** Search handler */
  onSearch: (value: string) => void;

  /** Fetch next page */
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