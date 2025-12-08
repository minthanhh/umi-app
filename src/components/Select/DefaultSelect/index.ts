// ============================================================================
// DefaultSelect - Headless Select Wrapper
// ============================================================================
//
// A headless wrapper component that handles all select logic:
// - Data fetching (list + hydration)
// - Infinite scroll pagination
// - Dropdown state management
// - Value normalization
//
// Usage:
// 1. With Context (recommended for complex UIs):
//    <SelectWrapper config={config} value={value} onChange={onChange}>
//      <MyCustomSelect />  {/* Uses useSelectContext() inside */}
//    </SelectWrapper>
//
// 2. With Render Props (for simple cases):
//    <SelectWrapper config={config} value={value} onChange={onChange}>
//      {({ state, actions }) => (
//        <Select value={state.selectedIds} onChange={actions.onChange} />
//      )}
//    </SelectWrapper>
//
// ============================================================================

// Core wrapper component
export { SelectWrapper } from './SelectWrapper';

// Context hook for child components
export { useSelectContext, SelectProvider } from './context';

// Reusable hooks (can be used independently)
export {
  useNormalizedInput,
  useDropdownState,
  useHydration,
  useList,
  useDataSource,
  useMergedOptions,
  useScrollHandler,
} from './hooks';

// Types
export type {
  // Domain types
  BaseItem,
  PrefilledItem,
  // API types
  FetchRequest,
  FetchResponse,
  PaginatedResponse,
  // Config types
  FetchStrategy,
  SelectWrapperConfig,
  // Value types
  SelectValue,
  SelectOption,
  // Context types
  SelectState,
  SelectActions,
  SelectContext,
  // Props types
  SelectWrapperProps,
  // Hook return types
  NormalizedInput,
  DataSourceResult,
  DropdownState,
} from './types';