/**
 * X-Dynamic-Form Registry Utilities
 *
 * Helper functions for creating and managing field registries.
 */

import type { FieldComponent, FieldRegistry } from './types';

// =============================================================================
// REGISTRY CREATION
// =============================================================================

/**
 * Create a new field registry from an object of components
 *
 * @example
 * ```ts
 * const registry = createRegistry({
 *   input: InputField,
 *   select: SelectField,
 *   checkbox: CheckboxField,
 * });
 * ```
 */
export function createRegistry(components: Record<string, FieldComponent<any, any>>): FieldRegistry {
  return new Map(Object.entries(components));
}

/**
 * Merge multiple registries into one
 * Later registries override earlier ones for duplicate keys
 *
 * @example
 * ```ts
 * const combined = mergeRegistries(baseRegistry, customRegistry);
 * ```
 */
export function mergeRegistries(...registries: FieldRegistry[]): FieldRegistry {
  const merged = new Map<string, FieldComponent<any, any>>();

  for (const registry of registries) {
    for (const [key, value] of registry) {
      merged.set(key, value);
    }
  }

  return merged;
}

/**
 * Extend a registry with additional components
 *
 * @example
 * ```ts
 * const extended = extendRegistry(baseRegistry, {
 *   'custom-input': CustomInputField,
 * });
 * ```
 */
export function extendRegistry(
  registry: FieldRegistry,
  components: Record<string, FieldComponent<any, any>>,
): FieldRegistry {
  return mergeRegistries(registry, createRegistry(components));
}

/**
 * Get list of registered field types
 */
export function getRegisteredTypes(registry: FieldRegistry): string[] {
  return Array.from(registry.keys());
}

/**
 * Check if a field type is registered
 */
export function hasFieldType(registry: FieldRegistry, type: string): boolean {
  return registry.has(type);
}
