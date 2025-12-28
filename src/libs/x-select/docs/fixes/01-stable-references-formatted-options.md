# Fix #1: Stable References - formattedOptions Re-render Issue

## Vấn đề

### Mô tả
Mỗi khi `infiniteResult.options` thay đổi (fetch new page, search, hydration complete), `formattedOptions` tạo mới **TẤT CẢ** objects trong array, dẫn đến re-render không cần thiết của Select component.

### Code cũ có vấn đề

```typescript
// InfiniteWrapper.tsx - BEFORE
const formattedOptions = useMemo(
  () =>
    infiniteResult.options.map((opt) => ({
      label: opt.label,  // Tạo object MỚI mỗi lần
      value: opt.value,
    })),
  [infiniteResult.options],
);
```

### Tại sao đây là vấn đề?

1. **Reference Equality**: Ant Design Select (và hầu hết UI libraries) sử dụng reference equality để detect changes
2. **Với 1000 options**: 1000 object allocations mỗi lần dependency thay đổi
3. **Memory Pressure**: Tạo nhiều garbage objects → GC pressure → potential jank
4. **Cascading Re-renders**: Parent re-render → children re-render (dropdown items)

### Impact với Large Data

| Options Count | Objects Created/Change | Memory Impact |
|---------------|------------------------|---------------|
| 100           | 100                    | ~4KB          |
| 1,000         | 1,000                  | ~40KB         |
| 10,000        | 10,000                 | ~400KB        |

---

## Solution

### Approach: Structural Sharing với Cache Map

```typescript
// InfiniteWrapper.tsx - AFTER
function useStableFormattedOptions<T extends BaseItem>(
  options: InfiniteOption<T>[],
): FormattedOption[] {
  // Cache lưu trữ options đã tạo
  const cacheRef = useRef<Map<string | number, FormattedOption>>(new Map());
  // Lưu result trước để compare
  const prevResultRef = useRef<FormattedOption[]>([]);

  return useMemo(() => {
    const cache = cacheRef.current;
    const result: FormattedOption[] = [];
    let hasChanged = options.length !== prevResultRef.current.length;

    for (let i = 0; i < options.length; i++) {
      const opt = options[i];
      const cached = cache.get(opt.value);

      // REUSE nếu label không đổi
      if (cached && cached.label === opt.label) {
        result.push(cached);
        if (!hasChanged && prevResultRef.current[i] !== cached) {
          hasChanged = true;
        }
      } else {
        // Chỉ tạo MỚI khi thực sự cần
        const newOption: FormattedOption = { label: opt.label, value: opt.value };
        cache.set(opt.value, newOption);
        result.push(newOption);
        hasChanged = true;
      }
    }

    // Cleanup stale entries
    if (cache.size > options.length * 2) {
      const currentValues = new Set(options.map(o => o.value));
      for (const key of cache.keys()) {
        if (!currentValues.has(key)) {
          cache.delete(key);
        }
      }
    }

    // Return SAME reference nếu không có thay đổi thực sự
    if (!hasChanged) {
      return prevResultRef.current;
    }

    prevResultRef.current = result;
    return result;
  }, [options]);
}
```

### Tại sao fix như vậy?

1. **Cache Map**: Lưu trữ options theo `value` key → O(1) lookup
2. **Reference Reuse**: Nếu `label` không đổi, reuse object cũ → same reference
3. **Array Stability**: Nếu không có thay đổi thực sự, return array cũ
4. **Memory Bounded**: Cleanup khi cache > 2x current size

### Performance Comparison

| Scenario | Before | After |
|----------|--------|-------|
| Load page 2 (100 items) | 200 objects | 100 objects (chỉ page mới) |
| Search (filter 50) | 50 objects | 0 objects (reuse) |
| Clear search | 200 objects | 0 objects (reuse từ cache) |

---

## Kết quả

### Trước Fix
- Mỗi page load: N object allocations
- Search/filter: N object allocations
- Dropdown re-render mỗi lần

### Sau Fix
- Mỗi page load: Chỉ items mới
- Search/filter: 0 allocations (reuse)
- Dropdown chỉ re-render khi data thực sự thay đổi

---

## Future Enhancements

### 1. WeakMap for Memory Efficiency
```typescript
// Potential future optimization
const cacheRef = useRef<WeakMap<InfiniteOption<T>, FormattedOption>>(new WeakMap());
```
- Pro: Auto cleanup khi source object bị GC
- Con: Không thể iterate, cần track keys separately

### 2. Immutable.js Integration
```typescript
import { List, Record } from 'immutable';

const FormattedOptionRecord = Record({ label: '', value: '' });
// Structural sharing built-in
```

### 3. React Compiler (React 19+)
```typescript
// Khi React Compiler stable, có thể tự động optimize
const formattedOptions = options.map(opt => ({
  label: opt.label,
  value: opt.value,
}));
// Compiler sẽ tự thêm memoization
```

### 4. Metrics/Profiling Hook
```typescript
// Development only
if (process.env.NODE_ENV === 'development') {
  useEffect(() => {
    const reusedCount = result.filter((_, i) =>
      prevResultRef.current[i] === result[i]
    ).length;
    console.debug(`[useStableFormattedOptions] Reused: ${reusedCount}/${result.length}`);
  }, [result]);
}
```

---

## Checklist cho Similar Issues

- [ ] Có `.map()` tạo objects mới trong useMemo không?
- [ ] Objects có được pass xuống child components không?
- [ ] Child components có sử dụng React.memo không?
- [ ] Data source có thay đổi frequently không?

Nếu tất cả là YES → Consider structural sharing pattern này.