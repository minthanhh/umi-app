/**
 * XSelect - Wrapper Exports
 */

export {
  DependentWrapper,
  DependentContext,
  useDependentContext,
} from './DependentWrapper';
export type { DependentWrapperProps, DependentInjectedProps } from './DependentWrapper';

export { InfiniteWrapper } from './InfiniteWrapper';
export type { InfiniteWrapperProps, InfiniteInjectedProps } from './InfiniteWrapper';

export { StaticWrapper } from './StaticWrapper';
export type { StaticWrapperProps, StaticInjectedProps, StaticOption } from './StaticWrapper';

// ============================================================================
// COMPOUND COMPONENT
// ============================================================================

import { DependentWrapper } from './DependentWrapper';
import { InfiniteWrapper } from './InfiniteWrapper';
import { StaticWrapper } from './StaticWrapper';

/**
 * XSelect compound component.
 *
 * @example With infinite scroll
 * ```tsx
 * <XSelect.Dependent name="city">
 *   <XSelect.Infinite queryKey="cities" fetchList={fetchCities}>
 *     <Select />
 *   </XSelect.Infinite>
 * </XSelect.Dependent>
 * ```
 *
 * @example With static options
 * ```tsx
 * <XSelect.Dependent name="status">
 *   <XSelect.Static options={statusOptions}>
 *     <Select />
 *   </XSelect.Static>
 * </XSelect.Dependent>
 * ```
 */
export const XSelect = {
  Dependent: DependentWrapper,
  Infinite: InfiniteWrapper,
  Static: StaticWrapper,
};