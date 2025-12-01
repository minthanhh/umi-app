import { Select, Spin } from 'antd';
import type { SelectProps } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { InfiniteSelectConfig, SelectOption } from '../types';

// ============================================================================
// Types
// ============================================================================

interface InfiniteScrollSelectProps extends Omit<SelectProps, 'options' | 'onSearch'> {
  config: InfiniteSelectConfig;
}

// ============================================================================
// Utility Functions
// ============================================================================

const getNestedValue = (obj: unknown, path: string): unknown => {
  return path.split('.').reduce((acc: unknown, key: string) => {
    if (acc && typeof acc === 'object' && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
};

// ============================================================================
// Component
// ============================================================================

const InfiniteScrollSelect: React.FC<InfiniteScrollSelectProps> = ({
  config,
  value,
  onChange,
  placeholder = 'Search and select...',
  mode,
  allowClear = true,
  disabled,
  ...restProps
}) => {
  const {
    apiUrl,
    method = 'GET',
    searchParam = 'search',
    pageParam = 'page',
    pageSizeParam = 'pageSize',
    pageSize = 20,
    labelField,
    valueField,
    responseDataPath = 'data',
    responseTotalPath = 'total',
  } = config;

  const [options, setOptions] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch options from API
  const fetchOptions = useCallback(
    async (currentPage: number, search: string, append: boolean = false) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        let response: Response;

        if (method === 'POST') {
          const body: Record<string, unknown> = {
            [pageParam]: currentPage,
            [pageSizeParam]: pageSize,
          };
          if (search) {
            body[searchParam] = search;
          }
          response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });
        } else {
          const params = new URLSearchParams();
          params.set(pageParam, String(currentPage));
          params.set(pageSizeParam, String(pageSize));
          if (search) {
            params.set(searchParam, search);
          }
          response = await fetch(`${apiUrl}?${params.toString()}`);
        }

        const result = await response.json();

        const data = getNestedValue(result, responseDataPath) as Record<string, unknown>[];
        const total = getNestedValue(result, responseTotalPath) as number;

        const newOptions: SelectOption[] = (data || []).map((item) => ({
          label: String(item[labelField] || ''),
          value: item[valueField] as string | number,
        }));

        if (append) {
          setOptions((prev) => [...prev, ...newOptions]);
        } else {
          setOptions(newOptions);
        }

        setHasMore(currentPage * pageSize < (total || 0));
        setPage(currentPage);
      } catch (error) {
        console.error('Failed to fetch options:', error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [apiUrl, method, searchParam, pageParam, pageSizeParam, pageSize, labelField, valueField, responseDataPath, responseTotalPath],
  );

  // Initial fetch
  useEffect(() => {
    fetchOptions(1, searchText, false);
  }, [searchText]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle search with debounce
  const handleSearch = useCallback((value: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setSearchText(value);
      setPage(1);
    }, 300);
  }, []);

  // Handle scroll to load more
  const handlePopupScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.target as HTMLDivElement;
      const { scrollTop, scrollHeight, clientHeight } = target;

      // Load more when scrolled to 80% of the list
      if (scrollTop + clientHeight >= scrollHeight * 0.8) {
        if (hasMore && !loadingMore && !loading) {
          fetchOptions(page + 1, searchText, true);
        }
      }
    },
    [hasMore, loadingMore, loading, page, searchText, fetchOptions],
  );

  // Custom dropdown render with loading indicator
  const dropdownRender = useCallback(
    (menu: React.ReactElement) => (
      <>
        {menu}
        {loadingMore && (
          <div className="text-center py-2">
            <Spin size="small" />
          </div>
        )}
      </>
    ),
    [loadingMore],
  );

  return (
    <Select
      showSearch
      filterOption={false}
      onSearch={handleSearch}
      onPopupScroll={handlePopupScroll}
      dropdownRender={dropdownRender}
      loading={loading}
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      mode={mode}
      allowClear={allowClear}
      disabled={disabled}
      notFoundContent={loading ? <Spin size="small" /> : 'No results found'}
      {...restProps}
    />
  );
};

export default InfiniteScrollSelect;
