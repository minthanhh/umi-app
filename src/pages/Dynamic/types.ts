import type { Rule } from 'antd/es/form';

// ============================================================================
// Field Types
// ============================================================================

export type FieldType =
  | 'input'
  | 'textarea'
  | 'number'
  | 'select'
  | 'select-infinite'
  | 'date'
  | 'dateRange'
  | 'checkbox'
  | 'radio'
  | 'switch';

// ============================================================================
// Option Types
// ============================================================================

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

export interface InfiniteSelectConfig {
  apiUrl: string;
  method?: 'GET' | 'POST';
  searchParam?: string;
  pageParam?: string;
  pageSizeParam?: string;
  pageSize?: number;
  labelField: string;
  valueField: string;
  responseDataPath?: string; // e.g., 'data.items' for nested response
  responseTotalPath?: string; // e.g., 'data.total' for total count
}

// ============================================================================
// Field Configuration
// ============================================================================

export interface BaseFieldConfig {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  disabled?: boolean;
  hidden?: boolean;
  rules?: Rule[];
  colSpan?: number; // 1-24 for responsive grid
  tooltip?: string;
}

export interface InputFieldConfig extends BaseFieldConfig {
  type: 'input';
  maxLength?: number;
  prefix?: string;
  suffix?: string;
}

export interface TextareaFieldConfig extends BaseFieldConfig {
  type: 'textarea';
  maxLength?: number;
  rows?: number;
  showCount?: boolean;
}

export interface NumberFieldConfig extends BaseFieldConfig {
  type: 'number';
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
}

export interface SelectFieldConfig extends BaseFieldConfig {
  type: 'select';
  options: SelectOption[];
  mode?: 'multiple' | 'tags';
  allowClear?: boolean;
  showSearch?: boolean;
}

export interface InfiniteSelectFieldConfig extends BaseFieldConfig {
  type: 'select-infinite';
  infiniteConfig: InfiniteSelectConfig;
  mode?: 'multiple';
  allowClear?: boolean;
}

export interface DateFieldConfig extends BaseFieldConfig {
  type: 'date';
  format?: string;
  showTime?: boolean;
}

export interface DateRangeFieldConfig extends BaseFieldConfig {
  type: 'dateRange';
  format?: string;
  showTime?: boolean;
}

export interface CheckboxFieldConfig extends BaseFieldConfig {
  type: 'checkbox';
  options?: SelectOption[];
}

export interface RadioFieldConfig extends BaseFieldConfig {
  type: 'radio';
  options: SelectOption[];
  optionType?: 'default' | 'button';
}

export interface SwitchFieldConfig extends BaseFieldConfig {
  type: 'switch';
  checkedChildren?: string;
  unCheckedChildren?: string;
}

export type FieldConfig =
  | InputFieldConfig
  | TextareaFieldConfig
  | NumberFieldConfig
  | SelectFieldConfig
  | InfiniteSelectFieldConfig
  | DateFieldConfig
  | DateRangeFieldConfig
  | CheckboxFieldConfig
  | RadioFieldConfig
  | SwitchFieldConfig;

// ============================================================================
// Theme Configuration
// ============================================================================

export type FormTheme = 'default' | 'compact' | 'card' | 'inline';

export interface ThemeConfig {
  theme: FormTheme;
  labelAlign?: 'left' | 'right';
  labelCol?: { span: number };
  wrapperCol?: { span: number };
  size?: 'small' | 'middle' | 'large';
  bordered?: boolean;
  showRequiredMark?: boolean;
}

// ============================================================================
// Form Configuration
// ============================================================================

export interface FormSection {
  title?: string;
  description?: string;
  fields: FieldConfig[];
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export interface DynamicFormConfig {
  sections: FormSection[];
  theme?: ThemeConfig;
  submitText?: string;
  resetText?: string;
  showReset?: boolean;
}
