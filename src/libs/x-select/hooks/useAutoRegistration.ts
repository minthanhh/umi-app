/**
 * useAutoRegistration - Auto-registration hook for X-Select wrappers
 *
 * Enables wrappers (Dependent, Infinite, Static, Field) to auto-register
 * fields when not pre-configured in central configs.
 *
 * Key Features:
 * - Auto-detect static vs dynamic mode
 * - Idempotent: skip if field already exists
 * - Register on mount, unregister on unmount
 * - Uses useLayoutEffect for registration before paint
 *
 * @example
 * ```tsx
 * // Inside DependentWrapper
 * const { isDynamicMode } = useAutoRegistration({
 *   name: 'country',
 *   dependsOn: 'region',
 *   options: countryOptions,
 * });
 * ```
 */

import { useLayoutEffect, useRef } from 'react';

import { useXSelectStore } from '../contexts';
import type { FieldConfig, XSelectOption } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export interface UseAutoRegistrationOptions {
  /** Field name (required) */
  name: string;

  /** Parent field dependency */
  dependsOn?: string | string[];

  /** Static options or async options loader */
  options?: XSelectOption[] | ((parentValue: unknown) => Promise<XSelectOption[]>);

  /** Selection mode */
  mode?: 'multiple' | 'tags';

  /** Custom filter function */
  filterOptions?: (options: XSelectOption[], parentValue: unknown) => XSelectOption[];

  /** Skip registration explicitly */
  skip?: boolean;
}

export interface UseAutoRegistrationResult {
  /** Whether field was auto-registered (not in central configs) */
  isDynamicMode: boolean;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Auto-register field if not pre-configured in XSelectProvider.
 *
 * MUST be used within XSelectProvider - will throw if not.
 */
export function useAutoRegistration(
  options: UseAutoRegistrationOptions,
): UseAutoRegistrationResult {
  const { name, dependsOn, options: fieldOptions, mode, filterOptions, skip = false } = options;

  const store = useXSelectStore();

  // Track if THIS hook registered the field (for cleanup)
  const didRegisterRef = useRef(false);

  // Check on first render if field already exists (static mode)
  const initialHasFieldRef = useRef<boolean | null>(null);
  if (initialHasFieldRef.current === null) {
    initialHasFieldRef.current = store.hasField(name);
  }

  const isDynamicMode = !initialHasFieldRef.current;

  // Initial registration (only runs once per field name)
  useLayoutEffect(() => {
    // Skip if explicitly told to or field already exists
    if (skip || store.hasField(name)) {
      return;
    }

    // Build and register config
    const config: FieldConfig = {
      name,
      ...(dependsOn && { dependsOn }),
      ...(fieldOptions && { options: fieldOptions }),
      ...(mode && { mode }),
      ...(filterOptions && { filterOptions }),
    };

    store.registerField(config);
    didRegisterRef.current = true;

    // Cleanup: only unregister if THIS hook registered it
    return () => {
      if (didRegisterRef.current) {
        store.unregisterField(name);
        didRegisterRef.current = false;
      }
    };
    // Only re-run when name changes (mount/unmount per field)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, skip, store]);

  // Update config when options/dependsOn/mode change (without re-registering)
  useLayoutEffect(() => {
    // Only update if we registered this field and it exists
    if (!didRegisterRef.current || !store.hasField(name)) {
      return;
    }

    // Update the field config with new values
    store.updateFieldConfig(name, {
      ...(dependsOn && { dependsOn }),
      ...(fieldOptions && { options: fieldOptions }),
      ...(mode && { mode }),
      ...(filterOptions && { filterOptions }),
    });
  }, [name, dependsOn, fieldOptions, mode, filterOptions, store]);

  return { isDynamicMode };
}

export default useAutoRegistration;