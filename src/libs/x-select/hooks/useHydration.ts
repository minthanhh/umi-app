/**
 * useHydration - Hook for hydrating selected values
 *
 * Handles:
 * - Fetching full data for initial selected IDs
 * - Runs ONCE on mount with initial value
 * - Independent from list query (no waiting)
 * - Results merged with list in useSelectOptions
 *
 * Optimization:
 * - Uses sorted IDs in query key for better cache hits
 * - Stable query key prevents duplicate requests for same IDs
 * - Leverages React Query's deduplication for concurrent requests
 */

import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import type { BaseItem, HydrationQueryConfig, SelectValue } from '../types';
import { DEFAULT_VALUES } from '../constants';

// ============================================================================
// TYPES
// ============================================================================

export interface UseHydrationOptions<T extends BaseItem = BaseItem> {
  /** Unique query key */
  queryKey: string;

  /** Hydration query configuration (with queryFn) */
  hydrationQuery?: HydrationQueryConfig<T>;

  /** Initial controlled value (captured once) */
  initialValue?: SelectValue;
}

export interface UseHydrationResult<T extends BaseItem = BaseItem> {
  /** Hydrated items */
  items: T[];

  /** Loading state */
  isLoading: boolean;

  /** IDs being hydrated */
  hydratingIds: Array<string | number>;
}

// ============================================================================
// HELPERS
// ============================================================================

function extractIds(value: SelectValue): Array<string | number> {
  if (value === undefined || value === null) return DEFAULT_VALUES.arr as Array<string | number>;
  if (Array.isArray(value)) {
    return value.filter((v) => v !== null && v !== undefined) as Array<string | number>;
  }
  return [value as string | number];
}

/**
 * Create a stable cache key from IDs.
 * Sorted to ensure same IDs produce same key regardless of order.
 */
function createStableIdKey(ids: Array<string | number>): string {
  if (ids.length === 0) return '';
  // Sort numerically for numbers, lexically for strings
  const sorted = [...ids].sort((a, b) => {
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    return String(a).localeCompare(String(b));
  });
  return sorted.join(',');
}

// ============================================================================
// HOOK
// ============================================================================

export function useHydration<T extends BaseItem = BaseItem>(
  options: UseHydrationOptions<T>,
): UseHydrationResult<T> {
  const { queryKey, hydrationQuery, initialValue } = options;

  // ============================================================================
  // INITIAL IDS (captured once on mount)
  // ============================================================================

  const [idsToHydrate] = useState<Array<string | number>>(() => extractIds(initialValue));
  const hasQueryFn = !!hydrationQuery?.queryFn;

  // Create stable key for better React Query cache hits
  // This allows multiple components hydrating same IDs to share the cache
  const stableIdKey = useMemo(() => createStableIdKey(idsToHydrate), [idsToHydrate]);

  // ============================================================================
  // HYDRATION QUERY (runs once, independent from list)
  // React Query automatically deduplicates concurrent requests with same key
  // ============================================================================

  const queryResult = useQuery<T[], Error, T[], readonly unknown[]>({
    staleTime: hydrationQuery?.staleTime ?? Infinity,
    // Use gcTime to keep hydrated data in cache longer
    gcTime: hydrationQuery?.gcTime ?? 1000 * 60 * 30, // 30 minutes default
    ...hydrationQuery,
    queryFn: hasQueryFn
      ? (context) => hydrationQuery.queryFn(context, idsToHydrate)
      : undefined,
    // Use stable key to maximize cache hits
    queryKey: [queryKey, 'hydrate', stableIdKey],
    enabled: idsToHydrate.length > 0 && hasQueryFn,
  });

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    items: queryResult.data ?? (DEFAULT_VALUES.arr as T[]),
    isLoading: queryResult.isLoading,
    hydratingIds: idsToHydrate,
  };
}
