/**
 * useInfiniteList - Hook for infinite scroll list fetching
 *
 * Handles:
 * - Infinite query with pagination
 * - Lazy/eager loading strategy
 * - Search with debounce (internal or external controlled)
 * - Parent value debounce to prevent race conditions
 *
 * Fetch Strategy:
 * - 'eager': Fetch immediately when parentValue changes (after debounce)
 * - 'lazy': Only fetch when dropdown opens (pending changes applied on open)
 *
 * NOTE: Scroll handling is NOT included. User should handle scroll externally.
 */

import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { BaseItem, InfinitePageData, ListQueryConfig } from '../types';

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_SEARCH_DEBOUNCE_MS = 300;
const DEFAULT_PARENT_VALUE_DEBOUNCE_MS = 800;

// ============================================================================
// TYPES
// ============================================================================

export interface UseInfiniteListOptions<T extends BaseItem = BaseItem> {
  /** Unique query key */
  queryKey: string;

  /** List query configuration */
  listQuery: ListQueryConfig<T>;

  /** Parent value for dependent field */
  parentValue?: unknown;

  /** Enable/disable query */
  enabled?: boolean;

  /**
   * External controlled search text.
   * When provided, hook switches to controlled mode and ignores internal state.
   */
  searchText?: string;

  /**
   * Debounce time in milliseconds for search (default: 300).
   * Only used in internal mode.
   */
  searchDebounceMs?: number;

  /**
   * Debounce time in milliseconds for parentValue changes (default: 150).
   * Prevents race conditions when user selects/deselects items quickly.
   */
  parentValueDebounceMs?: number;

  /** Callback fired on every search input (before debounce). */
  onSearchInput?: (value: string) => void;

  /** Callback fired after search debounce. */
  onSearchChange?: (value: string) => void;
}

export interface ListDataWithParent<T> {
  item: T;
  parentValue: unknown;
}

export interface UseInfiniteListResult<T extends BaseItem = BaseItem> {
  /** Raw items from all pages */
  items: T[];

  /** Items with their fetched parentValue */
  itemsWithParent: ListDataWithParent<T>[];

  /** Current search text (internal or external) */
  searchText: string;

  /** Loading state */
  isLoading: boolean;

  /** Fetching more pages */
  isFetchingMore: boolean;

  /** Has more pages to fetch */
  hasNextPage: boolean;

  /** Dropdown open state */
  isOpen: boolean;

  /** Handle dropdown open/close */
  onOpenChange: (open: boolean) => void;

  /** Handle search input */
  onSearch: (value: string) => void;

  /** Fetch next page manually */
  fetchNextPage: () => void;

  /** Reset search and refetch */
  reset: () => void;
}

// ============================================================================
// HELPERS
// ============================================================================

function serializeParentValue(value: unknown): string {
  if (value === undefined || value === null) return '';
  if (Array.isArray(value)) {
    return [...value].sort().join(',');
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

// ============================================================================
// HOOK
// ============================================================================

export function useInfiniteList<T extends BaseItem = BaseItem>(
  options: UseInfiniteListOptions<T>,
): UseInfiniteListResult<T> {
  const {
    queryKey,
    listQuery,
    parentValue,
    enabled = true,
    searchText: externalSearchText,
    searchDebounceMs = DEFAULT_SEARCH_DEBOUNCE_MS,
    parentValueDebounceMs = DEFAULT_PARENT_VALUE_DEBOUNCE_MS,
    onSearchInput,
    onSearchChange,
  } = options;

  const { fetchStrategy = 'lazy', ...queryOptions } = listQuery;
  const isSearchControlled = externalSearchText !== undefined;

  // ============================================================================
  // STATE - Only what triggers re-render when needed
  // ============================================================================

  const [isOpen, setIsOpen] = useState(false);
  const [hasOpenedOnce, setHasOpenedOnce] = useState(false);
  const [internalSearchText, setInternalSearchText] = useState('');

  // This state triggers query refetch
  const [committedParentValue, setCommittedParentValue] = useState(parentValue);

  // ============================================================================
  // REFS - Track state without re-render
  // ============================================================================

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const parentValueTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingParentValueRef = useRef<unknown>(parentValue);
  const isOpenRef = useRef(false);

  const searchText = isSearchControlled
    ? externalSearchText
    : internalSearchText;

  // ============================================================================
  // PARENT VALUE DEBOUNCE LOGIC
  // ============================================================================

  useEffect(() => {
    const currentSerialized = serializeParentValue(parentValue);
    const committedSerialized = serializeParentValue(committedParentValue);

    // No change needed
    if (currentSerialized === committedSerialized) {
      pendingParentValueRef.current = parentValue;
      return;
    }

    // Store pending value
    pendingParentValueRef.current = parentValue;

    // Clear previous timeout
    if (parentValueTimeoutRef.current) {
      clearTimeout(parentValueTimeoutRef.current);
      parentValueTimeoutRef.current = null;
    }

    if (fetchStrategy === 'eager') {
      // Eager: Debounce then commit
      parentValueTimeoutRef.current = setTimeout(() => {
        setCommittedParentValue(parentValue);
        parentValueTimeoutRef.current = null;
      }, parentValueDebounceMs);
    } else if (fetchStrategy === 'lazy' && isOpenRef.current) {
      // Lazy BUT dropdown is open: Commit immediately with debounce
      // This fixes the bug where parent changes while dropdown is open
      parentValueTimeoutRef.current = setTimeout(() => {
        setCommittedParentValue(parentValue);
        // Also reset search when parent changes to avoid stale cached results
        if (!isSearchControlled) {
          setInternalSearchText('');
        }
        parentValueTimeoutRef.current = null;
      }, parentValueDebounceMs);
    }
    // Lazy with dropdown closed: Don't commit here, will commit on dropdown open

    return () => {
      if (parentValueTimeoutRef.current) {
        clearTimeout(parentValueTimeoutRef.current);
        parentValueTimeoutRef.current = null;
      }
    };
  }, [
    parentValue,
    committedParentValue,
    fetchStrategy,
    parentValueDebounceMs,
    isSearchControlled,
  ]);

  // ============================================================================
  // CLEANUP
  // ============================================================================

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      if (parentValueTimeoutRef.current)
        clearTimeout(parentValueTimeoutRef.current);
    };
  }, []);

  // ============================================================================
  // FETCH ENABLED LOGIC
  // ============================================================================

  const isListFetchEnabled = useMemo(() => {
    if (!enabled) return false;
    if (fetchStrategy === 'eager') return true;
    return isOpen || hasOpenedOnce;
  }, [enabled, fetchStrategy, isOpen, hasOpenedOnce]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleOpenChange = useCallback(
    (open: boolean) => {
      isOpenRef.current = open;
      setIsOpen(open);

      if (open) {
        setHasOpenedOnce(true);

        // Lazy: Commit pending parentValue on open
        if (fetchStrategy === 'lazy') {
          const pendingSerialized = serializeParentValue(
            pendingParentValueRef.current,
          );
          const committedSerialized =
            serializeParentValue(committedParentValue);

          if (pendingSerialized !== committedSerialized) {
            // Clear any pending timeout
            if (parentValueTimeoutRef.current) {
              clearTimeout(parentValueTimeoutRef.current);
              parentValueTimeoutRef.current = null;
            }
            setCommittedParentValue(pendingParentValueRef.current);
          }
        }
      }
    },
    [fetchStrategy, committedParentValue],
  );

  const handleSearch = useCallback(
    (searchValue: string) => {
      onSearchInput?.(searchValue);

      if (isSearchControlled) {
        onSearchChange?.(searchValue);
      } else {
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current);
        }
        searchTimeoutRef.current = setTimeout(() => {
          setInternalSearchText(searchValue);
          onSearchChange?.(searchValue);
        }, searchDebounceMs);
      }
    },
    [isSearchControlled, searchDebounceMs, onSearchInput, onSearchChange],
  );

  // ============================================================================
  // INFINITE QUERY
  // ============================================================================

  const queryResult = useInfiniteQuery<
    InfinitePageData<T>,
    Error,
    { pages: InfinitePageData<T>[] },
    readonly unknown[],
    number
  >({
    ...queryOptions,
    queryKey: [queryKey, 'list', committedParentValue, searchText],
    placeholderData: queryOptions.placeholderData ?? keepPreviousData,
    enabled: isListFetchEnabled,
  });

  // ============================================================================
  // DERIVED DATA
  // ============================================================================

  const itemsWithParent = useMemo(() => {
    const pages = queryResult.data?.pages ?? [];
    const result: ListDataWithParent<T>[] = [];

    for (const page of pages) {
      for (const item of page.data) {
        result.push({
          item,
          parentValue: page.fetchedWithParentValue,
        });
      }
    }

    return result;
  }, [queryResult.data?.pages]);

  const items = useMemo(() => {
    return itemsWithParent.map(({ item }) => item);
  }, [itemsWithParent]);

  // ============================================================================
  // RESET
  // ============================================================================

  const handleReset = useCallback(() => {
    if (!isSearchControlled) {
      setInternalSearchText('');
    }
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
    if (parentValueTimeoutRef.current) {
      clearTimeout(parentValueTimeoutRef.current);
      parentValueTimeoutRef.current = null;
    }
    onSearchChange?.('');
    queryResult.refetch();
  }, [isSearchControlled, onSearchChange, queryResult]);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    items,
    itemsWithParent,
    searchText,
    isLoading: queryResult.isLoading,
    isFetchingMore: queryResult.isFetchingNextPage,
    hasNextPage: queryResult.hasNextPage ?? false,
    isOpen,
    onOpenChange: handleOpenChange,
    onSearch: handleSearch,
    fetchNextPage: queryResult.fetchNextPage,
    reset: handleReset,
  };
}
