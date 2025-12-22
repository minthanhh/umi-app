/**
 * X-Dynamic-Form Core Types
 *
 * These types are framework-agnostic and define the contract
 * for building dynamic forms.
 */

import type { ReactNode } from 'react';

// =============================================================================
// FIELD CONFIGURATION
// =============================================================================

/**
 * Base field configuration - minimum required for any field
 */
export interface BaseFieldConfig {
  /** Unique field name/path */
  name: string;
  /** Field label */
  label?: ReactNode;
  /** Whether field is required */
  required?: boolean;
  /** Whether field is disabled */
  disabled?: boolean;
  /** Whether field is read-only */
  readOnly?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Help text */
  help?: ReactNode;
  /** Initial/default value */
  defaultValue?: unknown;
  /** Custom class name */
  className?: string;
  /** Custom style */
  style?: React.CSSProperties;
  /** Any additional props to pass to the field component */
  [key: string]: unknown;
}

/**
 * Field configuration with type discrimination
 */
export interface FieldConfig<T extends string = string> extends BaseFieldConfig {
  /** Field type - used to resolve the component */
  type: T;
}

// =============================================================================
// FIELD COMPONENT PROPS
// =============================================================================

/**
 * Props passed to field components
 * This is what your custom field components will receive
 *
 * Note: value and onChange are optional because when used with form wrappers
 * like Ant Design's Form.Item with `name` prop, these props are injected
 * by the wrapper via cloneElement. Field components should handle both cases.
 */
export interface FieldComponentProps<TConfig extends BaseFieldConfig = BaseFieldConfig, TValue = unknown> {
  /** The field configuration */
  config: TConfig;
  /** Current field value (may be injected by Form.Item) */
  value?: TValue;
  /** Callback when value changes (may be injected by Form.Item) */
  onChange?: (value: TValue) => void;
  /** Callback when field loses focus */
  onBlur?: () => void;
  /** Whether field is disabled */
  disabled?: boolean;
  /** Whether field is read-only */
  readOnly?: boolean;
  /** Error message if field has error */
  error?: string;
  /** Field name/path */
  name: string;
}

/**
 * Field component type definition
 */
export type FieldComponent<TConfig extends BaseFieldConfig = BaseFieldConfig, TValue = unknown> = React.ComponentType<
  FieldComponentProps<TConfig, TValue>
>;

// =============================================================================
// FORM WRAPPER PROPS
// =============================================================================

/**
 * Props for form item wrapper (the wrapper around each field that shows label, error, etc.)
 */
export interface FormItemWrapperProps {
  /** Field configuration */
  config: BaseFieldConfig;
  /** Error message */
  error?: string;
  /** Children (the actual field component) */
  children: ReactNode;
}

/**
 * Form item wrapper component type
 */
export type FormItemWrapper = React.ComponentType<FormItemWrapperProps>;

// =============================================================================
// FIELD REGISTRY
// =============================================================================

/**
 * Registry for field components
 * Maps field type string to component
 */
export type FieldRegistry = Map<string, FieldComponent<any, any>>;

// =============================================================================
// FORM CONTEXT
// =============================================================================

/**
 * Context value for the form
 * Provides access to field registry and wrapper component
 */
export interface FormContextValue {
  /** Registry of field components */
  registry: FieldRegistry;
  /** Optional form item wrapper component */
  FormItemWrapper?: FormItemWrapper;
  /** Get field value by name */
  getValue?: (name: string) => unknown;
  /** Set field value by name */
  setValue?: (name: string, value: unknown) => void;
  /** Get field error by name */
  getError?: (name: string) => string | undefined;
  /** Any additional context data */
  [key: string]: unknown;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Extract config type from field component
 */
export type ExtractConfig<T> = T extends FieldComponent<infer C, any> ? C : never;

/**
 * Extract value type from field component
 */
export type ExtractValue<T> = T extends FieldComponent<any, infer V> ? V : never;

/**
 * Schema definition - array of field configs
 */
export type FormSchema<T extends string = string> = FieldConfig<T>[];

/**
 * Section of fields with optional title
 */
export interface FormSection<T extends string = string> {
  title?: ReactNode;
  description?: ReactNode;
  fields: FormSchema<T>;
}
