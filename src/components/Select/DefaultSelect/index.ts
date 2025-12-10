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
export { SelectProvider, useSelectContext } from './context';

// Reusable hooks (can be used independently)
export {
  useDataSource,
  useDropdownState,
  useHydration,
  useList,
  useMergedOptions,
  useNormalizedInput,
  useScrollHandler,
} from './hooks';

// Types
export type {
  // Domain types
  BaseItem,
  DataSourceResult,
  DropdownState,
  // API types
  FetchRequest,
  FetchResponse,
  // Config types
  FetchStrategy,
  // Hook return types
  NormalizedInput,
  PaginatedResponse,
  PrefilledItem,
  SelectActions,
  SelectContext,
  SelectOption,
  // Context types
  SelectState,
  // Value types
  SelectValue,
  SelectWrapperConfig,
  // Props types
  SelectWrapperProps,
} from './types';
