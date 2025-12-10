/**
 * DependentSelect - Export all components and utilities
 *
 * Architecture:
 * - Form library is SOURCE OF TRUTH for values
 * - Store provides: options, loading states, cascade logic
 * - Adapter pattern syncs Store → Form
 */

// Provider and Hooks
export {
  DependentSelectProvider,
  DependentSelectStore,
  useDependentField,
  useDependentSelect,
  useDependentSelectStore,
  useDependentSelectValues,
} from './context';

// Field Components
export { DependentSelectField } from './DependentSelectField';

// Store types
export type { FieldSnapshot, Listener, StoreSnapshot } from './store';

// Headless Wrapper (works with any form library)
export {
  DependentFieldWrapper,
  FormDependentSelectField,
  useDependentFieldProps,
} from './FormDependentSelectField';
export type {
  DependentFieldRenderProps,
  DependentFieldWrapperProps,
  FormDependentSelectFieldProps,
} from './FormDependentSelectField';

// Types
export type {
  DependentFieldConfig,
  DependentSelectContextValue,
  DependentSelectFieldProps,
  DependentSelectProviderProps,
  DependentSelectValues,
  FieldRelationship,
  FormAdapter,
  RelationshipMap,
  SelectOption,
} from './types';

// Utilities
export {
  buildRelationshipMap,
  cascadeDeleteValues,
  defaultFilterOptions,
  getAllDescendants,
  getRemovedParentValues,
} from './utils';
