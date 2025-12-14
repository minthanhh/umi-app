/**
 * DependentSelect - Utility Functions (Optimized)
 *
 * Pure functions for:
 * - Building relationship maps between fields
 * - Filtering options by parent value
 * - Cascade delete logic
 *
 * Optimizations applied:
 * - WeakMap memoization for object-based inputs
 * - Map-based caching with composite keys
 * - Index-based BFS traversal (avoids array.shift())
 * - Pre-built lookup maps for O(1) access
 * - TypeScript generics for better type inference
 *
 * All functions are pure (no side effects) and can be tested independently.
 */

import type {
  DependentFieldConfig,
  DependentFieldRelationship,
  DependentRelationshipMap,
  FormattedSelectOption,
  SelectOption,
} from './types';

// ============================================================================
// MEMOIZATION UTILITIES
// ============================================================================

/**
 * Creates a memoized version of a function using WeakMap.
 * Only works with object-based arguments (arrays, objects).
 * Automatically garbage collected when the key object is no longer referenced.
 *
 * @param fn - Function to memoize
 * @returns Memoized function
 */
function memoizeWeak<TArg extends object, TResult>(
  fn: (arg: TArg) => TResult,
): (arg: TArg) => TResult {
  const cache = new WeakMap<TArg, TResult>();

  return (arg: TArg): TResult => {
    if (cache.has(arg)) {
      return cache.get(arg)!;
    }

    const result = fn(arg);
    cache.set(arg, result);
    return result;
  };
}

/**
 * Creates a memoized version with two arguments.
 * First argument must be object (for WeakMap), second can be any type.
 * Uses nested Map for composite key caching.
 *
 * @param fn - Function to memoize
 * @param getSecondKey - Optional function to compute cache key for second arg
 * @returns Memoized function
 */
function memoizeWeakWithArg<TArg2, TResult>(
  fn: (arg1: SelectOption[], arg2: TArg2) => TResult,
  getSecondKey?: (arg: TArg2) => string,
): (arg1: SelectOption[], arg2: TArg2) => TResult {
  const cache = new WeakMap<SelectOption[], Map<string, TResult>>();

  const computeKey = getSecondKey ?? ((arg: TArg2) => String(arg));

  return (arg1: SelectOption[], arg2: TArg2): TResult => {
    let innerCache = cache.get(arg1);

    if (!innerCache) {
      innerCache = new Map<string, TResult>();
      cache.set(arg1, innerCache);
    }

    const key = computeKey(arg2);

    if (innerCache.has(key)) {
      return innerCache.get(key)!;
    }

    const result = fn(arg1, arg2);
    innerCache.set(key, result);
    return result;
  };
}

// ============================================================================
// TYPES - Enhanced with Generics
// ============================================================================

/**
 * Generic option type that extends base SelectOption.
 * Allows custom properties while maintaining type safety.
 */
export type GenericSelectOption<
  TValue extends string | number = string | number,
  TParent extends string | number = string | number,
> = SelectOption & {
  value: TValue;
  parentValue?: TParent | TParent[];
};

/**
 * Type for parent value - can be single or array.
 */
export type ParentValue<T extends string | number = string | number> =
  | T
  | T[]
  | null
  | undefined;

// ============================================================================
// RELATIONSHIP MAPPING - Build parent-child relationships
// ============================================================================

/**
 * Internal implementation of buildRelationshipMap.
 * Separated from memoization wrapper for clarity.
 */
function buildRelationshipMapInternal(
  configs: DependentFieldConfig[],
): DependentRelationshipMap {
  const relationshipMap = new Map<string, DependentFieldRelationship>();

  // Single pass: Initialize and populate children in one loop
  // First, create all entries
  for (let i = 0; i < configs.length; i++) {
    const config = configs[i];
    relationshipMap.set(config.name, {
      parent: config.dependsOn ?? null,
      children: [],
    });
  }

  // Second pass: Populate children (can't combine due to forward references)
  for (let i = 0; i < configs.length; i++) {
    const config = configs[i];
    if (config.dependsOn) {
      const parentRelationship = relationshipMap.get(config.dependsOn);
      if (parentRelationship) {
        parentRelationship.children.push(config.name);
      }
    }
  }

  return relationshipMap;
}

/**
 * Build a map of parent-child relationships from field configs.
 * Used for cascade operations (delete, reload).
 *
 * **Optimization**: Memoized with WeakMap - same config array returns cached result.
 *
 * @param configs - Array of field configurations
 * @returns Map with field name as key and relationship info as value
 *
 * @example
 * ```ts
 * const configs = [
 *   { name: 'country' },
 *   { name: 'province', dependsOn: 'country' },
 *   { name: 'city', dependsOn: 'province' },
 * ];
 *
 * const map = buildRelationshipMap(configs);
 * // Result:
 * // Map {
 * //   'country'  => { parent: null, children: ['province'] },
 * //   'province' => { parent: 'country', children: ['city'] },
 * //   'city'     => { parent: 'province', children: [] }
 * // }
 *
 * // Second call with same array returns cached result (O(1))
 * const map2 = buildRelationshipMap(configs); // Same reference returned
 * ```
 */
export const buildRelationshipMap = memoizeWeak(buildRelationshipMapInternal);

// ============================================================================
// DESCENDANTS TRAVERSAL - Optimized BFS
// ============================================================================

/**
 * Get all descendant field names (children, grandchildren, etc.).
 * Uses optimized index-based BFS traversal.
 *
 * **Optimization**:
 * - Uses index pointer instead of array.shift() (O(1) vs O(n))
 * - Pre-checks children existence to avoid unnecessary operations
 * - Early exit if relationship map is empty
 *
 * @param fieldName - Starting field name
 * @param relationshipMap - Map of field relationships
 * @returns Array of descendant field names in BFS order
 *
 * @example
 * ```ts
 * // If country -> province -> city -> ward
 * getDescendants('country', map);
 * // Returns: ['province', 'city', 'ward']
 * ```
 */
export function getDescendants(
  fieldName: string,
  relationshipMap: DependentRelationshipMap,
): string[] {
  // Early exit for empty map
  if (relationshipMap.size === 0) return [];

  const startRelation = relationshipMap.get(fieldName);
  if (!startRelation || startRelation.children.length === 0) return [];

  const descendants: string[] = [];
  const queue: string[] = [fieldName];

  // Index-based traversal - avoids O(n) shift() operation
  let queueIndex = 0;

  while (queueIndex < queue.length) {
    const currentField = queue[queueIndex++];
    const relationship = relationshipMap.get(currentField);

    if (relationship && relationship.children.length > 0) {
      const children = relationship.children;
      // Use for loop instead of spread for performance
      for (let i = 0; i < children.length; i++) {
        const childName = children[i];
        descendants.push(childName);
        queue.push(childName);
      }
    }
  }

  return descendants;
}

/**
 * Get all descendant field names with pre-built cache.
 * Use this when you need to call getDescendants multiple times with the same map.
 *
 * @param relationshipMap - Map of field relationships
 * @returns Function that returns descendants for any field name (cached)
 *
 * @example
 * ```ts
 * const getDesc = createDescendantsGetter(relationshipMap);
 *
 * // First call computes and caches
 * const countryDescendants = getDesc('country');
 *
 * // Subsequent calls return cached result
 * const countryDescendants2 = getDesc('country'); // O(1)
 * ```
 */
export function createDescendantsGetter(
  relationshipMap: DependentRelationshipMap,
): (fieldName: string) => string[] {
  const cache = new Map<string, string[]>();

  return (fieldName: string): string[] => {
    const cached = cache.get(fieldName);
    if (cached) return cached;

    const result = getDescendants(fieldName, relationshipMap);
    cache.set(fieldName, result);
    return result;
  };
}

// ============================================================================
// OPTIONS FILTERING - Filter options based on parent value
// ============================================================================

/**
 * Compute cache key for parent value.
 * Handles arrays by sorting and joining (order-independent matching).
 */
function computeParentValueKey(parentValue: unknown): string {
  if (parentValue === undefined) return '__undefined__';
  if (parentValue === null) return '__null__';
  if (Array.isArray(parentValue)) {
    // Sort for consistent key regardless of order
    return `__arr__${[...parentValue].sort().join('|')}`;
  }
  return String(parentValue);
}

/**
 * Internal implementation of filterOptionsByParent.
 */
function filterOptionsByParentInternal<
  T extends SelectOption = SelectOption,
>(options: T[], parentValue: unknown): T[] {
  // No parent value = no options
  if (parentValue === undefined || parentValue === null) {
    return [];
  }

  // Pre-compute parent value set for O(1) lookups
  const parentValueSet = Array.isArray(parentValue)
    ? new Set(parentValue)
    : null;
  const singleParentValue = Array.isArray(parentValue) ? null : parentValue;

  // Parent is array (multiple select)
  if (parentValueSet) {
    if (parentValueSet.size === 0) return [];

    return options.filter((option) => {
      const optionParentValue = option.parentValue;

      // Option belongs to multiple parents
      if (Array.isArray(optionParentValue)) {
        return optionParentValue.some((pv) => parentValueSet.has(pv));
      }

      // Option belongs to single parent
      return parentValueSet.has(optionParentValue);
    });
  }

  // Parent is single value
  return options.filter((option) => {
    const optionParentValue = option.parentValue;

    // Option belongs to multiple parents
    if (Array.isArray(optionParentValue)) {
      return optionParentValue.includes(singleParentValue as string | number);
    }

    // Option belongs to single parent
    return optionParentValue === singleParentValue;
  });
}

/**
 * Default filter function - filter options by parentValue.
 * Handles both single and multiple parent values.
 *
 * **Optimization**: Memoized per options array with composite key caching.
 * Uses Set for O(1) parent value lookups.
 *
 * @param options - Array of options to filter
 * @param parentValue - Value of the parent field (single or array)
 * @returns Filtered options that match the parent value
 *
 * @example Single parent value
 * ```ts
 * const options = [
 *   { label: 'HCM', value: 'HCM', parentValue: 'VN' },
 *   { label: 'CA', value: 'CA', parentValue: 'US' },
 * ];
 * filterOptionsByParent(options, 'VN');
 * // Returns: [{ label: 'HCM', value: 'HCM', parentValue: 'VN' }]
 * ```
 *
 * @example Multiple parent values (multi-select parent)
 * ```ts
 * filterOptionsByParent(options, ['VN', 'US']);
 * // Returns: all options matching either 'VN' or 'US'
 *
 * // Cached: same options array + same parent value returns cached result
 * filterOptionsByParent(options, ['VN', 'US']); // O(1) cache hit
 * ```
 */
export const filterOptionsByParent = memoizeWeakWithArg(
  filterOptionsByParentInternal,
  computeParentValueKey,
);

/**
 * Create an optimized filter function for a specific options array.
 * Pre-builds index maps for O(1) lookups.
 *
 * Use this when filtering the same options multiple times with different parent values.
 *
 * @param options - Array of options to filter
 * @returns Optimized filter function
 *
 * @example
 * ```ts
 * const filterProvinces = createOptionsFilter(provinceOptions);
 *
 * // Each call is O(n) but with pre-built indexes
 * const vnProvinces = filterProvinces('VN');
 * const usProvinces = filterProvinces('US');
 * ```
 */
export function createOptionsFilter<T extends SelectOption = SelectOption>(
  options: T[],
): (parentValue: unknown) => T[] {
  // Pre-build index: parentValue -> array of options
  const parentIndex = new Map<string | number, T[]>();
  const multiParentOptions: Array<{ option: T; parents: Set<string | number> }> = [];

  for (const option of options) {
    const optionParentValue = option.parentValue;

    if (Array.isArray(optionParentValue)) {
      // Option belongs to multiple parents
      multiParentOptions.push({
        option,
        parents: new Set(optionParentValue as (string | number)[]),
      });
      // Also index under each parent
      for (const pv of optionParentValue) {
        const existing = parentIndex.get(pv as string | number) ?? [];
        existing.push(option);
        parentIndex.set(pv as string | number, existing);
      }
    } else if (optionParentValue !== undefined && optionParentValue !== null) {
      // Single parent
      const key = optionParentValue as string | number;
      const existing = parentIndex.get(key) ?? [];
      existing.push(option);
      parentIndex.set(key, existing);
    }
  }

  // Return filter function
  return (parentValue: unknown): T[] => {
    if (parentValue === undefined || parentValue === null) {
      return [];
    }

    if (Array.isArray(parentValue)) {
      if (parentValue.length === 0) return [];

      const parentSet = new Set(parentValue);
      const resultSet = new Set<T>();

      // Get options for each parent value
      for (const pv of parentValue) {
        const indexed = parentIndex.get(pv as string | number);
        if (indexed) {
          for (const opt of indexed) {
            resultSet.add(opt);
          }
        }
      }

      // For multi-parent options, check if any parent is selected
      for (const { option, parents } of multiParentOptions) {
        for (const p of parents) {
          if (parentSet.has(p)) {
            resultSet.add(option);
            break;
          }
        }
      }

      return Array.from(resultSet);
    }

    // Single parent value - direct lookup
    return parentIndex.get(parentValue as string | number) ?? [];
  };
}

// ============================================================================
// CASCADE DELETE - Remove orphaned child values
// ============================================================================

/**
 * Calculate which parent values were removed (for cascade delete).
 *
 * **Optimization**: Uses Set for O(1) lookups when arrays are large.
 *
 * @param oldValue - Previous value (single or array)
 * @param newValue - New value (single or array)
 * @returns Array of values that were removed
 *
 * @example
 * ```ts
 * getRemovedValues(['A', 'B', 'C'], ['A', 'C']);
 * // Returns: ['B']
 *
 * getRemovedValues('A', undefined);
 * // Returns: ['A']
 * ```
 */
export function getRemovedValues<T extends string | number = string | number>(
  oldValue: T | T[] | null | undefined,
  newValue: T | T[] | null | undefined,
): T[] {
  // Normalize to arrays
  const oldArray: T[] = Array.isArray(oldValue)
    ? oldValue
    : oldValue !== null && oldValue !== undefined
      ? [oldValue]
      : [];

  const newArray: T[] = Array.isArray(newValue)
    ? newValue
    : newValue !== null && newValue !== undefined
      ? [newValue]
      : [];

  // Early exit for common cases
  if (oldArray.length === 0) return [];
  if (newArray.length === 0) return oldArray;

  // Use Set for O(1) lookups when arrays are large enough
  if (newArray.length > 3) {
    const newSet = new Set(newArray);
    return oldArray.filter((value) => !newSet.has(value));
  }

  // For small arrays, direct includes is faster (no Set overhead)
  return oldArray.filter((value) => !newArray.includes(value));
}

/**
 * Build a lookup map from options for O(1) value-to-option access.
 * Used internally by cascadeDelete.
 */
function buildOptionsLookup<T extends SelectOption>(
  options: T[],
): Map<string | number, T> {
  const map = new Map<string | number, T>();
  for (const option of options) {
    map.set(option.value, option);
  }
  return map;
}

/**
 * Memoized options lookup builder.
 */
const getOptionsLookup = memoizeWeak(buildOptionsLookup);

/**
 * Cascade delete: remove child values that no longer have a valid parent.
 *
 * When a parent value is removed, any child values that depended on that parent
 * (and have no other selected parent) should also be removed.
 *
 * **Optimizations**:
 * - Pre-built option lookup map for O(1) access
 * - Set-based parent value matching
 * - Memoized lookup map per options array
 *
 * IMPORTANT: For options with multiple parents (parentValue is array),
 * the option is KEPT only if at least one of its parents is still selected.
 *
 * @param currentValue - Current child field value (single or array)
 * @param remainingParentValues - Parent values that are STILL SELECTED after removal
 * @param options - All options for the child field (to check parentValue)
 * @returns New value with orphaned items removed
 *
 * @example Single parent per option
 * ```ts
 * // User deselected province 'HCM', cascade delete cities in 'HCM'
 * const currentCities = ['D1', 'D7', 'HK']; // D1, D7 belong to HCM; HK belongs to HN
 * const remainingProvinces = ['HN']; // Only HN is still selected
 * const cityOptions = [
 *   { value: 'D1', parentValue: 'HCM' },
 *   { value: 'D7', parentValue: 'HCM' },
 *   { value: 'HK', parentValue: 'HN' },
 * ];
 *
 * cascadeDelete(currentCities, remainingProvinces, cityOptions);
 * // Returns: ['HK'] (D1 and D7 were removed because HCM is no longer selected)
 * ```
 *
 * @example Multiple parents per option
 * ```ts
 * // Project belongs to multiple users (members)
 * const selectedProjects = ['P1', 'P2'];
 * const remainingUsers = [1]; // User 2 was removed, only user 1 remains
 * const projectOptions = [
 *   { value: 'P1', parentValue: [1, 2] },    // belongs to both users
 *   { value: 'P2', parentValue: [2] },       // belongs only to user 2
 * ];
 *
 * cascadeDelete(selectedProjects, remainingUsers, projectOptions);
 * // Returns: ['P1'] (P1 kept because user 1 still selected; P2 removed)
 * ```
 */
export function cascadeDelete<
  TValue extends string | number = string | number,
  TParent extends string | number = string | number,
>(
  currentValue: TValue | TValue[] | null | undefined,
  remainingParentValues: TParent[],
  options: SelectOption[],
): TValue | TValue[] | undefined {
  // Nothing to cascade if no current value
  if (currentValue === null || currentValue === undefined) return undefined;

  // Build lookup map (memoized per options array)
  const optionsLookup = getOptionsLookup(options);

  // Convert remaining parent values to Set for O(1) lookups
  const remainingSet = new Set<TParent>(remainingParentValues);

  /**
   * Check if an option should be removed based on its parent value.
   * Option is removed if NONE of its parents are still selected.
   */
  const shouldRemoveOption = (optionValue: TValue): boolean => {
    const option = optionsLookup.get(optionValue);
    if (!option) return false;

    const optionParentValue = option.parentValue;

    // No parent value defined - never remove
    if (optionParentValue === undefined || optionParentValue === null) {
      return false;
    }

    // Option has multiple parents - keep if ANY parent is still selected
    if (Array.isArray(optionParentValue)) {
      // Empty array means no parent info - treat as "keep" (don't remove)
      if (optionParentValue.length === 0) {
        return false;
      }
      for (const parentVal of optionParentValue) {
        if (remainingSet.has(parentVal as TParent)) {
          return false; // Found a selected parent, keep the option
        }
      }
      return true; // No selected parent found, remove
    }

    // Option has single parent - remove if that parent is no longer selected
    return !remainingSet.has(optionParentValue as TParent);
  };

  // Single select - return undefined if removed
  if (!Array.isArray(currentValue)) {
    return shouldRemoveOption(currentValue) ? undefined : currentValue;
  }

  // Multiple select - filter out removed values
  return currentValue.filter((value) => !shouldRemoveOption(value));
}

/**
 * Create an optimized cascade delete function for specific options.
 * Pre-builds all lookups for maximum performance.
 *
 * Use this when performing cascade delete multiple times with the same options.
 *
 * @param options - All options for the child field
 * @returns Optimized cascade delete function
 *
 * @example
 * ```ts
 * const cascadeCities = createCascadeDelete(cityOptions);
 *
 * // Fast cascade delete
 * const result = cascadeCities(['D1', 'D7', 'HK'], ['HN']);
 * ```
 */
export function createCascadeDelete<
  TValue extends string | number = string | number,
  TParent extends string | number = string | number,
>(
  options: SelectOption[],
): (
  currentValue: TValue | TValue[] | null | undefined,
  remainingParentValues: TParent[],
) => TValue | TValue[] | undefined {
  // Pre-build lookup map
  const optionsLookup = new Map<TValue, SelectOption>();
  for (const option of options) {
    optionsLookup.set(option.value as TValue, option);
  }

  return (currentValue, remainingParentValues) => {
    if (currentValue === null || currentValue === undefined) return undefined;

    const remainingSet = new Set<TParent>(remainingParentValues);

    const shouldRemoveOption = (optionValue: TValue): boolean => {
      const option = optionsLookup.get(optionValue);
      if (!option) return false;

      const optionParentValue = option.parentValue;

      if (optionParentValue === undefined || optionParentValue === null) {
        return false;
      }

      if (Array.isArray(optionParentValue)) {
        // Empty array means no parent info - treat as "keep" (don't remove)
        if (optionParentValue.length === 0) {
          return false;
        }
        for (const parentVal of optionParentValue) {
          if (remainingSet.has(parentVal as TParent)) {
            return false;
          }
        }
        return true;
      }

      return !remainingSet.has(optionParentValue as TParent);
    };

    if (!Array.isArray(currentValue)) {
      return shouldRemoveOption(currentValue) ? undefined : currentValue;
    }

    return currentValue.filter((value) => !shouldRemoveOption(value));
  };
}

// ============================================================================
// OPTIONS FORMATTING - Format options for Ant Design Select
// ============================================================================

/**
 * Internal implementation of formatOptionsForSelect.
 */
function formatOptionsForSelectInternal<T extends SelectOption>(
  options: T[],
): FormattedSelectOption[] {
  // Pre-allocate result array for better performance
  const result = new Array<FormattedSelectOption>(options.length);

  for (let i = 0; i < options.length; i++) {
    const option = options[i];
    result[i] = {
      label: option.label,
      value: option.value,
      disabled: option.disabled,
    };
  }

  return result;
}

/**
 * Format SelectOption array for Ant Design Select component.
 * Strips out parentValue and other custom properties.
 *
 * **Optimization**: Memoized with WeakMap - same options array returns cached result.
 *
 * @param options - Array of SelectOption
 * @returns Array formatted for Ant Design Select
 *
 * @example
 * ```ts
 * const options = [
 *   { label: 'Vietnam', value: 'VN', parentValue: undefined, customData: {} },
 *   { label: 'USA', value: 'US', disabled: true },
 * ];
 *
 * formatOptionsForSelect(options);
 * // Returns: [
 * //   { label: 'Vietnam', value: 'VN' },
 * //   { label: 'USA', value: 'US', disabled: true },
 * // ]
 *
 * // Cached: same options array returns cached result
 * formatOptionsForSelect(options); // O(1) cache hit
 * ```
 */
export const formatOptionsForSelect = memoizeWeak(formatOptionsForSelectInternal);

// ============================================================================
// VALUE COMPARISON - Compare values for equality
// ============================================================================

/**
 * Check if two values are equal (handles arrays).
 * Used to avoid unnecessary updates when value hasn't changed.
 *
 * **Optimization**: Early exits and length check before iteration.
 *
 * @param valueA - First value
 * @param valueB - Second value
 * @returns true if values are equal
 *
 * @example
 * ```ts
 * areValuesEqual('A', 'A');           // true
 * areValuesEqual(['A', 'B'], ['A', 'B']); // true
 * areValuesEqual(['A', 'B'], ['B', 'A']); // false (order matters)
 * ```
 */
export function areValuesEqual<T = unknown>(valueA: T, valueB: T): boolean {
  // Same reference - fastest check
  if (valueA === valueB) return true;

  // Type check - if one is array and other isn't, they're not equal
  const aIsArray = Array.isArray(valueA);
  const bIsArray = Array.isArray(valueB);

  if (aIsArray !== bIsArray) return false;

  // Both are arrays - compare element by element
  if (aIsArray && bIsArray) {
    const arrA = valueA as unknown[];
    const arrB = valueB as unknown[];

    // Length check first
    if (arrA.length !== arrB.length) return false;

    // Element-by-element comparison
    for (let i = 0; i < arrA.length; i++) {
      if (arrA[i] !== arrB[i]) return false;
    }

    return true;
  }

  // Different values (primitives or objects)
  return false;
}

/**
 * Check if two arrays are equal regardless of order.
 * Useful when order doesn't matter (e.g., multi-select values).
 *
 * @param arrA - First array
 * @param arrB - Second array
 * @returns true if arrays contain the same elements
 *
 * @example
 * ```ts
 * areArraysEqualUnordered(['A', 'B'], ['B', 'A']); // true
 * areArraysEqualUnordered(['A', 'B'], ['A', 'B', 'C']); // false
 * ```
 */
export function areArraysEqualUnordered<T extends string | number>(
  arrA: T[],
  arrB: T[],
): boolean {
  if (arrA.length !== arrB.length) return false;
  if (arrA === arrB) return true;

  const setA = new Set(arrA);
  return arrB.every((item) => setA.has(item));
}

// ============================================================================
// UTILITY HELPERS
// ============================================================================

/**
 * Normalize any value to array.
 * Useful for handling both single and multiple select values uniformly.
 *
 * @param value - Value to normalize
 * @returns Array representation of the value
 *
 * @example
 * ```ts
 * normalizeToArray('A');           // ['A']
 * normalizeToArray(['A', 'B']);    // ['A', 'B']
 * normalizeToArray(undefined);     // []
 * normalizeToArray(null);          // []
 * ```
 */
export function normalizeToArray<T>(value: T | T[] | null | undefined): T[] {
  if (Array.isArray(value)) return value;
  if (value !== null && value !== undefined) return [value];
  return [];
}

/**
 * Check if a value is empty (undefined, null, or empty array).
 *
 * @param value - Value to check
 * @returns true if value is empty
 */
export function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

// ============================================================================
// CACHE UTILITIES (for external use)
// ============================================================================

/**
 * Clear all internal caches.
 * Call this if you need to free memory or reset state.
 *
 * Note: WeakMap caches are automatically garbage collected,
 * but this function can be used in testing scenarios.
 */
export function clearCaches(): void {
  // WeakMaps are automatically garbage collected when keys are no longer referenced.
  // This function is provided for API completeness and potential future use.
  // Currently a no-op since we use WeakMap which handles its own cleanup.
}
