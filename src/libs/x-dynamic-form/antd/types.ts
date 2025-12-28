/**
 * X-Dynamic-Form Antd Types
 *
 * Type definitions specific to Ant Design integration.
 */

import type { ReactNode } from 'react';
import type { BaseFieldConfig, FieldConfig } from '../core';
import type {
  BaseItem,
  StaticOption,
  ListQueryConfig,
  HydrationQueryConfig,
  ItemAccessors,
} from '../../x-select';

// =============================================================================
// ANTD FIELD CONFIGS
// =============================================================================

/**
 * Input field configuration
 */
export interface InputFieldConfig extends BaseFieldConfig {
  type: 'input';
  inputType?: 'text' | 'password' | 'email' | 'number' | 'tel' | 'url';
  maxLength?: number;
  prefix?: ReactNode;
  suffix?: ReactNode;
  allowClear?: boolean;
}

/**
 * Textarea field configuration
 */
export interface TextareaFieldConfig extends BaseFieldConfig {
  type: 'textarea';
  rows?: number;
  maxLength?: number;
  showCount?: boolean;
  autoSize?: boolean | { minRows?: number; maxRows?: number };
}

/**
 * Number field configuration
 */
export interface NumberFieldConfig extends BaseFieldConfig {
  type: 'number';
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  prefix?: ReactNode;
  suffix?: ReactNode;
}

/**
 * Select field configuration
 */
export interface SelectFieldConfig extends BaseFieldConfig {
  type: 'select';
  options?: Array<{ label: ReactNode; value: unknown; disabled?: boolean }>;
  mode?: 'multiple' | 'tags';
  showSearch?: boolean;
  allowClear?: boolean;
  loading?: boolean;
  filterOption?: boolean | ((input: string, option: unknown) => boolean);
}

/**
 * Checkbox field configuration
 */
export interface CheckboxFieldConfig extends BaseFieldConfig {
  type: 'checkbox';
  checkboxLabel?: ReactNode;
}

/**
 * Checkbox group field configuration
 */
export interface CheckboxGroupFieldConfig extends BaseFieldConfig {
  type: 'checkbox-group';
  options?: Array<{ label: ReactNode; value: unknown; disabled?: boolean }>;
}

/**
 * Radio field configuration
 */
export interface RadioFieldConfig extends BaseFieldConfig {
  type: 'radio';
  options?: Array<{ label: ReactNode; value: unknown; disabled?: boolean }>;
  optionType?: 'default' | 'button';
  buttonStyle?: 'outline' | 'solid';
}

/**
 * Switch field configuration
 */
export interface SwitchFieldConfig extends BaseFieldConfig {
  type: 'switch';
  checkedChildren?: ReactNode;
  unCheckedChildren?: ReactNode;
}

/**
 * Date picker field configuration
 */
export interface DateFieldConfig extends BaseFieldConfig {
  type: 'date';
  picker?: 'date' | 'week' | 'month' | 'quarter' | 'year';
  format?: string;
  showTime?: boolean;
}

/**
 * Date range field configuration
 */
export interface DateRangeFieldConfig extends BaseFieldConfig {
  type: 'date-range';
  picker?: 'date' | 'week' | 'month' | 'quarter' | 'year';
  format?: string;
  showTime?: boolean;
}

/**
 * Slider field configuration
 */
export interface SliderFieldConfig extends BaseFieldConfig {
  type: 'slider';
  min?: number;
  max?: number;
  step?: number;
  marks?: Record<number, ReactNode>;
  range?: boolean;
}

/**
 * Rate field configuration
 */
export interface RateFieldConfig extends BaseFieldConfig {
  type: 'rate';
  count?: number;
  allowHalf?: boolean;
  character?: ReactNode;
}

// =============================================================================
// COMBINED TYPES
// =============================================================================

/**
 * All Antd field types
 */
export type AntdFieldType =
  | 'input'
  | 'textarea'
  | 'number'
  | 'select'
  | 'checkbox'
  | 'checkbox-group'
  | 'radio'
  | 'switch'
  | 'date'
  | 'date-range'
  | 'slider'
  | 'rate';

/**
 * Union of all Antd field configs
 */
export type AntdFieldConfig =
  | InputFieldConfig
  | TextareaFieldConfig
  | NumberFieldConfig
  | SelectFieldConfig
  | CheckboxFieldConfig
  | CheckboxGroupFieldConfig
  | RadioFieldConfig
  | SwitchFieldConfig
  | DateFieldConfig
  | DateRangeFieldConfig
  | SliderFieldConfig
  | RateFieldConfig;

/**
 * Generic field config that can be any type
 */
export type AnyFieldConfig = FieldConfig<string>;

// =============================================================================
// XSELECT FIELD CONFIGS
// =============================================================================

/**
 * Base XSelect field configuration (common props)
 */
export interface BaseXSelectFieldConfig extends BaseFieldConfig {
  type: 'x-select';
  /** Select mode */
  mode?: 'multiple' | 'tags';
  /** Allow clear */
  allowClear?: boolean;
  /** Show search */
  showSearch?: boolean;
  /** Field dependency (for cascading) */
  dependsOn?: string | string[];
}

/**
 * Static select field configuration
 * For small datasets with metadata (color, icon, description)
 */
export interface StaticSelectFieldConfig extends BaseXSelectFieldConfig {
  /** Static options with metadata */
  staticOptions: StaticOption[];
  /** Show color tags in multiple mode */
  showColorTags?: boolean;
  /** Basic options (fallback) */
  options?: Array<{ label: ReactNode; value: unknown; disabled?: boolean }>;
}

/**
 * Infinite select field configuration
 * For large datasets with pagination (uses grouped props structure)
 */
export interface InfiniteSelectFieldConfig<T extends BaseItem = BaseItem> extends BaseXSelectFieldConfig {
  /** Unique query key for React Query caching */
  queryKey: string;
  /** List query configuration */
  listQuery: ListQueryConfig<T>;
  /** Hydration query configuration (for pre-selected values) */
  hydrationQuery?: HydrationQueryConfig<T>;
  /** Item accessors (getId, getLabel, getParentValue) */
  itemAccessors?: ItemAccessors<T>;
  /** Enable/disable query */
  enabled?: boolean;
  /** Show error display component (default: true) */
  showErrorDisplay?: boolean;
  /** Basic options (fallback) */
  options?: Array<{ label: ReactNode; value: unknown; disabled?: boolean }>;
}

/**
 * Union of all XSelect field configs
 */
export type XSelectFieldConfig<T extends BaseItem = BaseItem> =
  | StaticSelectFieldConfig
  | InfiniteSelectFieldConfig<T>;
