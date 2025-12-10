/**
 * DependentSelect - Types
 *
 * Architecture:
 * - Form library is the SOURCE OF TRUTH for values
 * - Store provides: options, loading states, disabled states, cascade logic
 * - Adapter pattern allows integration with any form library
 *
 * Features:
 * - Single and Multiple select
 * - Cascade delete: when removing parent item, only remove dependent child items
 * - Lazy loading options
 * - Custom filter logic
 */

import type { SelectProps } from 'antd';

// ============================================================================
// Core Types
// ============================================================================

/** Option in select dropdown */
export interface SelectOption {
  label: string;
  value: string | number;
  /** Parent value(s) this option depends on */
  parentValue?: string | number | (string | number)[];
  disabled?: boolean;
  /** Allow custom data */
  [key: string]: any;
}

/** Configuration for a select field */
export interface DependentFieldConfig {
  /** Unique identifier */
  name: string;
  label?: string;
  placeholder?: string;
  /** undefined = single select */
  mode?: 'multiple' | 'tags';
  /** Name of the field this depends on */
  dependsOn?: string;
  /** Static options or async function */
  options:
    | SelectOption[]
    | ((parentValue: any) => SelectOption[] | Promise<SelectOption[]>);
  /** Custom filter function - defaults to filter by parentValue */
  filterOptions?: (options: SelectOption[], parentValue: any) => SelectOption[];
  /** Additional Select props */
  selectProps?: Omit<SelectProps, 'value' | 'onChange' | 'options' | 'mode'>;
}

/** Values for all fields */
export type DependentSelectValues = Record<string, any>;

// ============================================================================
// Form Adapter - Integration with form libraries
// ============================================================================

/**
 * Adapter interface for form library integration.
 * Implement this to connect DependentSelect with your form library.
 *
 * The adapter is called by the Store when:
 * 1. User changes a value → onFieldChange
 * 2. Cascade delete occurs → onFieldChange for each affected field
 *
 * @example Ant Design Form adapter
 * ```tsx
 * const antdAdapter: FormAdapter = {
 *   onFieldChange: (name, value) => {
 *     form.setFieldValue(name, value);
 *   },
 *   onFieldsChange: (changedFields) => {
 *     form.setFieldsValue(
 *       Object.fromEntries(changedFields.map(f => [f.name, f.value]))
 *     );
 *   },
 * };
 * ```
 *
 * @example React Hook Form adapter
 * ```tsx
 * const rhfAdapter: FormAdapter = {
 *   onFieldChange: (name, value) => {
 *     setValue(name, value);
 *   },
 * };
 * ```
 *
 * @example Formik adapter
 * ```tsx
 * const formikAdapter: FormAdapter = {
 *   onFieldChange: (name, value) => {
 *     setFieldValue(name, value);
 *   },
 * };
 * ```
 */
export interface FormAdapter {
  /**
   * Called when a single field value changes.
   * Use this to sync the value to your form library.
   */
  onFieldChange: (fieldName: string, value: any) => void;

  /**
   * Optional: Called when multiple fields change at once (e.g., cascade delete).
   * If not provided, onFieldChange will be called for each field.
   */
  onFieldsChange?: (changedFields: Array<{ name: string; value: any }>) => void;

  /**
   * Optional: Called when values need to be read from the form.
   * Used for initial sync if form already has values.
   */
  getFieldValue?: (fieldName: string) => any;

  /**
   * Optional: Called when all values need to be read from the form.
   */
  getFieldsValue?: () => DependentSelectValues;
}

// ============================================================================
// Context Types
// ============================================================================

/** Context value (internal use) */
export interface DependentSelectContextValue {
  values: DependentSelectValues;
  configs: DependentFieldConfig[];
  getFilteredOptions: (fieldName: string) => SelectOption[];
  setValue: (fieldName: string, value: any) => void;
  loadingFields: Set<string>;
  optionsCache: Map<string, SelectOption[]>;
}

// ============================================================================
// Provider Props
// ============================================================================

/** Props for DependentSelectProvider */
export interface DependentSelectProviderProps {
  /** Field configurations */
  configs: DependentFieldConfig[];

  /**
   * Form adapter for syncing values with form library.
   * Required for proper Form integration.
   */
  adapter?: FormAdapter;

  /**
   * Initial values for the store (uncontrolled mode).
   * Only used on first render.
   */
  initialValues?: DependentSelectValues;

  /**
   * Controlled values - store will sync with this value.
   * Use sparingly as it may cause re-renders.
   */
  value?: DependentSelectValues;

  children: React.ReactNode;
}

// Props cho individual Select
export interface DependentSelectFieldProps {
  name: string;
  // Override props
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

// Relationship map để track parent-child relationships
export interface FieldRelationship {
  parent: string | null;
  children: string[];
}

export type RelationshipMap = Map<string, FieldRelationship>;
