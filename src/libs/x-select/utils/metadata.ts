/**
 * XSelect - Metadata Utilities
 *
 * Helper functions for building value metadata from options.
 * Used by InfiniteWrapper and StaticWrapper for cascade delete.
 */

import type { SelectValue, ValueMetadataMap } from '../types';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Minimal option interface required for metadata extraction.
 * Both InfiniteOption and StaticOption satisfy this interface.
 */
export interface OptionWithParentValue {
  value: string | number;
  parentValue?: unknown;
}

// ============================================================================
// METADATA BUILDER
// ============================================================================

/**
 * Build metadata map from selected values and options.
 *
 * This function extracts parentValue from options for each selected value,
 * creating a lightweight metadata map for cascade delete.
 *
 * @param values - Selected value(s)
 * @param options - Available options with parentValue
 * @returns Metadata map: { [value]: { parentValue } }
 *
 * @example
 * ```ts
 * const options = [
 *   { value: 'D1', label: 'District 1', parentValue: 'HCM' },
 *   { value: 'D7', label: 'District 7', parentValue: 'HCM' },
 *   { value: 'HK', label: 'Hoan Kiem', parentValue: 'HN' },
 * ];
 *
 * buildMetadataFromOptions(['D1', 'HK'], options);
 * // Returns: { 'D1': { parentValue: 'HCM' }, 'HK': { parentValue: 'HN' } }
 * ```
 */
export function buildMetadataFromOptions(
  values: SelectValue,
  options: OptionWithParentValue[],
): ValueMetadataMap {
  if (!values) return {};

  const selectedValues = Array.isArray(values) ? values : [values];
  const metadata: ValueMetadataMap = {};

  // Build a lookup map for O(1) access if options array is large
  const optionsMap =
    options.length > 10
      ? new Map(options.map((opt) => [opt.value, opt]))
      : null;

  for (const selectedValue of selectedValues) {
    const option = optionsMap
      ? optionsMap.get(selectedValue)
      : options.find((opt) => opt.value === selectedValue);

    if (option) {
      // Normalize parentValue to the expected type
      const parentValue = normalizeParentValue(option.parentValue);
      metadata[selectedValue] = { parentValue };
    }
  }

  return metadata;
}

/**
 * Normalize parentValue to the expected metadata format.
 * Handles various input types and converts to standard format.
 */
function normalizeParentValue(
  parentValue: unknown,
): string | number | (string | number)[] | Record<string, unknown> | undefined {
  if (parentValue === undefined || parentValue === null) {
    return undefined;
  }

  // String or number - use directly
  if (typeof parentValue === 'string' || typeof parentValue === 'number') {
    return parentValue;
  }

  // Array - validate elements
  if (Array.isArray(parentValue)) {
    const validElements = parentValue.filter(
      (v): v is string | number =>
        typeof v === 'string' || typeof v === 'number',
    );
    return validElements.length > 0 ? validElements : undefined;
  }

  // Object - use as Record for multi-parent dependencies
  if (typeof parentValue === 'object') {
    return parentValue as Record<string, unknown>;
  }

  return undefined;
}

/**
 * Check if metadata map is empty or has no entries.
 */
export function isMetadataEmpty(metadata: ValueMetadataMap): boolean {
  return Object.keys(metadata).length === 0;
}
