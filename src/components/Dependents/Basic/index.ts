/**
 * DependentSelect - Main Exports
 *
 * A system for managing dependent/cascading select fields.
 *
 * Architecture:
 * - Store: External state management with useSyncExternalStore
 * - Adapter: Bridge to form libraries (Ant Design Form, RHF, Formik)
 * - Provider: React context for sharing store
 * - Hooks: useDependentField for optimized field subscriptions
 *
 * @example Basic usage with Ant Design Form
 * ```tsx
 * const configs: DependentFieldConfig[] = [
 *   { name: 'country', options: countries },
 *   { name: 'province', dependsOn: 'country', options: provinces },
 *   { name: 'city', dependsOn: 'province', options: cities },
 * ];
 *
 * const adapter: DependentFormAdapter = {
 *   onFieldChange: (name, value) => form.setFieldValue(name, value),
 * };
 *
 * <Form form={form}>
 *   <DependentSelectProvider configs={configs} adapter={adapter}>
 *     <FormDependentSelectField name="country" label="Country" />
 *     <FormDependentSelectField name="province" label="Province" />
 *     <FormDependentSelectField name="city" label="City" />
 *   </DependentSelectProvider>
 * </Form>
 * ```
 */

// ============================================================================
// PROVIDER & HOOKS
// ============================================================================

export {
  // Provider
  DependentSelectProvider,
  // Field subscription hooks (optimized)
  useDependentField,
  useDependentValue,
  useDependentLoading,
  useDependentParentValue,
  useDependentValues,
  // Store access hooks
  useDependentStore,
  useDependentStoreOptional,
  // Context access hooks (Context Splitting)
  useDependentActions,
  useDependentConfig,
  // Backward compatibility
  DependentStoreContext,
} from './context';

export type {
  UseDependentFieldOptions,
  UseDependentFieldResult,
  UseDependentFieldReturn, // Backward compatibility
} from './context';

// ============================================================================
// COMPONENTS
// ============================================================================

export { DependentSelectField } from './DependentSelectField';
export { FormDependentSelectField } from './FormDependentSelectField';
export { DependentFieldWrapper } from './DependentFieldWrapper';

// Demo components (for reference/testing)
export { DependentSelectDemo } from './DependentSelectDemo';
export { RealApiDemo } from './RealApiDemo';

export type { FormDependentSelectFieldProps } from './FormDependentSelectField';
export type {
  DependentFieldRenderProps,
  DependentFieldWrapperProps,
} from './DependentFieldWrapper';

// ============================================================================
// STORE
// ============================================================================

export { DependentSelectStore } from './store';

// ============================================================================
// TYPES
// ============================================================================

export type {
  // Primary types (new naming)
  DependentFieldConfig,
  DependentFieldRelationship,
  DependentFieldSnapshot,
  DependentFieldValues,
  DependentFormAdapter,
  DependentRelationshipMap,
  DependentSelectFieldProps,
  DependentSelectProviderProps,
  FormattedSelectOption,
  SelectOption,
  StoreListener,

  // Type Safety Enhancement - Branded Types
  FieldName,
  ExtractFieldNames,

  // Type Safety Enhancement - Template Literal Types
  StoreEventType,
  FieldEvent,
  AllFieldEvents,
  StoreEventPayloadMap,
  StoreEventListener,

  // Type Safety Enhancement - Discriminated Unions
  IdleState,
  LoadingState,
  SuccessState,
  ErrorState,
  AsyncState,
  OptionsAsyncState,

  // Type Safety Enhancement - Const Assertions
  ReadonlyFieldConfig,
  InferFieldNames,
  TypedFieldValues,
  ValidateDependencies,
  StrictFieldConfigs,

  // Utility Types
  RequiredProps,
  OptionalProps,
  DeepReadonly,
  SelectOptionValue,
  TypedSelectOption,

  // Backward compatibility aliases
  FieldConfig,
  FieldRelationship,
  FieldSnapshot,
  FieldValues,
  FormAdapter,
  Listener,
  ProviderProps,
  RelationshipMap,
  SelectFieldProps,
} from './types';

// Type Safety Enhancement - Runtime helpers
export {
  createFieldName,
  defineConfigs,
  AsyncStateHelpers,
} from './types';

// ============================================================================
// UTILITIES
// ============================================================================

export {
  // Relationship mapping
  buildRelationshipMap,
  getDescendants,
  createDescendantsGetter,
  // Options filtering
  filterOptionsByParent,
  formatOptionsForSelect,
  createOptionsFilter,
  // Cascade delete
  cascadeDelete,
  createCascadeDelete,
  getRemovedValues,
  // Value comparison
  areValuesEqual,
  areArraysEqualUnordered,
  // Utility helpers
  normalizeToArray,
  isEmpty,
  clearCaches,
  // Types
  type GenericSelectOption,
  type ParentValue,
} from './utils';

// ============================================================================
// INFINITE SELECT (React Query powered)
// ============================================================================

export {
  // Components
  InfiniteSelect,
  InfiniteDependentSelectField,
  InfiniteSelectWrapper,
  // Hook
  useInfiniteSelect,
  // Demo
  InfiniteSelectDemo,
} from './InfiniteSelect';

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
} from './InfiniteSelect';

// ============================================================================
// SMART SELECT - Compound Component Pattern
// ============================================================================

export {
  // Main compound component
  SmartSelect,
  // Individual wrappers
  DependentWrapper,
  InfiniteWrapper,
  // Context & hooks
  DependentContext,
  useDependentContext,
} from './SmartSelect';

export type {
  // Wrapper props
  DependentWrapperProps,
  InfiniteWrapperProps,
  // Injected props (render props)
  DependentInjectedProps,
  InfiniteInjectedProps,
  // Context
  DependentContextValue,
} from './SmartSelect';

// ============================================================================
// BACKWARD COMPATIBILITY ALIASES
// ============================================================================

// Component aliases (old names -> new names)
// None needed - component names are the same

// Type aliases are already exported from types.ts with @deprecated tags