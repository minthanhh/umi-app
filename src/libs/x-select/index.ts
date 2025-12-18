/**
 * XSelect - Cascading/Dependent Select Library
 *
 * A framework-agnostic library for building cascading (dependent) select fields.
 *
 * Features:
 * - Cascading/dependent select with automatic cascade delete
 * - Infinite scroll with React Query
 * - Static select with metadata support
 * - Framework-agnostic types (no UI library dependency)
 * - Optimized with useSyncExternalStore
 * - Support for single and multiple parent dependencies
 *
 * @example Basic cascading select
 * ```tsx
 * const configs = [
 *   { name: 'country', options: countries },
 *   { name: 'province', dependsOn: 'country', options: provinces },
 *   { name: 'city', dependsOn: 'province', options: cities },
 * ];
 *
 * <XSelectProvider configs={configs} adapter={formAdapter}>
 *   <CountrySelect />
 *   <ProvinceSelect />
 *   <CitySelect />
 * </XSelectProvider>
 * ```
 *
 * @example With infinite scroll
 * ```tsx
 * <XSelect.Dependent name="city">
 *   <XSelect.Infinite queryKey="cities" fetchList={fetchCities}>
 *     <Select placeholder="Select city" />
 *   </XSelect.Infinite>
 * </XSelect.Dependent>
 * ```
 *
 * @example With static options (small datasets with metadata)
 * ```tsx
 * const statusOptions = [
 *   { label: 'Active', value: 'active', color: 'green', icon: <CheckIcon /> },
 *   { label: 'Inactive', value: 'inactive', color: 'red', icon: <XIcon /> },
 * ];
 *
 * <XSelect.Static options={statusOptions}>
 *   {({ options, selectedOptions }) => (
 *     <Select options={options} />
 *   )}
 * </XSelect.Static>
 * ```
 */

// ============================================================================
// TYPES
// ============================================================================

export type {
  // Core types
  XSelectOption,
  FormattedOption,
  FieldConfig,
  FieldValues,
  FormAdapter,
  FieldSnapshot,
  FieldRelationship,
  RelationshipMap,
  StoreListener,
  TypedOption,
  TypedOptionWithParent,
  SelectValue,

  // Async state types
  IdleState,
  LoadingState,
  SuccessState,
  ErrorState,
  AsyncState,
  OptionsAsyncState,
  StoreEventType,
  FieldEvent,
  AllFieldEvents,
  StoreEventPayloadMap,
  StoreEventListener,

  // Infinite select types
  BaseItem,
  InfiniteOption,
  FetchRequest,
  FetchResponse,
  InfiniteConfig,
  UseInfiniteSelectResult,
  DependentInjectedProps,
  InfiniteInjectedProps,
  DependentContextValue,
} from './types';

export { AsyncStateHelpers } from './types';

// ============================================================================
// STORE
// ============================================================================

export { XSelectStore } from './store/XSelectStore';

// ============================================================================
// CONTEXT & HOOKS
// ============================================================================

export {
  // Provider
  XSelectProvider,

  // Store hooks
  useXSelectStore,
  useXSelectStoreOptional,

  // Action hooks
  useXSelectActions,
  useXSelectConfig,

  // Field hooks
  useXSelectField,
  useXSelectValue,
  useXSelectLoading,
  useXSelectParentValue,
  useXSelectValues,

  // Context (advanced)
  XSelectStoreContext,
} from './contexts';

export type {
  XSelectProviderProps,
  UseXSelectFieldOptions,
  UseXSelectFieldResult,
} from './contexts';

// ============================================================================
// HOOKS
// ============================================================================

export { useInfiniteSelect } from './hooks';
export type { UseInfiniteSelectOptions } from './hooks';

// ============================================================================
// COMPONENTS
// ============================================================================

export {
  // Compound component
  XSelect,

  // Individual wrappers
  DependentWrapper,
  InfiniteWrapper,
  StaticWrapper,

  // Context
  DependentContext,
  useDependentContext,

  // Error Recovery
  ErrorDisplay,
  XSelectErrorBoundary,
  parseError,
} from './components';

export type {
  DependentWrapperProps,
  InfiniteWrapperProps,
  StaticWrapperProps,
  StaticInjectedProps,
  StaticOption,

  // Error types
  ErrorDisplayProps,
  ErrorRenderProps,
  ErrorSeverity,
  ErrorType,
  ParsedError,
  XSelectErrorBoundaryProps,
  ErrorBoundaryFallbackProps,
} from './components';

// ============================================================================
// UTILITIES
// ============================================================================

export {
  // Relationship mapping
  buildRelationshipMap,
  getDescendants,
  createDescendantsGetter,
  normalizeDependsOn,

  // Options filtering
  filterOptionsByParent,
  formatOptions,
  createOptionsFilter,

  // Cascade delete
  cascadeDelete,
  createCascadeDelete,
  getRemovedValues,

  // Value comparison
  areValuesEqual,
  areArraysEqualUnordered,

  // Helpers
  normalizeToArray,
  isEmpty,
  clearCaches,
} from './utils/index';