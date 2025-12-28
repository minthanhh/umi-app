/**
 * useSelectOptions - Hook for merging and transforming items to select options
 *
 * Handles:
 * - Merging list items with hydrated items
 * - Deduplication
 * - Transforming to select option format
 * - Tracking parentValue for cascade delete
 */

import { useMemo } from 'react';

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
  const { listItemsWithParent, hydratedItems, itemAccessors } = options;

  // Extract accessors with defaults
  const getId = itemAccessors?.getId ?? defaultGetId;
  const getLabel = itemAccessors?.getLabel ?? defaultGetLabel;
  const getParentValue = itemAccessors?.getParentValue;

  // ============================================================================
  // PARENT VALUE MAP
  // ============================================================================

  const parentValueMap = useMemo(() => {
    const map = new Map<string | number, unknown>();
    for (const { item, parentValue } of listItemsWithParent) {
      map.set(getId(item), parentValue);
    }
    return map;
  }, [listItemsWithParent, getId]);

  // ============================================================================
  // MERGED ITEMS (deduplicated)
  // ============================================================================

  const listItems = useMemo(() => {
    return listItemsWithParent.map(({ item }) => item);
  }, [listItemsWithParent]);

  const items = useMemo(() => {
    const allItems = [...hydratedItems, ...listItems];
    const uniqueMap = new Map<string | number, T>();

    for (const item of allItems) {
      uniqueMap.set(getId(item), item);
    }

    return Array.from(uniqueMap.values());
  }, [hydratedItems, listItems, getId]);

  // ============================================================================
  // SELECT OPTIONS
  // ============================================================================

  const selectOptions = useMemo((): InfiniteOption<T>[] => {
    return items.map((item) => {
      // Prefer custom accessor, fallback to tracked parentValue from fetch
      const itemParentValue = getParentValue
        ? getParentValue(item)
        : parentValueMap.get(getId(item));

      return {
        value: getId(item),
        label: getLabel(item),
        item,
        parentValue: itemParentValue,
      };
    });
  }, [items, getId, getLabel, getParentValue, parentValueMap]);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    items,
    options: selectOptions,
    parentValueMap,
  };
}