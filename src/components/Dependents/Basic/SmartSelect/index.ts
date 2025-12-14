/**
 * SmartSelect - Compound Component Pattern
 *
 * A flexible compound component system for building dependent and infinite scroll selects.
 *
 * @example Standalone Dependent (with Form)
 * ```tsx
 * <DependentSelectProvider configs={configs} adapter={adapter}>
 *   <Form form={form}>
 *     <Form.Item name="country">
 *       <SmartSelect.Dependent name="country">
 *         <Select placeholder="Select country" />
 *       </SmartSelect.Dependent>
 *     </Form.Item>
 *     <Form.Item name="city">
 *       <SmartSelect.Dependent name="city">
 *         <Select placeholder="Select city" />
 *       </SmartSelect.Dependent>
 *     </Form.Item>
 *   </Form>
 * </DependentSelectProvider>
 * ```
 *
 * @example Standalone Infinite
 * ```tsx
 * <SmartSelect.Infinite queryKey="users" fetchList={fetchUsers}>
 *   <Select placeholder="Select user" />
 * </SmartSelect.Infinite>
 * ```
 *
 * @example Combined: Dependent + Infinite
 * ```tsx
 * <DependentSelectProvider configs={configs} adapter={adapter}>
 *   <SmartSelect.Dependent name="city">
 *     <SmartSelect.Infinite
 *       queryKey="cities"
 *       fetchList={({ current, pageSize, parentValue }) =>
 *         fetchCities({ page: current, size: pageSize, countryId: parentValue })
 *       }
 *     >
 *       <Select placeholder="Select city" />
 *     </SmartSelect.Infinite>
 *   </SmartSelect.Dependent>
 * </DependentSelectProvider>
 * ```
 *
 * @example With render props for full control
 * ```tsx
 * <SmartSelect.Dependent name="city">
 *   {({ value, onChange, parentValue, disabled }) => (
 *     <SmartSelect.Infinite
 *       queryKey="cities"
 *       fetchList={(req) => fetchCities({ ...req, countryId: parentValue })}
 *       value={value}
 *       onChange={onChange}
 *       disabled={disabled}
 *     >
 *       {({ options, loading, onScroll, onOpenChange }) => (
 *         <Select
 *           value={value}
 *           onChange={onChange}
 *           options={options}
 *           loading={loading}
 *           disabled={disabled}
 *           onPopupScroll={onScroll}
 *           onDropdownVisibleChange={onOpenChange}
 *         />
 *       )}
 *     </SmartSelect.Infinite>
 *   )}
 * </SmartSelect.Dependent>
 * ```
 */

// ============================================================================
// COMPOUND COMPONENT
// ============================================================================

import { DependentWrapper } from './DependentWrapper';
import { InfiniteWrapper } from './InfiniteWrapper';

/**
 * SmartSelect compound component.
 * Contains Dependent and Infinite wrappers that can be used independently or nested.
 */
export const SmartSelect = {
  /**
   * Dependent field wrapper.
   * Injects value, onChange, parentValue, options, disabled, loading into children.
   */
  Dependent: DependentWrapper,

  /**
   * Infinite scroll wrapper.
   * Injects options, loading, onScroll, onOpenChange, onSearch, etc. into children.
   */
  Infinite: InfiniteWrapper,
};

// ============================================================================
// INDIVIDUAL EXPORTS
// ============================================================================

export { DependentWrapper } from './DependentWrapper';
export { InfiniteWrapper } from './InfiniteWrapper';

// Context & hooks
export { DependentContext, useDependentContext } from './DependentWrapper';

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
  // Wrapper props
  DependentWrapperProps,
  InfiniteWrapperProps,
  // Injected props (render props)
  DependentInjectedProps,
  InfiniteInjectedProps,
  // Context
  DependentContextValue,
  // Re-exported from InfiniteSelect
  BaseItem,
  FetchRequest,
  FetchResponse,
  InfiniteSelectOption,
  SelectValue,
} from './types';

// Demo
export { SmartSelectDemo } from './SmartSelectDemo';