/**
 * InfiniteSelect - Main Exports
 *
 * Hệ thống infinite scroll select với React Query.
 *
 * Components:
 * - InfiniteSelect: Standalone component với Ant Design
 * - InfiniteDependentSelectField: Tích hợp với DependentField system
 * - InfiniteSelectWrapper: Render props cho custom UI
 *
 * Hook:
 * - useInfiniteSelect: Core logic có thể dùng với bất kỳ UI
 *
 * @example Standalone usage
 * ```tsx
 * <InfiniteSelect
 *   queryKey="users"
 *   fetchList={async ({ current, pageSize }) => {
 *     const res = await fetch(`/api/users?page=${current}&size=${pageSize}`);
 *     return res.json();
 *   }}
 * />
 * ```
 *
 * @example With DependentField
 * ```tsx
 * <DependentSelectProvider configs={configs} adapter={adapter}>
 *   <FormDependentSelectField name="country" />
 *   <InfiniteDependentSelectField
 *     name="province"
 *     fetchList={fetchProvinces}
 *   />
 * </DependentSelectProvider>
 * ```
 *
 * @example With custom UI (render props)
 * ```tsx
 * <InfiniteSelectWrapper queryKey="products" fetchList={fetchProducts}>
 *   {({ items, isLoading, onScroll }) => (
 *     <MyCustomSelect items={items} loading={isLoading} onScroll={onScroll} />
 *   )}
 * </InfiniteSelectWrapper>
 * ```
 *
 * @example Using hook directly
 * ```tsx
 * function MyComponent() {
 *   const { options, isLoading, onScroll, onOpenChange } = useInfiniteSelect({
 *     queryKey: 'items',
 *     fetchList: fetchItems,
 *   });
 *
 *   return <Select options={options} loading={isLoading} onPopupScroll={onScroll} />;
 * }
 * ```
 */

// ============================================================================
// COMPONENTS
// ============================================================================

export { InfiniteSelect } from './InfiniteSelect';
export { InfiniteDependentSelectField } from './InfiniteDependentSelectField';
export { InfiniteSelectWrapper } from './InfiniteSelectWrapper';

// Demo component (for reference/testing)
// ============================================================================
// HOOKS
// ============================================================================

export { useInfiniteSelect } from './useInfiniteSelect';

// ============================================================================
// TYPES
// ============================================================================

export type {
  // Base types
  BaseItem,
  InfiniteSelectOption,
  SelectValue,
  // Fetch types
  FetchRequest,
  FetchResponse,
  // Config types
  InfiniteSelectConfig,
  // Hook types
  UseInfiniteSelectOptions,
  UseInfiniteSelectResult,
  // Component props
  InfiniteSelectProps,
  InfiniteDependentSelectFieldProps,
  // Render props types
  InfiniteSelectRenderProps,
  InfiniteSelectWrapperProps,
} from './types';