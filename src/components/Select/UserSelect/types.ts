// ============================================================================
// Domain Types
// ============================================================================

export interface User {
  id: string | number;
  name: string;
  email: string;
  avatar?: string;
}

export interface PrefilledUser extends User {
  type: 'prefilled';
}

// ============================================================================
// Hook Types
// ============================================================================

export interface NormalizedInput {
  selectedIds: Array<string | number>;
  prefilledItems: PrefilledUser[];
}

export interface UserDataSource {
  listData: User[];
  isInitialLoading: boolean;
  isFetchingMore: boolean;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  hydratedData: User[];
  isHydrating: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  nextId?: number;
}

// ============================================================================
// Component Props Types
// ============================================================================

export type FetchStrategy = 'eager' | 'lazy';

export type UserSelectValue =
  | Array<string | number | User>
  | string
  | number
  | User
  | null
  | undefined;

export interface UserSelectProps {
  fetchStrategy?: FetchStrategy;
  value?: UserSelectValue;
  onChange?: (value: Array<string | number>) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
}

export interface UserDropdownItemProps {
  item: User;
  isPinned?: boolean;
}

export interface UserSelectedItemProps {
  item: User;
  isPinned?: boolean;
}

export interface CustomTagRenderProps {
  label: React.ReactNode;
  value: string | number;
  closable: boolean;
  onClose: () => void;
  isHydrating: boolean;
}

// ============================================================================
// API Types
// ============================================================================

export interface UserListRequest {
  current: number;
  pageSize: number;
  ids?: Array<string | number>;
  sorter?: {
    name: 'asc' | 'desc';
  };
}

export interface UserListResponse {
  data: User[];
  total?: number;
}

// ============================================================================
// Select Option Types
// ============================================================================

export interface UserSelectOption {
  label: React.ReactNode;
  value: string | number;
  title: string;
  labelSelected: React.ReactNode;
}
