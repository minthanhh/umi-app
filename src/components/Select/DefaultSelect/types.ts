import type { ReactNode } from 'react';

// ============================================================================
// Generic Domain Types
// ============================================================================

export interface BaseItem {
  id: string | number;
  [key: string]: unknown;
}

export type PrefilledItem<T extends BaseItem> = T & {
  __prefilled: true;
};

// ============================================================================
// API Types
// ============================================================================

export interface FetchRequest {
  current: number;
  pageSize: number;
  ids?: Array<string | number>;
  search?: string;
}

export interface FetchResponse<T> {
  data: T[];
  total?: number;
  hasMore?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  nextPage?: number;
}

// ============================================================================
// Config Types
// ============================================================================

export type FetchStrategy = 'eager' | 'lazy';

export interface SelectWrapperConfig<T extends BaseItem> {
  /** Unique key for caching queries */
  queryKey: string;

  /** Function to fetch list of items */
  fetchList: (request: FetchRequest) => Promise<FetchResponse<T>>;

  /** Function to fetch items by IDs (for hydration) */
  fetchByIds?: (ids: Array<string | number>) => Promise<T[]>;

  /** Number of items per page */
  pageSize?: number;

  /** Fetch strategy: 'eager' fetches immediately, 'lazy' fetches on dropdown open */
  fetchStrategy?: FetchStrategy;

  /** Stale time for queries in ms */
  staleTime?: number;

  /** Get unique identifier from item */
  getItemId?: (item: T) => string | number;

  /** Get display label from item */
  getItemLabel?: (item: T) => string;
}

// ============================================================================
// Value Types
// ============================================================================

export type SelectValue<T extends BaseItem> =
  | Array<string | number | T>
  | string
  | number
  | T
  | null
  | undefined;

// ============================================================================
// Option Types (for rendering)
// ============================================================================

export interface SelectOption<T extends BaseItem> {
  value: string | number;
  label: string;
  item: T;
  disabled?: boolean;
}

// ============================================================================
// Context State Types
// ============================================================================

export interface SelectState<T extends BaseItem> {
  /** All available options (merged from all sources) */
  options: SelectOption<T>[];

  /** Currently selected IDs */
  selectedIds: Array<string | number>;

  /** Selected items with full data */
  selectedItems: T[];

  /** Raw items data */
  items: T[];

  /** Loading states */
  isLoading: boolean;
  isHydrating: boolean;
  isFetchingMore: boolean;

  /** Pagination */
  hasNextPage: boolean;

  /** Dropdown state */
  isOpen: boolean;

  /** Error state */
  error: Error | null;
}

export interface SelectActions {
  /** Handle value change */
  onChange: (ids: Array<string | number>) => void;

  /** Handle dropdown open/close */
  onOpenChange: (open: boolean) => void;

  /** Handle scroll for infinite loading */
  onScroll: (e: React.UIEvent<HTMLElement>) => void;

  /** Fetch next page manually */
  fetchNextPage: () => void;

  /** Refresh data */
  refresh: () => void;
}

export interface SelectContext<T extends BaseItem> {
  state: SelectState<T>;
  actions: SelectActions;
  config: SelectWrapperConfig<T>;
}

// ============================================================================
// Component Props Types
// ============================================================================

export interface SelectWrapperProps<T extends BaseItem> {
  /** Configuration for the select */
  config: SelectWrapperConfig<T>;

  /** Current value */
  value?: SelectValue<T>;

  /** Change handler */
  onChange?: (ids: Array<string | number>) => void;

  /** Children can be render prop or React node */
  children: ReactNode | ((context: SelectContext<T>) => ReactNode);

  /** Whether the select is disabled */
  disabled?: boolean;

  /** Placeholder text */
  placeholder?: string;
}

// ============================================================================
// Hook Return Types
// ============================================================================

export interface NormalizedInput<T extends BaseItem> {
  selectedIds: Array<string | number>;
  prefilledItems: T[];
}

export interface DataSourceResult<T extends BaseItem> {
  items: T[];
  listData: T[];
  hydratedData: T[];
  isLoading: boolean;
  isHydrating: boolean;
  isFetchingMore: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  error: Error | null;
}

export interface DropdownState {
  isOpen: boolean;
  isListFetchEnabled: boolean;
  handleOpenChange: (open: boolean) => void;
}