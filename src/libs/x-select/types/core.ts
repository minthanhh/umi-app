/**
 * XSelect - Core Type Definitions
 *
 * Generic types for cascading/dependent select system.
 * Framework-agnostic - no dependency on specific UI libraries.
 *
 * Architecture:
 * - Form library is SOURCE OF TRUTH for values
 * - Store manages: options, loading states, cascade logic
 * - Adapter syncs changes from Store → Form
 */

// ============================================================================
// OPTION TYPES
// ============================================================================

/**
 * Base option structure for select dropdown.
 */
export interface XSelectOption {
  /** Display text */
  label: string;

  /** Value when submitted */
  value: string | number;

  /**
   * Parent value(s) this option belongs to.
   * - Single value: belongs to 1 parent
   * - Array: belongs to multiple parents
   */
  parentValue?: string | number | (string | number)[];

  /** Disable this option */
  disabled?: boolean;

  /** Allow custom properties */
  [key: string]: unknown;
}

/**
 * Formatted option for UI component.
 */
export interface FormattedOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

// ============================================================================
// FIELD CONFIGURATION
// ============================================================================

/**
 * Configuration for a cascading select field.
 *
 * Core fields for store logic:
 * - name: field identification
 * - dependsOn: cascade relationships
 * - options: data source
 * - mode: value type handling
 * - filterOptions: custom filtering
 *
 * Optional UI fields:
 * - label: display label
 * - placeholder: placeholder text
 */
export interface FieldConfig {
  /** Unique field identifier */
  name: string;

  /** Display label for the field */
  label?: string;

  /** Placeholder text */
  placeholder?: string;

  /** Select mode: undefined = single, 'multiple' = multi-select */
  mode?: 'multiple' | 'tags';

  /**
   * Parent field(s) this field depends on.
   * - String: single dependency
   * - Array: multiple dependencies
   */
  dependsOn?: string | string[];

  /**
   * Options source:
   * - Static array
   * - Async function
   * - undefined: options passed via component props
   */
  options?: XSelectOption[] | ((parentValue: unknown) => Promise<XSelectOption[]>);

  /** Custom filter function for options */
  filterOptions?: (options: XSelectOption[], parentValue: unknown) => XSelectOption[];
}

/**
 * Map of field values.
 */
export type FieldValues = Record<string, unknown>;

// ============================================================================
// FORM ADAPTER
// ============================================================================

/**
 * Adapter interface for form library integration.
 */
export interface FormAdapter {
  /** Called when a field value changes */
  onFieldChange: (fieldName: string, value: unknown) => void;

  /** Called when multiple fields change (e.g., cascade delete) */
  onFieldsChange?: (fields: Array<{ name: string; value: unknown }>) => void;
}

// ============================================================================
// STORE TYPES
// ============================================================================

/**
 * Field state snapshot for useSyncExternalStore.
 */
export interface FieldSnapshot {
  /** Current field value */
  value: unknown;

  /**
   * Parent field value.
   * - Single dependency: direct value
   * - Multiple dependencies: object { [fieldName]: value }
   */
  parentValue: unknown;

  /** All parent values (only when dependsOn is array) */
  parentValues?: Record<string, unknown>;
}

/**
 * Parent-child relationship info.
 */
export interface FieldRelationship {
  /** Parent field(s) - null if root */
  parent: string | string[] | null;

  /** Child field names */
  children: string[];
}

/**
 * Map of all field relationships.
 */
export type RelationshipMap = Map<string, FieldRelationship>;

/**
 * Store subscriber callback.
 */
export type StoreListener = () => void;

// ============================================================================
// SELECT VALUE TYPE
// ============================================================================

/**
 * Generic select value type (single or multiple).
 */
export type SelectValue =
  | string
  | number
  | Array<string | number>
  | undefined
  | null;

// ============================================================================
// VALUE METADATA (for cascade delete)
// ============================================================================

/**
 * Metadata for a single selected value.
 * Contains only the parentValue needed for cascade delete.
 */
export interface ValueMetadataEntry {
  /** Parent value(s) this value belongs to */
  parentValue?: string | number | (string | number)[] | Record<string, unknown>;
}

/**
 * Metadata map for all selected values of a field.
 * Key is the value (string | number), value is its metadata.
 *
 * @example
 * ```ts
 * // city field with values ['D1', 'D7', 'HK']
 * const metadata: ValueMetadataMap = {
 *   'D1': { parentValue: 'HCM' },
 *   'D7': { parentValue: 'HCM' },
 *   'HK': { parentValue: 'HN' },
 * };
 * ```
 */
export type ValueMetadataMap = Record<string | number, ValueMetadataEntry>;