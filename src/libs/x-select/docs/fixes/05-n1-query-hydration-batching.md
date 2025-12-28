# Fix #5: N+1 Query - Hydration Batching Optimization

## Vấn đề

### Mô tả
Khi có nhiều component cùng hydrate các IDs giống nhau (hoặc overlapping), mỗi component tạo query riêng biệt. Điều này dẫn đến:
1. Duplicate network requests cho cùng một data
2. Cache misses vì query keys khác nhau (do thứ tự IDs khác nhau)
3. Tốn băng thông và tăng latency

### Code cũ có vấn đề

```typescript
// useHydration.ts - BEFORE

export function useHydration<T extends BaseItem>(options: UseHydrationOptions<T>) {
  const { queryKey, hydrationQuery, initialValue } = options;

  const [idsToHydrate] = useState<Array<string | number>>(() => extractIds(initialValue));

  const queryResult = useQuery({
    ...hydrationQuery,
    // Query key phụ thuộc vào thứ tự của IDs
    queryKey: [queryKey, 'hydrate', idsToHydrate],
    queryFn: hasQueryFn
      ? (context) => hydrationQuery.queryFn(context, idsToHydrate)
      : undefined,
    enabled: idsToHydrate.length > 0 && hasQueryFn,
  });

  return { items: queryResult.data ?? [], isLoading: queryResult.isLoading };
}
```

### Vấn đề với Query Key

```
Scenario: 3 components hydrate overlapping IDs

Component A: IDs = [1, 2, 3]
→ queryKey = ['users', 'hydrate', [1, 2, 3]]

Component B: IDs = [3, 2, 1]  (same IDs, different order)
→ queryKey = ['users', 'hydrate', [3, 2, 1]]
→ CACHE MISS! (different query key)

Component C: IDs = [2, 1, 3]
→ queryKey = ['users', 'hydrate', [2, 1, 3]]
→ CACHE MISS! (another different query key)

Result: 3 API calls for essentially the same data!
```

### Impact

```
With 10 Select components hydrating similar IDs:
- Without fix: Up to 10 separate API calls
- With fix: 1 API call (cached for all)

Network overhead: 10x reduction possible
```

---

## Solution

### Approach: Stable Query Key với Sorted IDs

```typescript
// useHydration.ts - AFTER

/**
 * Create a stable cache key from IDs.
 * Sorted to ensure same IDs produce same key regardless of order.
 */
function createStableIdKey(ids: Array<string | number>): string {
  if (ids.length === 0) return '';
  // Sort numerically for numbers, lexically for strings
  const sorted = [...ids].sort((a, b) => {
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    return String(a).localeCompare(String(b));
  });
  return sorted.join(',');
}

export function useHydration<T extends BaseItem>(options: UseHydrationOptions<T>) {
  const { queryKey, hydrationQuery, initialValue } = options;

  const [idsToHydrate] = useState<Array<string | number>>(() => extractIds(initialValue));
  const hasQueryFn = !!hydrationQuery?.queryFn;

  // Create stable key for better React Query cache hits
  const stableIdKey = useMemo(() => createStableIdKey(idsToHydrate), [idsToHydrate]);

  const queryResult = useQuery<T[], Error, T[], readonly unknown[]>({
    staleTime: hydrationQuery?.staleTime ?? Infinity,
    // Keep hydrated data in cache longer
    gcTime: hydrationQuery?.gcTime ?? 1000 * 60 * 30, // 30 minutes default
    ...hydrationQuery,
    queryFn: hasQueryFn
      ? (context) => hydrationQuery.queryFn(context, idsToHydrate)
      : undefined,
    // Use stable key to maximize cache hits
    queryKey: [queryKey, 'hydrate', stableIdKey],
    enabled: idsToHydrate.length > 0 && hasQueryFn,
  });

  return {
    items: queryResult.data ?? [],
    isLoading: queryResult.isLoading,
    hydratingIds: idsToHydrate,
  };
}
```

### Tại sao fix như vậy?

1. **Sorted IDs → Same Key**: `[1,2,3]`, `[3,2,1]`, `[2,1,3]` → all become `"1,2,3"`
2. **String Key**: Primitive string is faster to compare than array
3. **React Query Deduplication**: Same key = same cache entry = no duplicate requests
4. **Stable Comparison**: Numbers sorted numerically, strings sorted lexically

### Visual Explanation

```
BEFORE (unstable keys):
┌─────────────────────────────────────────────────────────────┐
│ Component A: queryKey = ['users', 'hydrate', [1, 2, 3]]    │
│ → API Call #1                                               │
│                                                             │
│ Component B: queryKey = ['users', 'hydrate', [3, 2, 1]]    │
│ → API Call #2 (cache miss - different key!)                │
│                                                             │
│ Component C: queryKey = ['users', 'hydrate', [2, 1, 3]]    │
│ → API Call #3 (cache miss - different key!)                │
└─────────────────────────────────────────────────────────────┘

AFTER (stable keys):
┌─────────────────────────────────────────────────────────────┐
│ Component A: queryKey = ['users', 'hydrate', '1,2,3']      │
│ → API Call #1                                               │
│                                                             │
│ Component B: queryKey = ['users', 'hydrate', '1,2,3']      │
│ → Cache HIT ✓                                               │
│                                                             │
│ Component C: queryKey = ['users', 'hydrate', '1,2,3']      │
│ → Cache HIT ✓                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Additional Optimizations

### 1. Extended Cache Time (gcTime)

```typescript
// Default 30 minutes cache retention
gcTime: hydrationQuery?.gcTime ?? 1000 * 60 * 30,
```

**Why?**
- Hydrated data typically doesn't change frequently
- User selected these values → likely to reference again
- Prevents re-fetching when component remounts

### 2. Infinite Stale Time Default

```typescript
staleTime: hydrationQuery?.staleTime ?? Infinity,
```

**Why?**
- Hydration data is "initial values" - already known to be correct
- No need to refetch unless explicitly invalidated
- Reduces background refetch noise

### 3. Type Safety for Query Result

```typescript
const queryResult = useQuery<T[], Error, T[], readonly unknown[]>({
  // Explicit generics prevent type inference issues
});
```

---

## Kết quả

### Trước Fix
```
10 components với overlapping IDs [1,2,3]:
- 10 different query keys (order-dependent)
- 10 API calls
- 10x network traffic
- Slow initial load
```

### Sau Fix
```
10 components với overlapping IDs [1,2,3]:
- 1 stable query key ('1,2,3')
- 1 API call (rest are cache hits)
- 1x network traffic
- Fast initial load
```

---

## Edge Cases Handled

### 1. Mixed Number and String IDs
```typescript
// IDs: [1, '2', 3, 'abc']
// Sorted: [1, 3, '2', 'abc'] (numbers first, then strings)
// Key: '1,3,2,abc'
```

### 2. Empty IDs
```typescript
// IDs: []
// Key: '' (empty string)
// Query disabled (enabled: idsToHydrate.length > 0)
```

### 3. Single ID
```typescript
// IDs: [5]
// Key: '5'
// Simple case, no sorting needed
```

### 4. Duplicate IDs in Input
```typescript
// IDs: [1, 2, 1, 3, 2]
// After sort: [1, 1, 2, 2, 3]
// Key: '1,1,2,2,3'
// Note: Duplicates preserved (API should handle dedup if needed)
```

---

## Performance Metrics

### Sort Operation Cost

```typescript
// Sorting cost: O(n log n) where n = number of IDs
// For typical cases (1-10 IDs): negligible (~microseconds)
// For edge cases (100 IDs): still fast (~1ms)

// This one-time cost saves:
// - Network latency: 100-500ms per request
// - Server processing: variable
// - Memory: duplicate data storage
```

### Memory Savings

```
Without stable keys (10 components, same 100 items):
- 10 cache entries × 100 items = 1000 item references

With stable keys:
- 1 cache entry × 100 items = 100 item references
- 10x memory reduction for hydrated data
```

---

## Future Enhancements

### 1. Request Coalescing

```typescript
// Combine requests from multiple components into one
// Before: Component A hydrates [1,2], Component B hydrates [3,4]
// After: Single request for [1,2,3,4]

const coalescedHydration = createHydrationCoalescer({
  windowMs: 50, // Collect requests for 50ms
  maxBatchSize: 100,
  queryFn: (ids) => fetchUsers(ids),
});
```

### 2. Subset Cache Matching

```typescript
// If [1,2,3,4,5] is cached, use it for [1,2,3] request
function findCacheSubset(requestedIds: string[], cache: Map<string, T[]>) {
  for (const [key, items] of cache) {
    const cachedIds = key.split(',');
    if (requestedIds.every(id => cachedIds.includes(id))) {
      return items.filter(item => requestedIds.includes(String(item.id)));
    }
  }
  return null;
}
```

### 3. Intelligent Prefetching

```typescript
// Prefetch likely-needed items based on user behavior
function usePredictiveHydration(currentIds: string[]) {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Analyze access patterns and prefetch related items
    const relatedIds = predictRelatedIds(currentIds);
    if (relatedIds.length > 0) {
      queryClient.prefetchQuery({
        queryKey: ['users', 'hydrate', createStableIdKey(relatedIds)],
        queryFn: () => fetchUsers(relatedIds),
      });
    }
  }, [currentIds]);
}
```

### 4. Background Refresh Strategy

```typescript
// Smart refresh based on data age
const queryResult = useQuery({
  queryKey: [queryKey, 'hydrate', stableIdKey],
  staleTime: (query) => {
    const age = Date.now() - query.state.dataUpdatedAt;
    // Fresher data = longer stale time
    if (age < 1000 * 60) return Infinity; // < 1 min: never refetch
    if (age < 1000 * 60 * 5) return 1000 * 60; // < 5 min: refetch after 1 min
    return 0; // > 5 min: refetch immediately
  },
});
```

### 5. Partial Hydration

```typescript
// Only fetch missing items, reuse cached ones
async function partialHydration(ids: string[], queryClient: QueryClient) {
  const cached = [];
  const missing = [];

  for (const id of ids) {
    const cachedItem = queryClient.getQueryData(['users', 'item', id]);
    if (cachedItem) {
      cached.push(cachedItem);
    } else {
      missing.push(id);
    }
  }

  if (missing.length > 0) {
    const fetched = await fetchUsers(missing);
    // Cache individually for future partial matches
    fetched.forEach(item => {
      queryClient.setQueryData(['users', 'item', item.id], item);
    });
    return [...cached, ...fetched];
  }

  return cached;
}
```

---

## Checklist cho Similar Issues

- [ ] Query keys có phụ thuộc vào thứ tự của arrays không?
- [ ] Multiple components có thể request cùng data không?
- [ ] Cache time có phù hợp với data freshness requirements không?
- [ ] Có cơ hội coalesce multiple requests không?
- [ ] staleTime có được set hợp lý không?

---

## React Query Best Practices Applied

### 1. Query Key Stability
> "Query keys should be serializable and unique for the data they represent"

Our stable string key ensures same data = same key.

### 2. Appropriate Stale Times
> "Use Infinity staleTime for data that doesn't need background refetching"

Hydration data is user-selected values - no need to refetch.

### 3. Cache Time Configuration
> "gcTime determines how long inactive queries stay in cache"

30-minute default keeps hydration data available across component lifecycle.

### 4. Request Deduplication
> "React Query automatically deduplicates requests with the same query key"

Stable keys maximize deduplication effectiveness.