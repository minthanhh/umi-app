/**
 * DependentField - Core Types
 *
 * A library-agnostic solution for managing field dependencies in forms.
 * Works with any form library (Antd, Formik, React Hook Form, etc.)
 */

// ============================================================================
// Core Value Types
// ============================================================================

export type FieldValue = string | number | boolean | null | undefined;
export type FieldValues = Record<string, FieldValue | FieldValue[]>;

// ============================================================================
// Dependency Configuration
// ============================================================================

/**
 * Configuration for a single dependent field
 */
export interface DependentFieldConfig<T = FieldValue> {
  /** Unique field name */
  name: string;

  /** Fields this field depends on */
  dependsOn?: string | string[];

  /**
   * Called when any dependency changes.
   * Use this to reset value, fetch new options, etc.
   */
  onDependencyChange?: (params: DependencyChangeParams<T>) => void;

  /**
   * Initial value for this field
   */
  initialValue?: T | T[];
}

export interface DependencyChangeParams<T = FieldValue> {
  /** Current field name */
  fieldName: string;

  /** Current field value */
  currentValue: T | T[] | undefined;

  /** Values of all dependencies */
  dependencyValues: Record<string, FieldValue | FieldValue[]>;

  /** Previous dependency values (for comparison) */
  previousDependencyValues: Record<string, FieldValue | FieldValue[]>;

  /** Helper to set this field's value */
  setValue: (value: T | T[] | undefined) => void;

  /** Helper to check if a specific dependency changed */
  hasChanged: (dependencyName: string) => boolean;
}

// ============================================================================
// Store Types
// ============================================================================

export type Subscriber = () => void;

export interface FieldState {
  value: FieldValue | FieldValue[] | undefined;
  dependsOn: string[];
}

export interface StoreState {
  fields: Map<string, FieldState>;
  subscribers: Map<string, Set<Subscriber>>;
  globalSubscribers: Set<Subscriber>;
}

// ============================================================================
// Hook Return Types
// ============================================================================

export interface UseDependentFieldReturn<T = FieldValue> {
  /** Current field value */
  value: T | T[] | undefined;

  /** Set field value - this triggers the store update */
  setValue: (value: T | T[] | undefined) => void;

  /**
   * Callback to sync with store.
   * Pass this to your input's onChange handler.
   */
  onSyncStore: (value: T | T[] | undefined) => void;

  /** Values of fields this field depends on */
  dependencyValues: Record<string, FieldValue | FieldValue[]>;

  /** Whether all dependencies have values */
  hasDependencies: boolean;

  /** Whether dependencies are satisfied (all have values) */
  isDependencySatisfied: boolean;
}

// ============================================================================
// Provider Types
// ============================================================================

export interface DependentFieldProviderProps {
  /** Field configurations */
  configs: DependentFieldConfig[];

  /** Initial values for all fields */
  initialValues?: FieldValues;

  /** Controlled values (makes the store controlled) */
  value?: FieldValues;

  /** Called when any field value changes */
  onChange?: (values: FieldValues) => void;

  /** Form adapter for syncing with form library */
  adapter?: FormAdapter;

  children: React.ReactNode;
}

// ============================================================================
// Adapter Types
// ============================================================================

/**
 * Adapter interface for integrating with form libraries.
 * Each form library needs its own adapter implementation.
 */
export interface FormAdapter {
  /**
   * Set a single field value in the form
   */
  setFieldValue: (name: string, value: FieldValue | FieldValue[] | undefined) => void;

  /**
   * Set multiple field values at once (optional, for batching)
   */
  setFieldsValue?: (values: FieldValues) => void;

  /**
   * Get a single field value from the form
   */
  getFieldValue?: (name: string) => FieldValue | FieldValue[] | undefined;

  /**
   * Get all field values from the form
   */
  getFieldsValue?: () => FieldValues;
}