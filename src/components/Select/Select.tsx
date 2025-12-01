import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import type { SelectProps } from 'antd';
import { Select, Spin, Tag } from 'antd';
import React, { useMemo } from 'react';

// ============================================================================
// 1. Helpers & API
// ============================================================================

const PAGE_SIZE = 20;

interface PokemonData {
  name: string;
  url: string;
  id: number;
}

// Giả lập ID từ URL vì PokeAPI trả về URL
const extractId = (url: string) => {
  const parts = url.split('/').filter(Boolean);
  return Number(parts[parts.length - 1]);
};

// API 1: Fetch List (Infinite Scroll)
const fetchPokemons = async ({ pageParam = 0 }) => {
  const offset = pageParam * PAGE_SIZE;
  const res = await fetch(
    `https://pokeapi.co/api/v2/pokemon?limit=${PAGE_SIZE}&offset=${offset}`,
  );
  const data = await res.json();
  return {
    data: data.results.map((p: any) => ({
      ...p,
      id: extractId(p.url),
    })),
    nextOffset: data.next ? pageParam + 1 : null,
  };
};

// API 2: Fetch Detail by ID (Dùng cho Hydration)
// Nếu Backend hỗ trợ filter theo mảng ID (VD: /api/pokemon?ids=1,2,3) thì tốt hơn.
// Ở đây demo trường hợp tệ nhất: phải gọi loop từng API.
const fetchPokemonById = async (id: number | string): Promise<PokemonData> => {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
  const data = await res.json();
  return {
    name: data.name,
    url: `https://pokeapi.co/api/v2/pokemon/${id}/`,
    id: data.id,
  };
};

// ============================================================================
// 2. Component
// ============================================================================

// Value luôn là mảng IDs (number hoặc string)
interface PokemonSelectProps extends Omit<SelectProps<number[]>, 'options'> {
  value?: number[];
}

const PokemonSelect: React.FC<PokemonSelectProps> = ({
  value = [],
  ...props
}) => {
  // --- QUERY 1: Main List (Infinite) ---
  const listQuery = useInfiniteQuery(['pokemons-list'], fetchPokemons, {
    getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
    staleTime: 1000 * 60 * 5,
  });

  // --- LOGIC HYDRATION ---
  // Lọc ra các ID đang có trong value nhưng CHƯA có trong listQuery
  // Để tránh fetch lại những cái đã hiển thị rồi.
  const idsToHydrate = useMemo(() => {
    if (!value || value.length === 0) return [];

    // Gom tất cả ID hiện có trong List
    const loadedIds = new Set(
      listQuery.data?.pages.flatMap((p) => p.data.map((d: any) => d.id)) || [],
    );

    // Chỉ fetch những ID chưa có trong loadedIds
    return value.filter((id) => !loadedIds.has(id));
  }, [value, listQuery.data]);

  // --- QUERY 2: Hydration (Fetch missing details) ---
  const hydrationQuery = useQuery(
    ['pokemons-hydrate', idsToHydrate], // Key phụ thuộc vào mảng ID thiếu
    async () => {
      // Dùng Promise.all để fetch song song các ID thiếu
      return Promise.all(idsToHydrate.map((id) => fetchPokemonById(id)));
    },
    {
      // Chỉ chạy khi có ID cần fetch
      enabled: idsToHydrate.length > 0,
      // Quan trọng: Giữ lại data cũ khi key thay đổi để không bị flicker
      keepPreviousData: true,
      staleTime: Infinity, // Data detail ít khi đổi, cache lâu
    },
  );

  // --- MERGE OPTIONS ---
  const combinedOptions = useMemo(() => {
    // 1. Data từ Infinite List
    const listOpts = listQuery.data?.pages.flatMap((p) => p.data) || [];

    // 2. Data từ Hydration (nếu có)
    const hydratedOpts = hydrationQuery.data || [];

    // 3. Merge và Deduplicate (Loại bỏ trùng)
    const uniqueMap = new Map();

    // Ưu tiên hydratedOpts trước (để đảm bảo value đã chọn luôn hiển thị đúng)
    [...hydratedOpts, ...listOpts].forEach((item) => {
      if (!uniqueMap.has(item.id)) {
        uniqueMap.set(item.id, {
          label: `#${item.id} - ${item.name}`, // Format Label hiển thị
          value: item.id,
        });
      }
    });

    return Array.from(uniqueMap.values());
  }, [listQuery.data, hydrationQuery.data]);

  const isLoading =
    listQuery.isLoading ||
    (hydrationQuery.isLoading && idsToHydrate.length > 0);

  return (
    <Select
      mode="multiple"
      placeholder="Select Pokemon by ID..."
      {...props}
      value={value}
      style={{ width: 400 }}
      options={combinedOptions}
      loading={isLoading}
      onPopupScroll={(e) => {
        // Logic scroll load more cũ...
        const target = e.target as HTMLDivElement;
        if (
          target.scrollTop + target.offsetHeight >=
          target.scrollHeight - 10
        ) {
          if (listQuery.hasNextPage && !listQuery.isFetchingNextPage)
            listQuery.fetchNextPage();
        }
      }}
      // Tùy chỉnh hiển thị loading state tốt hơn
      notFoundContent={isLoading ? <Spin size="small" /> : null}
      // (Optional) Render Tag tùy chỉnh để hiển thị đẹp hơn
      tagRender={(props) => {
        const { label, closable, onClose } = props;
        return (
          <Tag closable={closable} onClose={onClose} style={{ marginRight: 3 }}>
            {/* Nếu đang loading data của id này thì hiện "Loading..." */}
            {label || 'Loading...'}
          </Tag>
        );
      }}
    />
  );
};

export default PokemonSelect;
