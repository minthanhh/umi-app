import { keepPreviousData } from '@tanstack/react-query';
import { useInfiniteQuery, useQuery } from '@umijs/max';
import { useMemo, useState, useCallback } from 'react';
import { isEmpty } from 'lodash';

import type {
  NormalizedInput,
  UserDataSource,
  UserSelectValue,
  User,
  PrefilledUser,
  PaginatedResponse,
  UserListRequest,
  UserListResponse,
} from './types';

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_PAGE_SIZE = 10;
const QUERY_KEYS = {
  HYDRATED_USERS: 'hydrated-users',
  LIST_USERS: 'list-users',
} as const;

// ============================================================================
// API Service (Single Responsibility - handles API calls only)
// ============================================================================

const userApiService = {
  async fetchUsers(request: UserListRequest): Promise<UserListResponse> {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    return response.json();
  },
};

// ============================================================================
// useNormalizedInput Hook
// Responsibility: Normalize and parse the input value into a consistent format
// ============================================================================

export const useNormalizedInput = (value: UserSelectValue): NormalizedInput => {
  return useMemo(() => {
    if (isEmpty(value) || value === null || value === undefined) {
      return {
        selectedIds: [],
        prefilledItems: [],
      };
    }

    const valuesArray = Array.isArray(value) ? value : [value];
    const ids: Array<string | number> = [];
    const items: PrefilledUser[] = [];

    valuesArray.forEach((v) => {
      if (typeof v === 'object' && v !== null && 'id' in v) {
        items.push({ ...(v as User), type: 'prefilled' });
        ids.push((v as User).id);
      } else if (typeof v === 'string' || typeof v === 'number') {
        ids.push(v);
      }
    });

    return { selectedIds: ids, prefilledItems: items };
  }, [value]);
};

// ============================================================================
// useUserHydration Hook
// Responsibility: Fetch full user data for IDs that don't have prefilled data
// ============================================================================

interface UseUserHydrationOptions {
  selectedIds: Array<string | number>;
  prefilledItems: PrefilledUser[];
}

interface UseUserHydrationResult {
  hydratedData: User[];
  isHydrating: boolean;
}

export const useUserHydration = ({
  selectedIds,
  prefilledItems,
}: UseUserHydrationOptions): UseUserHydrationResult => {
  // Calculate IDs to hydrate only once on initial render
  const [idsToHydrate] = useState<Array<string | number>>(() => {
    const knownIds = new Set(prefilledItems.map((i) => i.id));
    return selectedIds.filter((id) => !knownIds.has(id));
  });

  const { data, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.HYDRATED_USERS, idsToHydrate],
    queryFn: async () => {
      const response = await userApiService.fetchUsers({
        current: 1,
        pageSize: DEFAULT_PAGE_SIZE,
        ids: idsToHydrate,
        sorter: { name: 'asc' },
      });
      return response.data;
    },
    enabled: idsToHydrate.length > 0,
    staleTime: Infinity,
  });

  return {
    hydratedData: data ?? [],
    isHydrating: isLoading,
  };
};

// ============================================================================
// useUserList Hook
// Responsibility: Fetch paginated list of users with infinite scroll support
// ============================================================================

interface UseUserListOptions {
  enabled: boolean;
}

interface UseUserListResult {
  listData: User[];
  isInitialLoading: boolean;
  isFetchingMore: boolean;
  fetchNextPage: () => void;
  hasNextPage: boolean;
}

export const useUserList = ({
  enabled,
}: UseUserListOptions): UseUserListResult => {
  const query = useInfiniteQuery({
    queryKey: [QUERY_KEYS.LIST_USERS],
    queryFn: async ({ pageParam = 1 }): Promise<PaginatedResponse<User>> => {
      const response = await userApiService.fetchUsers({
        current: pageParam as number,
        pageSize: DEFAULT_PAGE_SIZE,
        sorter: { name: 'asc' },
      });
      return {
        data: response.data,
        nextId:
          response.data.length < DEFAULT_PAGE_SIZE ? undefined : (pageParam as number) + 1,
      };
    },
    getNextPageParam: (lastPage: PaginatedResponse<User>) => lastPage.nextId,
    initialPageParam: 1,
    placeholderData: keepPreviousData,
    enabled,
  });

  const listData = useMemo(() => {
    return query.data?.pages.flatMap((p) => p.data) ?? [];
  }, [query.data?.pages]);

  return {
    listData,
    isInitialLoading: query.isLoading,
    isFetchingMore: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage ?? false,
  };
};

// ============================================================================
// useUserDataSource Hook (Facade Pattern)
// Responsibility: Combine hydration and list data into a unified data source
// ============================================================================

interface UseUserDataSourceOptions {
  selectedIds: Array<string | number>;
  prefilledItems: PrefilledUser[];
  isListFetchEnabled: boolean;
}

export const useUserDataSource = ({
  selectedIds,
  prefilledItems,
  isListFetchEnabled,
}: UseUserDataSourceOptions): UserDataSource => {
  const hydration = useUserHydration({ selectedIds, prefilledItems });
  const list = useUserList({ enabled: isListFetchEnabled });

  return {
    listData: list.listData,
    isInitialLoading: list.isInitialLoading,
    isFetchingMore: list.isFetchingMore,
    fetchNextPage: list.fetchNextPage,
    hasNextPage: list.hasNextPage,
    hydratedData: hydration.hydratedData,
    isHydrating: hydration.isHydrating,
  };
};

// ============================================================================
// useDropdownState Hook
// Responsibility: Manage dropdown open/close state and lazy loading trigger
// ============================================================================

interface UseDropdownStateOptions {
  fetchStrategy: 'eager' | 'lazy';
}

interface UseDropdownStateResult {
  isDropdownOpen: boolean;
  isListFetchEnabled: boolean;
  handleOpenChange: (open: boolean) => void;
}

export const useDropdownState = ({
  fetchStrategy,
}: UseDropdownStateOptions): UseDropdownStateResult => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hasOpenedOnce, setHasOpenedOnce] = useState(false);

  const isListFetchEnabled =
    fetchStrategy === 'eager' ? true : isDropdownOpen || hasOpenedOnce;

  const handleOpenChange = useCallback((open: boolean) => {
    setIsDropdownOpen(open);
    if (open) {
      setHasOpenedOnce(true);
    }
  }, []);

  return {
    isDropdownOpen,
    isListFetchEnabled,
    handleOpenChange,
  };
};

// ============================================================================
// useMergedOptions Hook
// Responsibility: Merge and deduplicate user options from multiple sources
// ============================================================================

interface UseMergedOptionsOptions {
  prefilledItems: PrefilledUser[];
  hydratedData: User[];
  listData: User[];
}

export const useMergedOptions = ({
  prefilledItems,
  hydratedData,
  listData,
}: UseMergedOptionsOptions): User[] => {
  return useMemo(() => {
    const allItems = [...prefilledItems, ...hydratedData, ...listData];
    const uniqueMap = new Map<string | number, User>();

    allItems.forEach((item) => {
      uniqueMap.set(item.id, item);
    });

    return Array.from(uniqueMap.values());
  }, [prefilledItems, hydratedData, listData]);
};