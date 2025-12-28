/**
 * XSelect - Wrapper Exports
 *
 * All wrappers now support both static mode (XSelectProvider with configs)
 * and dynamic mode (DynamicXSelectProvider with auto-registration).
 *
 * In dynamic mode, wrappers automatically register themselves when mounted
 * and unregister when unmounted.
 */

// ============================================================================
// WRAPPERS (work in both static and dynamic modes)
// ============================================================================

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
// INTERNAL HOOKS (for wrapper implementation)
// ============================================================================

export { useUnifiedField } from './useUnifiedField';
export type { UseUnifiedFieldOptions, UseUnifiedFieldResult } from './useUnifiedField';

// ============================================================================
// COMPOUND COMPONENT
// ============================================================================

import { DependentWrapper } from './DependentWrapper';
import { InfiniteWrapper } from './InfiniteWrapper';
import { StaticWrapper } from './StaticWrapper';

/**
 * XSelect compound component.
 *
 * All wrappers now support auto-registration in dynamic mode!
 * Just use DynamicXSelectProvider and pass `dependsOn` prop to wrappers.
 *
 * @example Static mode - With configs in Provider
 * ```tsx
 * const configs = [
 *   { name: 'country', options: countries },
 *   { name: 'city', dependsOn: 'country', options: cities },
 * ];
 *
 * <XSelectProvider configs={configs}>
 *   <XSelect.Dependent name="country">
 *     <Select />
 *   </XSelect.Dependent>
 *   <XSelect.Dependent name="city">
 *     <Select />
 *   </XSelect.Dependent>
 * </XSelectProvider>
 * ```
 *
 * @example Dynamic mode - Auto-registration
 * ```tsx
 * <DynamicXSelectProvider>
 *   {schema.fields.map(field => (
 *     <XSelect.Dependent
 *       key={field.name}
 *       name={field.name}
 *       dependsOn={field.dependsOn}
 *       options={field.options}
 *     >
 *       <Select />
 *     </XSelect.Dependent>
 *   ))}
 * </DynamicXSelectProvider>
 * ```
 *
 * @example Dynamic mode with Infinite scroll
 * ```tsx
 * <DynamicXSelectProvider>
 *   <XSelect.Infinite
 *     name="city"
 *     dependsOn="country"
 *     queryKey="cities"
 *     fetchList={fetchCities}
 *   >
 *     <Select />
 *   </XSelect.Infinite>
 * </DynamicXSelectProvider>
 * ```
 */
export const XSelect = {
  // All wrappers work in both static and dynamic modes
  Dependent: DependentWrapper,
  Infinite: InfiniteWrapper,
  Static: StaticWrapper,
};