/**
 * XSelect - Utility Functions
 *
 * Pure functions for:
 * - Building relationship maps
 * - Filtering options by parent value
 * - Cascade delete logic
 * - Value comparison
 *
 * All functions are framework-agnostic and can be tested independently.
 */

import type {
  FieldConfig,
  FieldRelationship,
  RelationshipMap,
  XSelectOption,
  FormattedOption,
} from '../types';

// ============================================================================
// MEMOIZATION UTILITIES
// ============================================================================

/**
 * Creates a memoized function using WeakMap.
 * Only works with object arguments.
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
 * Creates a memoized function with two arguments.
 */
function memoizeWeakWithArg<TArg2, TResult>(
  fn: (arg1: XSelectOption[], arg2: TArg2) => TResult,
  getSecondKey?: (arg: TArg2) => string,
): (arg1: XSelectOption[], arg2: TArg2) => TResult {
  const cache = new WeakMap<XSelectOption[], Map<string, TResult>>();
  const computeKey = getSecondKey ?? ((arg: TArg2) => String(arg));

  return (arg1: XSelectOption[], arg2: TArg2): TResult => {
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
// DEPENDENCY NORMALIZATION
// ============================================================================

/**
 * Normalize dependsOn to array format.
 *
 * @example
 * ```ts
 * normalizeDependsOn('country');           // ['country']
 * normalizeDependsOn(['country', 'state']); // ['country', 'state']
 * normalizeDependsOn(undefined);           // []
 * ```
 */
export function normalizeDependsOn(dependsOn: string | string[] | undefined): string[] {
  if (!dependsOn) return [];
  return Array.isArray(dependsOn) ? dependsOn : [dependsOn];
}

// ============================================================================
// RELATIONSHIP MAPPING
// ============================================================================

/**
 * Internal implementation of buildRelationshipMap.
 */
function buildRelationshipMapInternal(configs: FieldConfig[]): RelationshipMap {
  const relationshipMap = new Map<string, FieldRelationship>();
  const childrenSets = new Map<string, Set<string>>();

  // Pass 1: Initialize all entries
  for (let i = 0; i < configs.length; i++) {
    const config = configs[i];
    childrenSets.set(config.name, new Set());
  }

  // Pass 2: Populate children
  for (let i = 0; i < configs.length; i++) {
    const config = configs[i];
    if (config.dependsOn) {
      const parentNames = normalizeDependsOn(config.dependsOn);
      for (let j = 0; j < parentNames.length; j++) {
        const parentName = parentNames[j];
        const childrenSet = childrenSets.get(parentName);
        if (childrenSet) {
          childrenSet.add(config.name);
        }
      }
    }
  }

  // Pass 3: Build final map
  for (let i = 0; i < configs.length; i++) {
    const config = configs[i];
    const childrenSet = childrenSets.get(config.name)!;
    relationshipMap.set(config.name, {
      parent: config.dependsOn ?? null,
      children: childrenSet.size > 0 ? Array.from(childrenSet) : [],
    });
  }

  return relationshipMap;
}

/**
 * Build parent-child relationship map from field configs.
 * Memoized - same config array returns cached result.
 */
export const buildRelationshipMap = memoizeWeak(buildRelationshipMapInternal);

// ============================================================================
// DESCENDANTS TRAVERSAL
// ============================================================================

/**
 * Get all descendant field names (BFS traversal).
 *
 * @example
 * ```ts
 * // If country -> province -> city -> ward
 * getDescendants('country', map); // ['province', 'city', 'ward']
 * ```
 */
export function getDescendants(
  fieldName: string,
  relationshipMap: RelationshipMap,
): string[] {
  if (relationshipMap.size === 0) return [];

  const startRelation = relationshipMap.get(fieldName);
  if (!startRelation || startRelation.children.length === 0) return [];

  const descendants: string[] = [];
  const queue: string[] = [fieldName];
  let queueIndex = 0;

  while (queueIndex < queue.length) {
    const currentField = queue[queueIndex++];
    const relationship = relationshipMap.get(currentField);

    if (relationship && relationship.children.length > 0) {
      const children = relationship.children;
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
 * Create cached descendants getter.
 */
export function createDescendantsGetter(
  relationshipMap: RelationshipMap,
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
// OPTIONS FILTERING
// ============================================================================

/**
 * Compute cache key for parent value.
 */
function computeParentValueKey(parentValue: unknown): string {
  if (parentValue === undefined) return '__undefined__';
  if (parentValue === null) return '__null__';
  if (Array.isArray(parentValue)) {
    return `__arr__${[...parentValue].sort().join('|')}`;
  }
  return String(parentValue);
}

/**
 * Internal filter implementation.
 */
function filterOptionsByParentInternal<T extends XSelectOption = XSelectOption>(
  options: T[],
  parentValue: unknown,
): T[] {
  if (parentValue === undefined || parentValue === null) {
    return [];
  }

  const parentValueSet = Array.isArray(parentValue)
    ? new Set(parentValue)
    : null;
  const singleParentValue = Array.isArray(parentValue) ? null : parentValue;

  // Parent is array
  if (parentValueSet) {
    if (parentValueSet.size === 0) return [];

    return options.filter((option) => {
      const optionParentValue = option.parentValue;

      if (Array.isArray(optionParentValue)) {
        return optionParentValue.some((pv) => parentValueSet.has(pv));
      }

      return parentValueSet.has(optionParentValue);
    });
  }

  // Parent is single value
  return options.filter((option) => {
    const optionParentValue = option.parentValue;

    if (Array.isArray(optionParentValue)) {
      return optionParentValue.includes(singleParentValue as string | number);
    }

    return optionParentValue === singleParentValue;
  });
}

/**
 * Filter options by parent value.
 * Memoized per options array.
 */
export const filterOptionsByParent = memoizeWeakWithArg(
  filterOptionsByParentInternal,
  computeParentValueKey,
);

/**
 * Create optimized filter function for specific options.
 */
export function createOptionsFilter<T extends XSelectOption = XSelectOption>(
  options: T[],
): (parentValue: unknown) => T[] {
  const parentIndex = new Map<string | number, T[]>();
  const multiParentOptions: Array<{ option: T; parents: Set<string | number> }> = [];

  for (const option of options) {
    const optionParentValue = option.parentValue;

    if (Array.isArray(optionParentValue)) {
      multiParentOptions.push({
        option,
        parents: new Set(optionParentValue as (string | number)[]),
      });
      for (const pv of optionParentValue) {
        const existing = parentIndex.get(pv as string | number) ?? [];
        existing.push(option);
        parentIndex.set(pv as string | number, existing);
      }
    } else if (optionParentValue !== undefined && optionParentValue !== null) {
      const key = optionParentValue as string | number;
      const existing = parentIndex.get(key) ?? [];
      existing.push(option);
      parentIndex.set(key, existing);
    }
  }

  return (parentValue: unknown): T[] => {
    if (parentValue === undefined || parentValue === null) {
      return [];
    }

    if (Array.isArray(parentValue)) {
      if (parentValue.length === 0) return [];

      const parentSet = new Set(parentValue);
      const resultSet = new Set<T>();

      for (const pv of parentValue) {
        const indexed = parentIndex.get(pv as string | number);
        if (indexed) {
          for (const opt of indexed) {
            resultSet.add(opt);
          }
        }
      }

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

    return parentIndex.get(parentValue as string | number) ?? [];
  };
}

// ============================================================================
// CASCADE DELETE
// ============================================================================

/**
 * Get removed values between old and new.
 */
export function getRemovedValues<T extends string | number = string | number>(
  oldValue: T | T[] | null | undefined,
  newValue: T | T[] | null | undefined,
): T[] {
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

  if (oldArray.length === 0) return [];
  if (newArray.length === 0) return oldArray;

  if (newArray.length > 3) {
    const newSet = new Set(newArray);
    return oldArray.filter((value) => !newSet.has(value));
  }

  return oldArray.filter((value) => !newArray.includes(value));
}

/**
 * Check if option's parentValue is valid for multi-parent dependencies.
 *
 * When parentValue is an object like { userIds: [1], taskIds: [5] },
 * we check if ALL parent fields have at least one matching value in remainingParentValuesMap.
 *
 * @example
 * ```ts
 * const optionParentValue = { userIds: [1], taskIds: [5] };
 * const remainingMap = { userIds: new Set([1, 2]), taskIds: new Set([5, 10]) };
 * isMultiParentValid(optionParentValue, remainingMap); // true - user 1 exists AND task 5 exists
 *
 * const remainingMap2 = { userIds: new Set([2, 3]), taskIds: new Set([5, 10]) };
 * isMultiParentValid(optionParentValue, remainingMap2); // false - user 1 NOT in [2, 3]
 * ```
 */
function isMultiParentValid(
  optionParentValue: Record<string, unknown>,
  remainingParentValuesMap: Record<string, Set<string | number>>,
): boolean {
  for (const [fieldName, optionValues] of Object.entries(optionParentValue)) {
    const remainingSet = remainingParentValuesMap[fieldName];

    // If this parent field has no remaining values, option is invalid
    if (!remainingSet || remainingSet.size === 0) {
      return false;
    }

    // Normalize optionValues to array
    const optionValuesArray = Array.isArray(optionValues)
      ? optionValues
      : [optionValues];

    // Check if at least one option value exists in remaining set
    const hasMatch = optionValuesArray.some((v) => remainingSet.has(v as string | number));

    if (!hasMatch) {
      return false;
    }
  }

  return true;
}

/**
 * Build options lookup map.
 */
function buildOptionsLookup<T extends XSelectOption>(
  options: T[],
): Map<string | number, T> {
  const map = new Map<string | number, T>();
  for (const option of options) {
    map.set(option.value, option);
  }
  return map;
}

const getOptionsLookup = memoizeWeak(buildOptionsLookup);

/**
 * Cascade delete: remove child values without valid parent.
 *
 * @example
 * ```ts
 * const currentCities = ['D1', 'D7', 'HK'];
 * const remainingProvinces = ['HN'];
 * cascadeDelete(currentCities, remainingProvinces, cityOptions);
 * // Returns: ['HK'] (D1, D7 removed because HCM is no longer selected)
 * ```
 */
export function cascadeDelete<
  TValue extends string | number = string | number,
  TParent extends string | number = string | number,
>(
  currentValue: TValue | TValue[] | null | undefined,
  remainingParentValues: TParent[],
  options: XSelectOption[],
): TValue | TValue[] | undefined {
  if (currentValue === null || currentValue === undefined) return undefined;

  const optionsLookup = getOptionsLookup(options);
  const remainingSet = new Set<TParent>(remainingParentValues);

  console.log({
    currentValue,
    remainingSet,
    optionsLookup
  })

  const shouldRemoveOption = (optionValue: TValue): boolean => {
    const option = optionsLookup.get(optionValue);
    if (!option) return false;

    const optionParentValue = option.parentValue;

    if (optionParentValue === undefined || optionParentValue === null) {
      return false;
    }

    if (Array.isArray(optionParentValue)) {
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
}

/**
 * Cascade delete for multi-parent dependencies.
 *
 * When a field depends on multiple parents (e.g., commentIds depends on userIds AND taskIds),
 * each option's parentValue is an object like { userIds: [1], taskIds: [5] }.
 *
 * An option is valid if ALL its parent fields have at least one matching value
 * in the remaining parent values.
 *
 * @example
 * ```ts
 * const currentComments = [1, 2, 3];
 * const remainingParentValues = {
 *   userIds: [1, 2],  // users still selected
 *   taskIds: [5, 10], // tasks still selected
 * };
 * // Comment 1 has parentValue { userIds: [1], taskIds: [5] } -> KEEP (user 1 exists, task 5 exists)
 * // Comment 2 has parentValue { userIds: [3], taskIds: [5] } -> REMOVE (user 3 not in [1,2])
 * // Comment 3 has parentValue { userIds: [1], taskIds: [15] } -> REMOVE (task 15 not in [5,10])
 * ```
 */
export function cascadeDeleteMultiParent<
  TValue extends string | number = string | number,
>(
  currentValue: TValue | TValue[] | null | undefined,
  remainingParentValuesMap: Record<string, (string | number)[]>,
  options: XSelectOption[],
): TValue | TValue[] | undefined {
  if (currentValue === null || currentValue === undefined) return undefined;

  const optionsLookup = getOptionsLookup(options);

  // Convert arrays to Sets for O(1) lookup
  const remainingSets: Record<string, Set<string | number>> = {};
  for (const [fieldName, values] of Object.entries(remainingParentValuesMap)) {
    remainingSets[fieldName] = new Set(values);
  }

  const shouldRemoveOption = (optionValue: TValue): boolean => {
    const option = optionsLookup.get(optionValue);
    if (!option) return false;

    const optionParentValue = option.parentValue;

    if (optionParentValue === undefined || optionParentValue === null) {
      return false;
    }

    // For multi-parent, parentValue should be an object
    if (typeof optionParentValue === 'object' && !Array.isArray(optionParentValue)) {
      return !isMultiParentValid(
        optionParentValue as Record<string, unknown>,
        remainingSets,
      );
    }

    // Fallback for legacy single-parent format (shouldn't happen for multi-parent fields)
    return false;
  };

  if (!Array.isArray(currentValue)) {
    return shouldRemoveOption(currentValue) ? undefined : currentValue;
  }

  return currentValue.filter((value) => !shouldRemoveOption(value));
}

/**
 * Create optimized cascade delete function.
 */
export function createCascadeDelete<
  TValue extends string | number = string | number,
  TParent extends string | number = string | number,
>(
  options: XSelectOption[],
): (
  currentValue: TValue | TValue[] | null | undefined,
  remainingParentValues: TParent[],
) => TValue | TValue[] | undefined {
  const optionsLookup = new Map<TValue, XSelectOption>();
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
// OPTIONS FORMATTING
// ============================================================================

/**
 * Internal format implementation.
 */
function formatOptionsInternal<T extends XSelectOption>(
  options: T[],
): FormattedOption[] {
  const result = new Array<FormattedOption>(options.length);

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
 * Format options for UI component.
 * Strips parentValue and custom properties.
 */
export const formatOptions = memoizeWeak(formatOptionsInternal);

// ============================================================================
// VALUE COMPARISON
// ============================================================================

/**
 * Check if two values are equal (handles arrays).
 */
export function areValuesEqual<T = unknown>(valueA: T, valueB: T): boolean {
  if (valueA === valueB) return true;

  const aIsArray = Array.isArray(valueA);
  const bIsArray = Array.isArray(valueB);

  if (aIsArray !== bIsArray) return false;

  if (aIsArray && bIsArray) {
    const arrA = valueA as unknown[];
    const arrB = valueB as unknown[];

    if (arrA.length !== arrB.length) return false;

    for (let i = 0; i < arrA.length; i++) {
      if (arrA[i] !== arrB[i]) return false;
    }

    return true;
  }

  return false;
}

/**
 * Check if arrays are equal regardless of order.
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
 * Normalize value to array.
 */
export function normalizeToArray<T>(value: T | T[] | null | undefined): T[] {
  if (Array.isArray(value)) return value;
  if (value !== null && value !== undefined) return [value];
  return [];
}

/**
 * Check if value is empty.
 */
export function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

/**
 * Clear internal caches (for testing).
 */
export function clearCaches(): void {
  // WeakMaps are automatically garbage collected
}