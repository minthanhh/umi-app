import {
  QueryClient,
  QueryClientProvider,
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { Alert, Avatar, Button, Card, Radio, Select, Spin, Tag } from 'antd';
import { Suspense, useDeferredValue, useMemo, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

// ==========================================
// 1. API SERVICE LAYER
// ==========================================

const ApiService = {
  fetchPinnedItems: async () => {
    // Giả lập network delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const response = await fetch(
      'https://jsonplaceholder.typicode.com/comments?id=1&id=5',
    );
    if (!response.ok) throw new Error('Failed to fetch pinned items');
    const data = await response.json();
    return data.map((item) => ({ ...item, type: 'pinned' }));
  },

  fetchPagedItems: async ({ pageParam = 1 }) => {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const LIMIT = 20;
    const response = await fetch(
      `https://jsonplaceholder.typicode.com/comments?_page=${pageParam}&_limit=${LIMIT}`,
    );
    if (!response.ok) throw new Error('Failed to fetch list items');
    const data = await response.json();
    return {
      data: data.map((item) => ({ ...item, type: 'normal' })),
      nextId: data.length < LIMIT ? undefined : pageParam + 1,
    };
  },

  fetchUsersByIds: async (ids) => {
    if (!ids || ids.length === 0) return [];
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const queryString = ids.map((id) => `id=${id}`).join('&');
    const response = await fetch(
      `https://jsonplaceholder.typicode.com/comments?${queryString}`,
    );
    if (!response.ok) throw new Error('Failed to hydrate users');
    const data = await response.json();
    return data.map((item) => ({ ...item, type: 'hydrated' }));
  },
};

// ==========================================
// 2. LOGIC LAYER (React 19 Hooks)
// ==========================================

const useNormalizedInput = (value) => {
  return useMemo(() => {
    if (!value) return { selectedIds: [], prefilledItems: [] };
    const valuesArray = Array.isArray(value) ? value : [value];
    const ids = [];
    const items = [];

    valuesArray.forEach((v) => {
      if (typeof v === 'object' && v !== null) {
        items.push({ ...v, type: 'prefilled' });
        ids.push(v.id);
      } else {
        ids.push(v);
      }
    });
    return { selectedIds: ids, prefilledItems: items };
  }, [value]);
};

// Hook này sử dụng useSuspenseQuery (React 19 Pattern)
// Component sẽ "Suspend" (ngừng render và hiện fallback) cho đến khi data Hydration & Pinned sẵn sàng.
const useSuspenseUserDataSource = (selectedIds, prefilledItems) => {
  // 1. Pinned (Critical Data -> Suspend)
  const pinnedQuery = useSuspenseQuery({
    queryKey: ['pinned-comments'],
    queryFn: ApiService.fetchPinnedItems,
    staleTime: 1000 * 60 * 5,
  });

  // 2. List (Lazy Load -> Infinite Query bình thường)
  const listQuery = useInfiniteQuery({
    queryKey: ['list-comments'],
    queryFn: ApiService.fetchPagedItems,
    getNextPageParam: (lastPage) => lastPage.nextId,
    initialPageParam: 1,
    placeholderData: keepPreviousData, // UX: Giữ data cũ khi fetch trang mới
  });

  // 3. Hydration
  const idsToFetch = useMemo(() => {
    const prefilledIds = new Set(prefilledItems.map((i) => i.id));
    return selectedIds.filter((id) => !prefilledIds.has(id));
  }, [selectedIds, prefilledItems]);

  // Chúng ta dùng useQuery thường ở đây nhưng với trick:
  // Nếu muốn Suspend cả Hydration, ta dùng useSuspenseQuery.
  // Tuy nhiên, hydration thường conditional. Ta sẽ dùng useQuery và handle loading nhẹ
  // hoặc dùng useSuspenseQuery với skipToken (advanced).
  // Ở đây tôi dùng useQuery để tránh block nếu hydration fail.
  const hydrationQuery = useQuery({
    queryKey: ['hydrated-users', idsToFetch],
    queryFn: () => ApiService.fetchUsersByIds(idsToFetch),
    enabled: idsToFetch.length > 0,
    // staleTime: 1000 * 60 * 5,
  });

  return {
    pinnedData: pinnedQuery.data, // Luôn có data, không cần check undefined
    listData: listQuery.data?.pages.flatMap((page) => page.data) || [],
    hydratedData: hydrationQuery.data || [],
    isFetchingList: listQuery.isFetchingNextPage,
    fetchNextPage: listQuery.fetchNextPage,
    hasNextPage: listQuery.hasNextPage,
    // Hydration loading state (optional use)
    isHydrating: hydrationQuery.isLoading,
  };
};

const useOptionBuilder = (dataSources, prefilledItems, searchValue) => {
  const { pinnedData, listData, hydratedData } = dataSources;

  // React 19 Optimization: useDeferredValue
  // Khi user gõ search, `searchValue` thay đổi ngay lập tức để update UI input.
  // Nhưng `deferredSearch` sẽ delay một chút, giúp logic filter nặng bên dưới không làm đơ UI gõ phím.
  const deferredSearch = useDeferredValue(searchValue);

  return useMemo(() => {
    const pinnedIds = new Set(pinnedData.map((i) => i.id));
    const currentListIds = new Set(
      [...pinnedData, ...listData].map((i) => i.id),
    );

    // Helper filter function
    const matchesSearch = (item) => {
      if (!deferredSearch) return true;
      const text = `${item.email} ${item.name}`.toLowerCase();
      return text.includes(deferredSearch.toLowerCase());
    };

    // 1. Pinned
    const pinnedOptions = pinnedData
      .filter(matchesSearch)
      .map((item) => UserOptionFactory.create(item, true));

    // 2. List
    const listOptions = listData
      .filter((item) => !pinnedIds.has(item.id))
      .filter(matchesSearch)
      .map((item) => UserOptionFactory.create(item, false));

    // 3. Hidden Selected
    const hiddenSelectedOptions = [...prefilledItems, ...hydratedData]
      .filter((item) => !currentListIds.has(item.id))
      // Vẫn hiển thị item đang chọn kể cả khi nó không match search (UX Rule)
      .map((item) => UserOptionFactory.create(item, false));

    const result = [];

    if (hiddenSelectedOptions.length > 0) {
      result.push({
        label: (
          <GroupLabel
            text="ĐANG CHỌN (TỪ TRANG KHÁC)"
            color="text-green-600 bg-green-50"
          />
        ),
        options: hiddenSelectedOptions,
      });
    }

    if (pinnedOptions.length > 0) {
      result.push({
        label: (
          <GroupLabel
            text="QUAN TRỌNG (PINNED)"
            color="text-blue-600 bg-blue-50"
          />
        ),
        options: pinnedOptions,
      });
    }

    if (listOptions.length > 0) {
      result.push({
        label: (
          <GroupLabel text="DANH SÁCH" color="text-gray-500 bg-gray-100" />
        ),
        options: listOptions,
      });
    }

    return result;
  }, [pinnedData, listData, hydratedData, prefilledItems, deferredSearch]);
};

// ==========================================
// 3. PRESENTATION LAYER
// ==========================================

const UserOptionFactory = {
  create: (item, isPinned) => ({
    value: item.id,
    key: `${item.type}-${item.id}`,
    label: <UserDropdownItem item={item} isPinned={isPinned} />,
    labelSelected: <UserSelectedItem item={item} isPinned={isPinned} />,
    // Antd dùng cái này để filter mặc định, nhưng ta đã handle filter ngoài
    // vẫn để lại cho accessibility
    searchText: `${item.email} ${item.name}`,
  }),
};

const UserDropdownItem = ({ item, isPinned }) => (
  <div className="flex items-center gap-3 py-2">
    <Avatar
      shape="square"
      size="large"
      src={`https://i.pravatar.cc/150?u=${item.id}`}
      className={isPinned ? 'border-2 border-blue-500' : ''}
    />
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex justify-between items-center">
        <span
          className={`font-bold truncate w-3/4 ${isPinned ? 'text-blue-700' : 'text-gray-700'}`}
        >
          {item.email}
        </span>
        {isPinned && (
          <Tag color="blue" className="mr-0">
            PIN
          </Tag>
        )}
      </div>
      <span className="text-gray-500 text-xs truncate">{item.name}</span>
    </div>
  </div>
);

const UserSelectedItem = ({ item, isPinned }) => (
  <div className="flex items-center gap-2 h-full w-full -ml-1">
    <Avatar
      size="small"
      src={`https://i.pravatar.cc/150?u=${item.id}`}
      className={isPinned ? 'border border-blue-500' : ''}
    />
    <div className="flex flex-col justify-center h-full leading-tight">
      <span
        className={`text-sm font-semibold truncate ${isPinned ? 'text-blue-700' : 'text-gray-800'}`}
      >
        {item.email}
      </span>
    </div>
  </div>
);

const GroupLabel = ({ text, color }) => (
  <span className={`text-xs font-bold px-2 py-1 rounded ${color}`}>{text}</span>
);

// ==========================================
// 4. MAIN COMPONENT (Clean & Suspense Ready)
// ==========================================

const AsyncSelectContent = ({ value, onChange }) => {
  // State search nằm ở đây để useDeferredValue hoạt động hiệu quả
  const [searchValue, setSearchValue] = useState('');

  const { selectedIds, prefilledItems } = useNormalizedInput(value);

  // Hook này sẽ THROW promise nếu data chưa về -> Trigger Suspense Fallback
  const dataSources = useSuspenseUserDataSource(selectedIds, prefilledItems);

  const options = useOptionBuilder(dataSources, prefilledItems, searchValue);

  const onPopupScroll = (e) => {
    const { target } = e;
    if (target.scrollTop + target.offsetHeight >= target.scrollHeight - 10) {
      if (dataSources.hasNextPage && !dataSources.isFetchingList) {
        dataSources.fetchNextPage();
      }
    }
  };

  return (
    <Select
      mode="multiple"
      style={{ width: '100%', minHeight: 60 }}
      placeholder="Chọn user..."
      value={selectedIds}
      onChange={onChange}
      options={options}
      onPopupScroll={onPopupScroll}
      listHeight={350}
      showSearch
      onSearch={setSearchValue} // Control search state
      filterOption={false} // Tắt default filter của antd để dùng logic useDeferredValue
      optionLabelProp="labelSelected"
      className="custom-select-item-center"
      dropdownRender={(menu) => (
        <>
          {menu}
          {dataSources.isFetchingList && (
            <div className="p-2 text-center text-blue-500 bg-blue-50 flex items-center justify-center gap-2">
              <Spin size="small" />{' '}
              <span className="text-xs">Đang tải thêm...</span>
            </div>
          )}
        </>
      )}
    />
  );
};

// Fallback UI khi đang Suspense (Skeleton Loading)
const SelectSkeleton = () => (
  <div className="w-full h-[60px] bg-gray-100 animate-pulse rounded border border-gray-200 flex items-center px-3">
    <div className="flex gap-2">
      <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
      <div className="w-24 h-4 bg-gray-300 rounded mt-2"></div>
    </div>
  </div>
);

// Error UI khi fetch fail
const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <Alert
    message="Lỗi tải dữ liệu"
    description={
      <div className="flex flex-col gap-2">
        <span>{error.message}</span>
        <Button size="small" type="primary" danger onClick={resetErrorBoundary}>
          Thử lại
        </Button>
      </div>
    }
    type="error"
    showIcon
  />
);

// Wrapper Component để chứa Suspense & ErrorBoundary
const AsyncSelectWithPin = (props) => {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => window.location.reload()}
    >
      <Suspense fallback={<SelectSkeleton />}>
        <AsyncSelectContent {...props} />
      </Suspense>
    </ErrorBoundary>
  );
};

// ==========================================
// 5. DEMO & WRAPPER
// ==========================================

const DemoPage = () => {
  const [caseType, setCaseType] = useState('ids');
  const [selectedValues, setSelectedValues] = useState([]);

  const dataCaseIDs = [100, 101];
  const dataCaseObjects = [
    {
      id: 102,
      name: 'User Full Info From Prev Screen',
      email: 'preloaded@example.com',
    },
    { id: 103, name: 'Another Preloaded User', email: 'instant@render.com' },
  ];

  const currentData = caseType === 'ids' ? dataCaseIDs : dataCaseObjects;

  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-6">
      <Card
        title={
          <span className="text-blue-600">
            React 19 Architecture: Suspense & DeferredValue
          </span>
        }
        className="shadow-lg"
      >
        <div className="mb-4">
          <span className="mr-4 font-semibold">Chọn trường hợp:</span>
          <Radio.Group
            value={caseType}
            onChange={(e) => {
              setCaseType(e.target.value);
              setSelectedValues(
                e.target.value === 'ids' ? dataCaseIDs : dataCaseObjects,
              );
            }}
          >
            <Radio.Button value="ids">Case 1: IDs (Gây Suspense)</Radio.Button>
            <Radio.Button value="objects">
              Case 2: Objects (Instant)
            </Radio.Button>
          </Radio.Group>
        </div>

        <div className="p-4 bg-gray-50 rounded mb-4 text-xs font-mono border border-gray-200 overflow-auto">
          <strong>Props:</strong> {JSON.stringify(currentData)}
        </div>

        <div className="relative min-h-[80px]">
          {/* Component chính được gọi ở đây */}
          <AsyncSelectWithPin
            value={selectedValues}
            onChange={(newVal) => setSelectedValues(newVal)}
          />
        </div>

        <div className="mt-4 text-xs text-gray-500">
          <p>
            ✨ <strong>Highlights:</strong>
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Dùng <code>useSuspenseQuery</code>: Không cần check{' '}
              <code>isLoading</code> trong code.
            </li>
            <li>
              Wrap bởi <code>&lt;Suspense&gt;</code>: Hiển thị Skeleton tự động
              khi chờ Hydration/Pinned.
            </li>
            <li>
              Dùng <code>useDeferredValue</code>: Gõ search không bị lag dù list
              option lớn.
            </li>
            <li>
              <code>ErrorBoundary</code>: Catch lỗi API network failure.
            </li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      // Suspense cần retry thấp để user không chờ quá lâu trước khi hiện lỗi
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <DemoPage />
      </div>
    </QueryClientProvider>
  );
}
