# Fix #4: Stale Closure - selectedValuesMetadata Effect

## Vấn đề

### Mô tả
`useEffect` chạy **SAU** render cycle, nhưng cascade delete có thể trigger **TRONG** render khi parent value thay đổi. Điều này tạo race condition: metadata chưa được sync trước khi cascade delete chạy.

### Code cũ có vấn đề

```typescript
// InfiniteWrapper.tsx - BEFORE

// Effect chạy SAU render
useEffect(() => {
  if (name && !infiniteResult.isHydrating && !isMetadataEmpty(selectedValuesMetadata)) {
    store.setValueMetadata(name, selectedValuesMetadata);
  }
}, [store, name, infiniteResult.isHydrating, selectedValuesMetadata]);
```

### Race Condition Timeline

```
Timeline:
─────────────────────────────────────────────────────────────────►

T0: Component mounts, hydration starts
T1: Hydration completes, isHydrating = false

    ┌─────────── React Render Phase ───────────┐
T2: │ selectedValuesMetadata computed          │
    │ (metadata có data đúng)                  │
    │                                          │
T3: │ Parent value changes                     │
    │ → Store triggers cascade delete          │
    │ → Metadata chưa được sync! (effect chưa │
    │   chạy)                                  │
    │ → Cascade delete dùng metadata CŨ/EMPTY │
    │ → XÓA NHẦM child values!                │
    └──────────────────────────────────────────┘

    ┌─────────── React Commit Phase ───────────┐
T4: │ useEffect runs                           │
    │ → Sync metadata (QUÁ MUỘN!)             │
    └──────────────────────────────────────────┘
```

### Tại sao đây là vấn đề?

1. **Effect Timing**: `useEffect` chạy sau browser paint, không phải trong render
2. **Cascade Delete Synchronous**: Store operations chạy synchronously
3. **Stale Metadata**: Cascade delete dùng metadata từ render trước
4. **Data Loss**: Child values bị xóa không đúng

---

## Solution

### Approach: Synchronous Metadata Sync trong Render Phase

```typescript
// InfiniteWrapper.tsx - AFTER

// Track hydration state changes
const prevIsHydratingRef = useRef(infiniteResult.isHydrating);
const hasHydrationCompletedRef = useRef(false);

// ... handleChange callback ...

// SYNC metadata TRONG render phase, không phải effect
if (name && prevIsHydratingRef.current && !infiniteResult.isHydrating) {
  // Hydration vừa complete - sync metadata NGAY LẬP TỨC
  const metadata = buildMetadataFromOptions(value, infiniteResult.options);
  if (!isMetadataEmpty(metadata)) {
    store.setValueMetadata(name, metadata);
  }
  hasHydrationCompletedRef.current = true;
}
prevIsHydratingRef.current = infiniteResult.isHydrating;

// KHÔNG có useEffect cho metadata sync
```

### Tại sao fix như vậy?

1. **Synchronous Execution**: Code trong render body chạy synchronously
2. **Before Cascade Delete**: Metadata được sync TRƯỚC khi bất kỳ cascade delete nào
3. **Transition Detection**: Dùng ref để detect `isHydrating: true → false`
4. **No Side Effects Issue**: `store.setValueMetadata` là safe trong render vì:
   - Không trigger re-render của component hiện tại
   - Chỉ update external store

### Visual Explanation

```
BEFORE (useEffect - async):
┌─────────────────────────────────────────────────────────┐
│ Render Phase                                            │
│ ├─ Compute metadata (value A)                          │
│ ├─ Parent changes                                       │
│ └─ Cascade delete runs (metadata EMPTY!)               │
│                                                         │
│ Commit Phase                                            │
│ └─ useEffect: sync metadata (TOO LATE!)                │
└─────────────────────────────────────────────────────────┘

AFTER (sync in render):
┌─────────────────────────────────────────────────────────┐
│ Render Phase                                            │
│ ├─ Detect hydration complete                           │
│ ├─ Sync metadata IMMEDIATELY ✓                         │
│ ├─ Parent changes                                       │
│ └─ Cascade delete runs (metadata CORRECT!)             │
│                                                         │
│ Commit Phase                                            │
│ └─ (no metadata effect needed)                         │
└─────────────────────────────────────────────────────────┘
```

---

## Kết quả

### Trước Fix
- Hydration complete → Effect scheduled
- Parent change → Cascade delete với stale metadata
- Result: Child values lost

### Sau Fix
- Hydration complete → Metadata synced immediately
- Parent change → Cascade delete với correct metadata
- Result: Only affected children updated

---

## Edge Cases Handled

### 1. Multiple Rapid Hydration Cycles
```typescript
// Ref tracks mỗi transition correctly
Render 1: isHydrating true → false → SYNC
Render 2: isHydrating stays false → NO SYNC (đã sync)
Render 3: isHydrating true (new query) → no sync yet
Render 4: isHydrating true → false → SYNC
```

### 2. Parent Change During Hydration
```typescript
// Không sync khi đang hydrating
if (prevIsHydratingRef.current && !infiniteResult.isHydrating) {
  // Chỉ khi hydration HOÀN THÀNH
}
// Parent change khi đang hydrate → metadata chưa có → đợi hydrate xong
```

### 3. Component Unmount Mid-Hydration
```typescript
// Không có cleanup needed vì:
// - Không có subscription
// - Store.setValueMetadata là idempotent
// - Next mount sẽ hydrate lại
```

---

## Side Effects trong Render: Safe hay Không?

### Khi NÀO safe:
```typescript
// ✅ Safe: Update external store, không trigger re-render của self
store.setValueMetadata(name, metadata);

// ✅ Safe: Update ref
prevIsHydratingRef.current = isHydrating;

// ✅ Safe: Logging (development)
console.log('hydration complete');
```

### Khi KHÔNG safe:
```typescript
// ❌ Unsafe: setState trong render
const [count, setCount] = useState(0);
setCount(count + 1); // Infinite loop!

// ❌ Unsafe: Trigger parent re-render
props.onChange(newValue); // Có thể gây cascade

// ❌ Unsafe: DOM manipulation
document.getElementById('x').style.color = 'red';
```

### Tại sao `store.setValueMetadata` safe?
1. **External Store**: Không phải React state
2. **No Self Re-render**: Store notify listeners, nhưng component này đã render
3. **Batched Updates**: React 18 tự động batch external updates
4. **Idempotent**: Gọi nhiều lần với cùng data = OK

---

## Future Enhancements

### 1. useSyncExternalStore cho Metadata
```typescript
// Thay vì sync trong render, subscribe to store
const metadata = useSyncExternalStore(
  store.subscribeToMetadata.bind(store, name),
  () => store.getValueMetadata(name),
);
```

### 2. React 19 use() cho Hydration
```typescript
// Với React 19 use() hook
const hydratedData = use(hydrationPromise);
// Automatic suspense, no manual isHydrating tracking
```

### 3. Signal-based Reactivity
```typescript
// Với signals (future React?)
const metadata$ = signal(null);

effect(() => {
  if (!isHydrating$.value) {
    metadata$.value = buildMetadata(value, options);
  }
});
```

### 4. Middleware Pattern
```typescript
// Intercept cascade delete
store.addMiddleware('cascade-delete', (action, next) => {
  // Ensure metadata synced before cascade
  ensureMetadataSynced(action.fieldName);
  return next(action);
});
```

---

## Checklist cho Similar Issues

- [ ] Có useEffect nào sync data cần thiết cho operations khác không?
- [ ] Operations khác có thể chạy trước effect không?
- [ ] Effect có thể convert thành sync code trong render không?
- [ ] Sync code đó có side effects nguy hiểm không?

Nếu cần sync TRƯỚC operations khác → Consider synchronous approach trong render.

---

## React Team Guidance

> "Effects are for synchronizing with external systems. If you're not connecting to any external system, you probably don't need an Effect."
> — React Docs

Trong case này:
- External system = XSelectStore
- Sync timing critical = Yes
- Solution = Sync trong render, không phải effect