# Fix #2: Race Condition - Metadata Sync from Options

## Vấn đề

### Mô tả
Khi user select một item từ search results, `handleChange` callback có thể có stale `infiniteResult.options` closure, dẫn đến metadata không được sync đúng hoặc cascade delete xóa nhầm.

### Code cũ có vấn đề

```typescript
// InfiniteWrapper.tsx - BEFORE
const handleChange = useCallback(
  (newValue: SelectValue) => {
    if (name) {
      // BUG: infiniteResult.options có thể STALE!
      const newMetadata = buildMetadataFromOptions(newValue, infiniteResult.options);
      if (!isMetadataEmpty(newMetadata)) {
        store.setValueMetadata(name, newMetadata);
      }
    }
    onChange?.(newValue);
  },
  [name, store, infiniteResult.options, onChange], // options trong deps nhưng closure vẫn stale
);
```

### Race Condition Scenario

```
Timeline:
─────────────────────────────────────────────────────────────────►

T0: User searches "abc"
T1: Search query fires, options = [searchResults]
T2: User clicks item from search results
T3: handleChange fires với STALE options (từ T0, không có search results)
T4: buildMetadataFromOptions không tìm thấy item → metadata EMPTY
T5: Cascade delete chạy với metadata rỗng → XÓA NHẦM child values!
```

### Tại sao đây là vấn đề?

1. **Closure Stale**: `useCallback` capture `infiniteResult.options` tại thời điểm tạo
2. **Search Results Transient**: Items từ search có thể chưa merge vào main options
3. **Cascade Delete Destructive**: Metadata rỗng = parent thay đổi = xóa tất cả children
4. **Silent Failure**: Không có error, chỉ data mất

---

## Solution

### Approach: Stable Options Map với Ref

```typescript
// InfiniteWrapper.tsx - AFTER

// 1. Tạo Map để lưu TẤT CẢ options đã từng thấy
const optionsMapRef = useRef<Map<string | number, InfiniteOption<T>>>(new Map());

// 2. Sync Map với options array (không clear, chỉ thêm mới)
useMemo(() => {
  const map = optionsMapRef.current;

  // Thêm mới (không xóa cũ - preserve search results!)
  for (const opt of infiniteResult.options) {
    map.set(opt.value, opt);
  }

  // Cleanup chỉ khi quá lớn (3x threshold)
  if (map.size > infiniteResult.options.length * 3) {
    const currentValues = new Set(infiniteResult.options.map(o => o.value));
    for (const key of map.keys()) {
      if (!currentValues.has(key)) {
        map.delete(key);
      }
    }
  }
}, [infiniteResult.options]);

// 3. handleChange sử dụng Map (không có closure stale)
const handleChange = useCallback(
  (newValue: SelectValue) => {
    if (name && newValue !== undefined && newValue !== null) {
      const selectedValues = Array.isArray(newValue) ? newValue : [newValue];
      const newMetadata: ValueMetadataMap = {};
      let hasMetadata = false;

      for (const val of selectedValues) {
        // O(1) lookup từ ref - LUÔN có latest data!
        const option = optionsMapRef.current.get(val as string | number);
        if (option?.parentValue !== undefined) {
          newMetadata[val as string | number] = {
            parentValue: option.parentValue,
          };
          hasMetadata = true;
        }
      }

      if (hasMetadata) {
        store.setValueMetadata(name, newMetadata);
      }
    }
    onChange?.(newValue);
  },
  [name, store, onChange], // KHÔNG có infiniteResult.options!
);
```

### Tại sao fix như vậy?

1. **Ref không có Closure Issue**: `optionsMapRef.current` luôn trả về latest Map
2. **Accumulative Storage**: Không clear Map = giữ lại search results đã fetch
3. **O(1) Lookup**: Map.get() thay vì Array.find() → performance tốt hơn
4. **Memory Bounded**: Cleanup khi size > 3x để tránh memory leak

### Visual Explanation

```
BEFORE (Closure Stale):
┌─────────────────────────────────────────────────────────┐
│ useCallback deps: [options]                             │
│                                                         │
│ T0: options = [A, B, C]                                 │
│     callback captures [A, B, C]                         │
│                                                         │
│ T1: search → options = [X, Y] (NEW)                     │
│     callback STILL has [A, B, C] (STALE!)               │
│                                                         │
│ T2: select X → lookup in [A, B, C] → NOT FOUND!         │
└─────────────────────────────────────────────────────────┘

AFTER (Ref Always Fresh):
┌─────────────────────────────────────────────────────────┐
│ useCallback deps: [name, store, onChange]               │
│ optionsMapRef.current (mutable, always latest)          │
│                                                         │
│ T0: Map = { A, B, C }                                   │
│                                                         │
│ T1: search → Map = { A, B, C, X, Y } (accumulated)      │
│                                                         │
│ T2: select X → lookup in Map → FOUND! ✓                 │
└─────────────────────────────────────────────────────────┘
```

---

## Kết quả

### Trước Fix
- Select từ search results: Metadata có thể empty
- Cascade delete: Có thể xóa nhầm child values
- User experience: Data loss không báo trước

### Sau Fix
- Select từ search results: Metadata luôn đúng
- Cascade delete: Chỉ xóa đúng children của parent thay đổi
- User experience: Data integrity đảm bảo

---

## Edge Cases Handled

### 1. User Select → Search → Select khác
```typescript
// Map tích lũy cả hai selections
Map: { firstSelection, ...searchResults }
```

### 2. Clear Search → Select lại item cũ
```typescript
// Item cũ vẫn trong Map
Map: { previousItems, searchItems } // searchItems chưa bị xóa
```

### 3. Rapid Selection Changes
```typescript
// Ref update synchronous, không có race
handleChange(A); // Map.get(A) → immediate
handleChange(B); // Map.get(B) → immediate
```

---

## Future Enhancements

### 1. LRU Cache với Max Size
```typescript
import { LRUCache } from 'lru-cache';

const optionsCacheRef = useRef(new LRUCache<string | number, InfiniteOption<T>>({
  max: 5000, // Hard limit
  ttl: 1000 * 60 * 30, // 30 minutes
}));
```

### 2. IndexedDB Persistence cho Large Datasets
```typescript
// Persist options across page reloads
useEffect(() => {
  if (optionsMapRef.current.size > 1000) {
    persistToIndexedDB('xselect-options', optionsMapRef.current);
  }
}, [infiniteResult.options]);
```

### 3. Optimistic Metadata Update
```typescript
const handleChange = useCallback((newValue) => {
  // Optimistic update
  store.setValueMetadata(name, buildOptimisticMetadata(newValue));

  // Verify async
  setTimeout(() => {
    const verified = buildMetadataFromOptions(newValue, latestOptions);
    if (!deepEqual(verified, optimistic)) {
      store.setValueMetadata(name, verified);
    }
  }, 0);
}, []);
```

### 4. Telemetry cho Race Condition Detection
```typescript
if (process.env.NODE_ENV === 'development') {
  const option = optionsMapRef.current.get(val);
  if (!option) {
    console.warn(
      `[XSelect] Option not found in Map. Potential race condition.`,
      { value: val, mapSize: optionsMapRef.current.size }
    );
  }
}
```

---

## Checklist cho Similar Issues

- [ ] `useCallback` có capture array/object từ hook results không?
- [ ] Array/object đó có thể thay đổi frequently không?
- [ ] Callback có thể được gọi với data mới trong khi closure cũ không?
- [ ] Có side effects quan trọng dựa trên lookup trong array không?

Nếu tất cả là YES → Consider Ref-based accumulative storage pattern.