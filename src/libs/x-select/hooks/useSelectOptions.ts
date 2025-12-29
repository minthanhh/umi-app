/**
 * useSelectOptions - Hook for merging and transforming items to select options
 *
 * Handles:
 * - Merging list items with hydrated items
 * - Deduplication
 * - Transforming to select option format
 * - Tracking parentValue for cascade delete
 *
 * Optimizations:
 * - Single-pass merge and dedup (O(n) instead of O(2n))
 * - Reuses option objects when item hasn't changed (structural sharing)
 * - Stable parentValueMap reference when content unchanged
 */

import { useMemo, useRef } from 'react';

import type { BaseItem, InfiniteOption, ItemAccessors } from '../types';
import type { ListDataWithParent } from './useInfiniteList';

// ============================================================================
// TYPES
// ============================================================================

export interface UseSelectOptionsOptions<T extends BaseItem = BaseItem> {
  /** Items from list query (with parentValue tracking) */
  listItemsWithParent: ListDataWithParent<T>[];

  /** Items from hydration query */
  hydratedItems: T[];

  /** Item accessor functions */
  itemAccessors?: ItemAccessors<T>;

  /** Current parent value (used to clear cache when parent changes) */
  currentParentValue?: unknown;
}

export interface UseSelectOptionsResult<T extends BaseItem = BaseItem> {
  /** Merged unique items */
  items: T[];

  /** Select options with label, value, item, parentValue */
  options: InfiniteOption<T>[];

  /** Map of itemId -> parentValue (from list fetch) */
  parentValueMap: Map<string | number, unknown>;
}

// ============================================================================
// DEFAULT ACCESSORS
// ============================================================================

const defaultGetId = <T extends BaseItem>(item: T): string | number => item.id;

const defaultGetLabel = <T extends BaseItem>(item: T): string => {
  return String((item as Record<string, unknown>).name ?? item.id);
};

// ============================================================================
// HOOK
// ============================================================================

export function useSelectOptions<T extends BaseItem = BaseItem>(
  options: UseSelectOptionsOptions<T>,
): UseSelectOptionsResult<T> {
  const {
    listItemsWithParent,
    hydratedItems,
    itemAccessors,
    currentParentValue,
  } = options;

  // Extract accessors with defaults
  const getId = itemAccessors?.getId ?? defaultGetId;
  const getLabel = itemAccessors?.getLabel ?? defaultGetLabel;
  const getParentValue = itemAccessors?.getParentValue;

  // Cache for structural sharing of option objects
  const optionsCacheRef = useRef<Map<string | number, InfiniteOption<T>>>(
    new Map(),
  );
  const prevParentValueRef = useRef<unknown>(currentParentValue);
  const prevResultRef = useRef<{
    items: T[];
    options: InfiniteOption<T>[];
    parentValueMap: Map<string | number, unknown>;
  } | null>(null);

  // Clear cache when parent value changes to prevent stale options
  if (currentParentValue !== prevParentValueRef.current) {
    optionsCacheRef.current.clear();
    prevParentValueRef.current = currentParentValue;
  }

  // ============================================================================
  // SINGLE-PASS MERGE, DEDUP, AND TRANSFORM
  // ============================================================================

  const result = useMemo(() => {
    const parentValueMap = new Map<string | number, unknown>();
    const uniqueItemsMap = new Map<string | number, T>();
    const optionsCache = optionsCacheRef.current;

    // Process list items first (they have parentValue info)
    for (const { item, parentValue } of listItemsWithParent) {
      const id = getId(item);
      parentValueMap.set(id, parentValue);
      uniqueItemsMap.set(id, item);
    }

    // Add hydrated items (they take precedence for item data, but keep parentValue from list)
    for (const item of hydratedItems) {
      const id = getId(item);
      uniqueItemsMap.set(id, item);
    }

    // Build items array and options in single pass
    const items: T[] = [];
    const selectOptions: InfiniteOption<T>[] = [];

    for (const [id, item] of uniqueItemsMap) {
      items.push(item);

      // Get parentValue: prefer custom accessor, fallback to tracked value
      const itemParentValue = getParentValue
        ? getParentValue(item)
        : parentValueMap.get(id);

      const label = getLabel(item);

      // Check if we can reuse cached option (structural sharing)
      const cached = optionsCache.get(id);
      if (
        cached &&
        cached.item === item &&
        cached.label === label &&
        cached.parentValue === itemParentValue
      ) {
        selectOptions.push(cached);
      } else {
        // Create new option and cache it
        const newOption: InfiniteOption<T> = {
          value: id,
          label,
          item,
          parentValue: itemParentValue,
        };
        optionsCache.set(id, newOption);
        selectOptions.push(newOption);
      }
    }

    // Cleanup stale cache entries (when cache is 2x larger than current)
    if (optionsCache.size > uniqueItemsMap.size * 2) {
      for (const key of optionsCache.keys()) {
        if (!uniqueItemsMap.has(key)) {
          optionsCache.delete(key);
        }
      }
    }

    return { items, options: selectOptions, parentValueMap };
  }, [listItemsWithParent, hydratedItems, getId, getLabel, getParentValue]);

  // Store previous result for potential future comparison
  prevResultRef.current = result;

  return result;
}
