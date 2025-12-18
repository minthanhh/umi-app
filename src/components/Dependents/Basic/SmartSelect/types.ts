/**
 * SmartSelect - Compound Component Types
 *
 * Types cho SmartSelect compound component pattern.
 * Cho phép sử dụng Dependent và Infinite wrappers độc lập hoặc kết hợp.
 *
 * @example Standalone Dependent
 * ```tsx
 * <SmartSelect.Dependent name="city" dependsOn="province">
 *   <Select />
 * </SmartSelect.Dependent>
 * ```
 *
 * @example Standalone Infinite
 * ```tsx
 * <SmartSelect.Infinite queryKey="users" fetchList={fetchUsers}>
 *   <Select />
 * </SmartSelect.Infinite>
 * ```
 *
 * @example Combined
 * ```tsx
 * <SmartSelect.Dependent name="city" dependsOn="province">
 *   <SmartSelect.Infinite queryKey="cities" fetchList={fetchCities}>
 *     <Select />
 *   </SmartSelect.Infinite>
 * </SmartSelect.Dependent>
 * ```
 */

import type { ReactElement, ReactNode } from 'react';

import type { FormattedSelectOption, SelectOption } from '../types';
import type {
  BaseItem,
  FetchRequest,
  FetchResponse,
  InfiniteSelectOption,
  SelectValue,
  UseInfiniteSelectResult,
} from '../InfiniteSelect/types';

// ============================================================================
// DEPENDENT WRAPPER TYPES
// ============================================================================

/**
 * Props được inject vào children của DependentWrapper
 */
export interface DependentInjectedProps {
  /** Giá trị hiện tại của field */
  value: unknown;

  /** Handler thay đổi giá trị */
  onChange: (value: unknown) => void;

  /** Có bị disable do parent chưa có value không */
  disabled?: boolean;

  /** Giá trị của parent field (để fetch options phụ thuộc) */
  parentValue?: unknown;

  /** Options đã được filter theo parent value */
  options?: FormattedSelectOption[];

  /** Đang loading options không */
  loading?: boolean;
}

/**
 * Props cho DependentWrapper component
 */
export interface DependentWrapperProps {
  /** Tên field (phải khớp với config trong Provider) */
  name: string;

  /** Label hiển thị */
  label?: ReactNode;

  /** Override disabled state */
  disabled?: boolean;

  /**
   * External options (override config options).
   * Sử dụng khi fetch options bằng React Query.
   */
  options?: SelectOption[];

  /**
   * External loading state (override store loading).
   * Sử dụng khi control loading state bên ngoài.
   */
  loading?: boolean;

  /**
   * Children - có thể là:
   * - ReactElement: sẽ được clone và inject props
   * - Render function: nhận props và return ReactNode
   */
  children: ReactElement | ((props: DependentInjectedProps) => ReactNode);
}

// ============================================================================
// INFINITE WRAPPER TYPES
// ============================================================================

/**
 * Props được inject vào children của InfiniteWrapper
 */
export interface InfiniteInjectedProps<T extends BaseItem = BaseItem> {
  /** Giá trị hiện tại */
  value: SelectValue;

  /** Handler thay đổi giá trị */
  onChange: (value: SelectValue) => void;

  /** Options đã format cho Select */
  options: Array<{ label: string; value: string | number }>;

  /** Raw options với item data */
  rawOptions: InfiniteSelectOption<T>[];

  /** Items gốc từ API */
  items: T[];

  /** Các items đã được chọn (full data) */
  selectedItems: T[];

  /** Đang loading lần đầu */
  loading: boolean;

  /** Đang hydrate selected values */
  isHydrating: boolean;

  /** Đang fetch thêm trang */
  isFetchingMore: boolean;

  /** Còn trang tiếp theo */
  hasNextPage: boolean;

  /** Dropdown đang mở */
  isOpen: boolean;

  /** Error nếu có */
  error: Error | null;

  /** Handler khi dropdown mở/đóng */
  onOpenChange: (open: boolean) => void;

  /** Handler scroll (trigger load more) */
  onScroll: (e: React.UIEvent<HTMLElement>) => void;

  /** Handler search */
  onSearch: (value: string) => void;

  /** Fetch trang tiếp theo */
  fetchNextPage: () => void;

  /** Disabled state (từ parent hoặc props) */
  disabled?: boolean;

  /** Parent value (được inject từ DependentWrapper nếu có) */
  parentValue?: unknown;
}

/**
 * Props cho InfiniteWrapper component
 */
export interface InfiniteWrapperProps<T extends BaseItem = BaseItem> {
  /** Unique query key cho React Query */
  queryKey: string;

  /** Hàm fetch list options */
  fetchList: (request: FetchRequest) => Promise<FetchResponse<T>>;

  /** Optional: fetch by IDs cho hydration */
  fetchByIds?: (
    ids: Array<string | number>,
    parentValue?: unknown,
  ) => Promise<T[]>;

  /** Số item mỗi trang (mặc định: 20) */
  pageSize?: number;

  /** Fetch strategy: 'eager' | 'lazy' (mặc định: 'lazy') */
  fetchStrategy?: 'eager' | 'lazy';

  /** Stale time cho React Query (ms) */
  staleTime?: number;

  /** Hàm lấy ID từ item */
  getItemId?: (item: T) => string | number;

  /** Hàm lấy label từ item */
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

  /**
   * Giá trị cha (sử dụng khi không wrap trong DependentWrapper).
   * Nếu wrap trong DependentWrapper, sẽ tự động lấy từ context.
   */
  parentValue?: unknown;

  /** Controlled value (override từ DependentWrapper nếu có) */
  value?: SelectValue;

  /** onChange handler (override từ DependentWrapper nếu có) */
  onChange?: (value: SelectValue) => void;

  /** Disabled state */
  disabled?: boolean;

  /** Enable/disable query */
  enabled?: boolean;

  /**
   * Children - có thể là:
   * - ReactElement: sẽ được clone và inject props
   * - Render function: nhận props và return ReactNode
   */
  children: ReactElement | ((props: InfiniteInjectedProps<T>) => ReactNode);
}

// ============================================================================
// CONTEXT TYPES (for nested wrappers)
// ============================================================================

/**
 * Context value được truyền từ DependentWrapper sang InfiniteWrapper
 */
export interface DependentContextValue {
  /** Field name */
  name: string;

  /** Giá trị của field */
  value: unknown;

  /**
   * Parent value.
   * - Single dependency: value of that parent field
   * - Multiple dependencies: object { [fieldName]: value }
   */
  parentValue: unknown;

  /**
   * Object containing all parent values.
   * Only populated when dependsOn is an array.
   */
  parentValues?: Record<string, unknown>;

  /** onChange handler */
  onChange: (value: unknown) => void;

  /** Disabled by parent */
  isDisabledByParent: boolean;

  /** Loading state */
  isLoading: boolean;

  /** Whether this field has a parent dependency (dependsOn config) */
  hasDependency: boolean;
}

// ============================================================================
// RE-EXPORTS
// ============================================================================

export type {
  BaseItem,
  FetchRequest,
  FetchResponse,
  InfiniteSelectOption,
  SelectValue,
  UseInfiniteSelectResult,
};