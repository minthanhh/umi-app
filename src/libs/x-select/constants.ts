import type { FieldSnapshot, XSelectOption } from './types';

export const DEFAULT_VALUES = Object.freeze({
    obj: {},
    arr: [],
    bool: false,
    str: '',
    num: 0,
});

/**
 * Empty options array (frozen for reference equality).
 */
export const EMPTY_OPTIONS: readonly XSelectOption[] = Object.freeze([]);

/**
 * Empty field snapshot (frozen for reference equality).
 */
export const EMPTY_SNAPSHOT: FieldSnapshot = Object.freeze({
  value: undefined,
  parentValue: undefined,
  isLoading: false,
});

/**
 * Check if value is empty (undefined, null, or empty array).
 */
export function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}
