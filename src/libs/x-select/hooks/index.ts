/**
 * XSelect - Hooks Exports
 */

// Main composed hook
export { useInfiniteSelect } from './useInfiniteSelect';
export type { UseInfiniteSelectOptions, UseInfiniteSelectResult } from './useInfiniteSelect';

// Individual hooks (for advanced usage)
export { useInfiniteList } from './useInfiniteList';
export type {
  UseInfiniteListOptions,
  UseInfiniteListResult,
  ListDataWithParent,
} from './useInfiniteList';

export { useHydration } from './useHydration';
export type { UseHydrationOptions, UseHydrationResult } from './useHydration';

export { useSelectOptions } from './useSelectOptions';
export type { UseSelectOptionsOptions, UseSelectOptionsResult } from './useSelectOptions';

// Utility hooks
export { useAutoRegistration } from './useAutoRegistration';
export type {
  UseAutoRegistrationOptions,
  UseAutoRegistrationResult,
} from './useAutoRegistration';

export { useStableChildren } from './useStableChildren';
export type { RenderableChildren } from './useStableChildren';