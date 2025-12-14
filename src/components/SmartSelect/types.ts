/**
 * SmartSelect - Compound Component Types
 *
 * Design principles:
 * 1. Select.Dependent và Select.Infinite độc lập, không biết nhau
 * 2. Cả hai có thể kết hợp với nhau thông qua composition
 * 3. Render props pattern cho phép dùng bất kỳ UI library nào
 * 4. Config có thể từ Provider hoặc từ props
 */

import type { ReactNode } from 'react';

// ============================================================================
// Base Types
// ============================================================================

export interface BaseItem {
  id: string | number;
  [key: string]: unknown;
}

export interface SelectOption<T extends BaseItem = BaseItem> {
  label: string;
  value: string | number;
  item: T;
  disabled?: boolean;
}

// ============================================================================
// Value Types
// ============================================================================

export type SelectValue =
  | string
  | number
  | Array<string | number>
  | null
  | undefined;

// ============================================================================
// Fetch Types
// ============================================================================

export interface FetchRequest {
  current: number;
  pageSize: number;
  /** Dependencies values - when using with Dependent */
  dependencies?: Record<string, SelectValue>;
  /** Search keyword */
  search?: string;
  /** Specific IDs to fetch (for hydration) */
  ids?: Array<string | number>;
}

export interface FetchResponse<T> {
  data: T[];
  total?: number;
  hasMore?: boolean;
}

// ============================================================================
// Infinite Types
// ============================================================================

export interface InfiniteConfig<T extends BaseItem = BaseItem> {
  /** Unique query key for caching */
  queryKey: string;

  /** Fetch function */
  fetchList: (request: FetchRequest) => Promise<FetchResponse<T>>;

  /** Fetch by IDs for hydration */
  fetchByIds?: (
    ids: Array<string | number>,
    dependencies?: Record<string, SelectValue>,
  ) => Promise<T[]>;

  /** Items per page */
  pageSize?: number;

  /** Fetch strategy */
  fetchStrategy?: 'eager' | 'lazy';

  /** Stale time (ms) */
  staleTime?: number;

  /** Get ID from item */
  getItemId?: (item: T) => string | number;

  /** Get label from item */
  getItemLabel?: (item: T) => string;
}

/** Props passed to children via render props */
export interface InfiniteRenderProps<T extends BaseItem = BaseItem> {
  /** Converted options for select */
  options: SelectOption<T>[];

  /** Raw items */
  items: T[];

  /** Selected items with full data */
  selectedItems: T[];

  /** Current value (single value or array for multiple mode) */
  value: SelectValue;

  /** Loading states */
  isLoading: boolean;
  isHydrating: boolean;
  isFetchingMore: boolean;

  /** Pagination */
  hasNextPage: boolean;

  /** Dropdown state */
  isOpen: boolean;

  /** Error */
  error: Error | null;

  /** Actions */
  onChange: (value: SelectValue) => void;
  onOpenChange: (open: boolean) => void;
  onScroll: (e: React.UIEvent<HTMLElement>) => void;
  onSearch?: (keyword: string) => void;
  fetchNextPage: () => void;
}

export interface InfiniteProps<T extends BaseItem = BaseItem> {
  /** Inline config (takes priority over provider config) */
  config?: InfiniteConfig<T>;

  /** Config name to get from provider */
  configName?: string;

  /** Controlled value */
  value?: SelectValue;

  /** Change handler */
  onChange?: (value: SelectValue) => void;

  /** Render props children */
  children: (props: InfiniteRenderProps<T>) => ReactNode;
}

// ============================================================================
// Dependent Types
// ============================================================================

export interface DependencyConfig {
  /** Field name */
  name: string;

  /** Single or multiple dependencies */
  dependsOn?: string | string[];

  /** Called when dependency changes - return new value or undefined to reset */
  onDependencyChange?: (params: DependencyChangeParams) => SelectValue | void;
}

export interface DependencyChangeParams {
  /** Current field value */
  currentValue: SelectValue;

  /** All dependency values */
  dependencyValues: Record<string, SelectValue>;

  /** Previous dependency values */
  previousDependencyValues: Record<string, SelectValue>;

  /** Check if specific dependency changed */
  hasChanged: (dependencyName: string) => boolean;
}

/** Props passed to children via render props */
export interface DependentRenderProps {
  /** Current field value */
  value: SelectValue;

  /** All dependency values */
  dependencyValues: Record<string, SelectValue>;

  /** Whether dependencies are satisfied (all have values) */
  isDependencySatisfied: boolean;

  /** Whether field is disabled due to unsatisfied dependencies */
  isDisabledByDependency: boolean;

  /** Actions */
  onChange: (value: SelectValue) => void;
}

export interface DependentProps {
  /** Field name */
  name: string;

  /** Dependencies - single or array */
  dependsOn?: string | string[];

  /** Inline config (takes priority) */
  config?: Omit<DependencyConfig, 'name' | 'dependsOn'>;

  /** Config name to get from provider */
  configName?: string;

  /** Controlled value */
  value?: SelectValue;

  /** Change handler */
  onChange?: (value: SelectValue) => void;

  /** Disable when dependencies not satisfied */
  disableOnUnsatisfied?: boolean;

  /** Children - render props or ReactNode */
  children: ((props: DependentRenderProps) => ReactNode) | ReactNode;
}

// ============================================================================
// Provider Types
// ============================================================================

export interface SmartSelectProviderConfig {
  /** Infinite configs by name */
  infiniteConfigs?: Record<string, InfiniteConfig<any>>;

  /** Dependency configs by name */
  dependencyConfigs?: Record<string, DependencyConfig>;
}

export interface SmartSelectProviderProps {
  /** Provider-level configs */
  config?: SmartSelectProviderConfig;

  /** Form adapter for syncing values */
  adapter?: FormAdapter;

  /** Initial values */
  initialValues?: Record<string, SelectValue>;

  /** Controlled values */
  values?: Record<string, SelectValue>;

  /** Change handler */
  onValuesChange?: (values: Record<string, SelectValue>) => void;

  children: ReactNode;
}

// ============================================================================
// Form Adapter
// ============================================================================

export interface FormAdapter {
  /** Set single field value */
  setFieldValue: (name: string, value: SelectValue) => void;

  /** Set multiple field values */
  setFieldsValue?: (values: Record<string, SelectValue>) => void;

  /** Get single field value */
  getFieldValue?: (name: string) => SelectValue;

  /** Get all field values */
  getFieldsValue?: () => Record<string, SelectValue>;
}

// ============================================================================
// Context Types
// ============================================================================

export interface SmartSelectContextValue {
  /** Get value for a field */
  getValue: (name: string) => SelectValue;

  /** Set value for a field */
  setValue: (name: string, value: SelectValue) => void;

  /** Get all values */
  getValues: () => Record<string, SelectValue>;

  /** Get infinite config by name */
  getInfiniteConfig: <T extends BaseItem>(
    name: string,
  ) => InfiniteConfig<T> | undefined;

  /** Get dependency config by name */
  getDependencyConfig: (name: string) => DependencyConfig | undefined;

  /** Subscribe to field changes */
  subscribeToField: (name: string, callback: () => void) => () => void;

  /** Subscribe to multiple fields */
  subscribeToFields: (names: string[], callback: () => void) => () => void;
}
