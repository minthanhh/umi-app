/**
 * XSelect - Context Exports
 *
 * Unified XSelectProvider now supports both:
 * - Static mode: configs provided upfront
 * - Dynamic mode: configs optional, fields self-register via wrappers
 */

export {
  // Provider
  XSelectProvider,
  // Hooks
  useXSelectStore,
  useXSelectStoreOptional,
  useXSelectActions,
  useXSelectConfig,
  useXSelectField,
  useXSelectValue,
  useXSelectLoading,
  useXSelectParentValue,
  useXSelectValues,
  // Context (for advanced usage)
  XSelectStoreContext,
} from './XSelectContext';

export type {
  XSelectProviderProps,
  UseXSelectFieldOptions,
  UseXSelectFieldResult,
} from './XSelectContext';

// ============================================================================
// DEPRECATED EXPORTS (for backwards compatibility)
// These will be removed in a future version. Use XSelectProvider instead.
// ============================================================================

/** @deprecated Use XSelectProvider instead - it now supports both static and dynamic modes */
export { XSelectProvider as DynamicXSelectProvider } from './XSelectContext';

/** @deprecated Use useXSelectStore instead */
export { useXSelectStore as useDynamicXSelectStore } from './XSelectContext';

/** @deprecated Use useXSelectStoreOptional instead */
export { useXSelectStoreOptional as useDynamicXSelectStoreOptional } from './XSelectContext';

/** @deprecated Use useXSelectActions instead */
export { useXSelectActions as useDynamicXSelectActions } from './XSelectContext';

/** @deprecated Use useXSelectConfig instead */
export { useXSelectConfig as useDynamicXSelectConfig } from './XSelectContext';

/** @deprecated Use useXSelectField instead */
export { useXSelectField as useDynamicXSelectField } from './XSelectContext';

/** @deprecated Use XSelectStoreContext instead */
export { XSelectStoreContext as DynamicStoreContext } from './XSelectContext';

/** @deprecated Types - use XSelectProviderProps instead */
export type { XSelectProviderProps as DynamicXSelectProviderProps } from './XSelectContext';

/** @deprecated Types - use UseXSelectFieldOptions instead */
export type { UseXSelectFieldOptions as UseDynamicXSelectFieldOptions } from './XSelectContext';

/** @deprecated Types - use UseXSelectFieldResult instead */
export type { UseXSelectFieldResult as UseDynamicXSelectFieldResult } from './XSelectContext';