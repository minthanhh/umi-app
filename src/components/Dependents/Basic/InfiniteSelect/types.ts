/**
 * InfiniteSelect - Type Definitions
 *
 * Types cho component InfiniteSelect với khả năng:
 * - Infinite scroll / pagination sử dụng React Query
 * - Có thể dùng độc lập hoặc kết hợp với DependentField
 * - Hỗ trợ nhiều UI library khác nhau (Ant Design, MUI, etc.)
 * - Hydration cho selected values
 */

import type { SelectProps } from 'antd';

// ============================================================================
// BASE TYPES
// ============================================================================

/**
 * Base item type - các item phải có id
 */
export interface BaseItem {
  id: string | number;
  [key: string]: unknown;
}

/**
 * Option cho Select component
 */
export interface InfiniteSelectOption<T extends BaseItem = BaseItem> {
  label: string;
  value: string | number;
  item: T;
  disabled?: boolean;
  /** Parent value(s) that this option belongs to (for cascade delete) */
  parentValue?: unknown;
}

/**
 * Value type cho Select (single hoặc multiple)
 */
export type SelectValue =
  | string
  | number
  | Array<string | number>
  | undefined
  | null;

// ============================================================================
// FETCH TYPES
// ============================================================================

/**
 * Request params cho hàm fetch
 */
export interface FetchRequest {
  /** Trang hiện tại (bắt đầu từ 1) */
  current: number;

  /** Số item mỗi trang */
  pageSize: number;

  /** Giá trị cha (cho dependent field) */
  parentValue?: unknown;

  /** Từ khóa tìm kiếm */
  search?: string;

  /** Specific IDs để fetch (cho hydration) */
  ids?: Array<string | number>;
}

/**
 * Response từ hàm fetch
 */
export interface FetchResponse<T> {
  data: T[];
  total?: number;
  hasMore?: boolean;
}

// ============================================================================
// CONFIG TYPES
// ============================================================================

/**
 * Config cho Infinite Select
 */
export interface InfiniteSelectConfig<T extends BaseItem = BaseItem> {
  /** Unique query key cho React Query caching */
  queryKey: string;

  /** Hàm fetch list options */
  fetchList: (request: FetchRequest) => Promise<FetchResponse<T>>;

  /** Optional: fetch specific items by IDs (cho hydration) */
  fetchByIds?: (
    ids: Array<string | number>,
    parentValue?: unknown,
  ) => Promise<T[]>;

  /** Số item mỗi trang (mặc định: 20) */
  pageSize?: number;

  /**
   * Fetch strategy:
   * - 'eager': fetch ngay khi mount
   * - 'lazy': fetch khi dropdown mở (mặc định)
   */
  fetchStrategy?: 'eager' | 'lazy';

  /** Stale time cho React Query (ms) */
  staleTime?: number;

  /** Hàm lấy ID từ item (mặc định: item.id) */
  getItemId?: (item: T) => string | number;

  /** Hàm lấy label từ item (mặc định: item.name hoặc item.id) */
  getItemLabel?: (item: T) => string;

  /**
   * Hàm lấy parent value từ item (cho cascade delete chính xác).
   * Nếu không được cung cấp, sẽ dùng parentValue từ request.
   *
   * @example For projects with multiple members:
   * ```ts
   * getItemParentValue: (project) => project.members?.map(m => m.userId)
   * ```
   */
  getItemParentValue?: (item: T) => unknown;
}

// ============================================================================
// HOOK TYPES
// ============================================================================

/**
 * Options cho useInfiniteSelect hook
 */
export interface UseInfiniteSelectOptions<T extends BaseItem = BaseItem>
  extends InfiniteSelectConfig<T> {
  /** Giá trị cha (cho dependent field) */
  parentValue?: unknown;

  /** Giá trị đã chọn (controlled) */
  value?: SelectValue;

  /** Callback khi giá trị thay đổi */
  onChange?: (value: SelectValue) => void;

  /** Có enable query không (mặc định: true) */
  enabled?: boolean;
}

/**
 * Kết quả trả về từ useInfiniteSelect hook
 */
export interface UseInfiniteSelectResult<T extends BaseItem = BaseItem> {
  /** Danh sách options đã format */
  options: InfiniteSelectOption<T>[];

  /** Danh sách items gốc */
  items: T[];

  /** Các items đã được chọn (với đầy đủ data) */
  selectedItems: T[];

  /** Giá trị hiện tại */
  value: SelectValue;

  /** Đang loading lần đầu */
  isLoading: boolean;

  /** Đang hydrate selected values */
  isHydrating: boolean;

  /** Đang fetch thêm (infinite scroll) */
  isFetchingMore: boolean;

  /** Còn trang tiếp theo không */
  hasNextPage: boolean;

  /** Dropdown đang mở không */
  isOpen: boolean;

  /** Error nếu có */
  error: Error | null;

  /** Handler khi value thay đổi */
  onChange: (value: SelectValue) => void;

  /** Handler khi dropdown open/close */
  onOpenChange: (open: boolean) => void;

  /** Handler cho popup scroll (để trigger load more) */
  onScroll: (e: React.UIEvent<HTMLElement>) => void;

  /** Handler cho search (với debounce) */
  onSearch: (value: string) => void;

  /** Fetch trang tiếp theo manually */
  fetchNextPage: () => void;

  /** Reset và refetch */
  reset: () => void;
}

// ============================================================================
// COMPONENT PROPS
// ============================================================================

/**
 * Props cho InfiniteSelect component (standalone với Ant Design)
 */
export interface InfiniteSelectProps<T extends BaseItem = BaseItem>
  extends Omit<
      SelectProps,
      'options' | 'loading' | 'onPopupScroll' | 'onSearch' | 'value' | 'onChange'
    >,
    Omit<UseInfiniteSelectOptions<T>, 'enabled'> {
  /** Override disabled state */
  disabled?: boolean;

  /** Hiển thị loading indicator khi fetch more */
  showLoadingMore?: boolean;

  /** Custom component khi loading more */
  loadingMoreRender?: React.ReactNode;

  /** Callback khi có error */
  onError?: (error: Error) => void;
}

/**
 * Props cho InfiniteDependentSelectField (tích hợp với DependentField)
 */
export interface InfiniteDependentSelectFieldProps<
  T extends BaseItem = BaseItem,
> extends Omit<
    InfiniteSelectProps<T>,
    'value' | 'onChange' | 'parentValue' | 'queryKey'
  > {
  /** Field name (phải khớp với config trong DependentSelectProvider) */
  name: string;

  /** Query key prefix (sẽ append fieldName) */
  queryKeyPrefix?: string;
}

// ============================================================================
// RENDER PROPS TYPES
// ============================================================================

/**
 * Props truyền cho render function
 */
export interface InfiniteSelectRenderProps<T extends BaseItem = BaseItem>
  extends UseInfiniteSelectResult<T> {
  /** Options đã format cho Ant Design Select */
  formattedOptions: Array<{ label: string; value: string | number }>;
}

/**
 * Props cho InfiniteSelectWrapper (render props pattern)
 */
export interface InfiniteSelectWrapperProps<T extends BaseItem = BaseItem>
  extends UseInfiniteSelectOptions<T> {
  /** Render function */
  children: (props: InfiniteSelectRenderProps<T>) => React.ReactNode;
}