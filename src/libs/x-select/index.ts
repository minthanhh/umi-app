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
 * - Auto-registration in dynamic mode
 *
 * ## Static Mode (configs provided upfront)
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
 * ## Dynamic Mode (fields self-register)
 *
 * @example Dynamic form with auto-registering fields
 * ```tsx
 * <XSelectProvider adapter={formAdapter}>
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
  FieldEvent,
  AllFieldEvents,
  StoreEventPayloadMap,

  // Infinite select types
  BaseItem,
  InfiniteOption,
  FetchRequest,
  FetchResponse,
  InfinitePageData,
  ListQueryConfig,
  HydrationQueryConfig,
  ItemAccessors,
  UseInfiniteSelectResult,
  DependentInjectedProps,
  InfiniteInjectedProps,
  DependentContextValue,
} from './types';

export { AsyncStateHelpers } from './types';

// ============================================================================
// STORE
// ============================================================================

export { XSelectStore, RegistrationManager } from './store';
export type {
  StoreEventType,
  StoreEvent,
  StoreEventListener,
  OnFlushCallback,
  RegistrationManagerOptions,
  RegistrationResult,
} from './store';

// ============================================================================
// CONTEXT & HOOKS
// ============================================================================

export {
  // Provider (supports both static and dynamic modes)
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

  // Deprecated aliases (for backwards compatibility)
  DynamicXSelectProvider,
  useDynamicXSelectStore,
  useDynamicXSelectStoreOptional,
  useDynamicXSelectActions,
  useDynamicXSelectConfig,
  useDynamicXSelectField,
  DynamicStoreContext,
} from './contexts';

export type {
  XSelectProviderProps,
  UseXSelectFieldOptions,
  UseXSelectFieldResult,

  // Deprecated types (for backwards compatibility)
  DynamicXSelectProviderProps,
  UseDynamicXSelectFieldOptions,
  UseDynamicXSelectFieldResult,
} from './contexts';

// ============================================================================
// HOOKS
// ============================================================================

export { useInfiniteSelect, useAutoRegistration } from './hooks';
export type {
  UseInfiniteSelectOptions,
  UseAutoRegistrationOptions,
  UseAutoRegistrationResult,
} from './hooks';

// ============================================================================
// COMPONENTS
// ============================================================================

export {
  // Compound component
  XSelect,

  // Wrappers (work in both static and dynamic modes)
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
  // Wrapper props
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

  // Circular dependency detection
  detectCircularDependency,
  validateNoCircularDependency,

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

export type { CircularDependencyResult } from './utils/index';

// ============================================================================
// DEVTOOLS
// ============================================================================

export {
  enableXSelectDevTools,
  disableXSelectDevTools,
  isDevToolsEnabled,
  connectStoreToDevTools,
  disconnectStoreFromDevTools,
  sendToDevTools,
  logXSelectState,
  useXSelectDevTools,
} from './devtools';

export type { EnableDevToolsOptions, DevToolsOptions, DevToolsAction } from './devtools';