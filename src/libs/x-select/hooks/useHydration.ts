/**
 * useHydration - Hook for hydrating selected values
 *
 * Handles:
 * - Fetching full data for initial selected IDs
 * - Runs ONCE on mount with initial value
 * - Independent from list query (no waiting)
 * - Results merged with list in useSelectOptions
 */

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

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
  if (value === undefined || value === null) return DEFAULT_VALUES.arr;
  if (Array.isArray(value)) {
    return value.filter((v) => v !== null && v !== undefined) as Array<string | number>;
  }
  return [value as string | number];
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

  // ============================================================================
  // HYDRATION QUERY (runs once, independent from list)
  // ============================================================================

  const queryResult = useQuery<T[], Error, T[], readonly unknown[]>({
    staleTime: hydrationQuery?.staleTime ?? Infinity,
    ...hydrationQuery,
    queryFn: hasQueryFn 
      ? (context) => hydrationQuery.queryFn(context, idsToHydrate) 
      : undefined,
    queryKey: [queryKey, 'hydrate', idsToHydrate],
    enabled: idsToHydrate.length > 0 && hasQueryFn,
  });

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    items: queryResult.data ?? DEFAULT_VALUES.arr,
    isLoading: queryResult.isLoading,
    hydratingIds: idsToHydrate,
  };
}
